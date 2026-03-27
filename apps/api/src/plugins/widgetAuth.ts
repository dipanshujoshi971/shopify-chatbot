/**
 * widgetAuthPlugin
 *
 * Security gate for all /widget/* routes.
 *
 * Flow:
 *   1. Extract publishable API key from X-Widget-Key header (or ?widgetKey param)
 *   2. Validate key format
 *   3. Check Valkey cache (hot path — no DB round-trip)
 *   4. On cache miss: single query against public.merchants (key + status in one go)
 *   5. Validate Origin hostname matches merchant's registered shop_domain
 *   6. Attach tenantId + shopDomain to request for downstream handlers
 *   7. Populate Valkey cache for subsequent requests
 *
 * DB fix: the original code called createDbClient() inside the onRequest hook,
 * creating a new connection pool on every single widget request.  This version
 * imports the module-level singleton instead.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Redis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { merchants } from '@chatbot/db';
import { db } from '../db.js';              // ← singleton, not per-request
import { getCachedApiKey, setCachedApiKey } from '../lib/apiKeyCache.js';

// --------------------------------------------------------------------------
// Options
// --------------------------------------------------------------------------

interface WidgetAuthPluginOptions {
  valkey: Redis;
}

// --------------------------------------------------------------------------
// Key extraction
// --------------------------------------------------------------------------

function extractApiKey(request: FastifyRequest): string | null {
  const header = request.headers['x-widget-key'];
  if (typeof header === 'string' && header.length > 0) return header;

  const query = (request.query as Record<string, string>)['widgetKey'];
  if (typeof query === 'string' && query.length > 0) return query;

  return null;
}

const KEY_REGEX = /^pk_[A-Za-z0-9_-]{20,64}$/;

// --------------------------------------------------------------------------
// Origin validation
// --------------------------------------------------------------------------

function parseOriginHostname(origin: string): string | null {
  if (!origin || origin === 'null') return null;
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isOriginAllowed(originHostname: string, shopDomain: string): boolean {
  return originHostname === shopDomain.toLowerCase();
}

// --------------------------------------------------------------------------
// Plugin
// --------------------------------------------------------------------------

async function widgetAuthPlugin(
  fastify: FastifyInstance,
  opts: WidgetAuthPluginOptions,
): Promise<void> {
  const { valkey } = opts;

  fastify.addHook(
    'onRequest',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      // 1. Extract key
      const publishableKey = extractApiKey(request);
      if (!publishableKey) {
        return reply.code(401).send({
          error:   'Unauthorised',
          message: 'Missing widget API key. Provide X-Widget-Key header.',
        });
      }

      // 2. Format check
      if (!KEY_REGEX.test(publishableKey)) {
        return reply.code(401).send({
          error:   'Unauthorised',
          message: 'Invalid API key format.',
        });
      }

      // 3. Valkey cache (hot path)
      let tenantId:   string;
      let shopDomain: string;

      const cached = await getCachedApiKey(valkey, publishableKey).catch((err) => {
        request.log.warn({ err }, 'widgetAuth: Valkey get failed, falling through to DB');
        return null;
      });

      if (cached) {
        tenantId   = cached.tenantId;
        shopDomain = cached.shopDomain;
      } else {
        // 4. DB lookup — single query that returns id, shopDomain, AND status
        //    (original code did two separate queries)
        let merchant: { id: string; shopDomain: string } | undefined;

        try {
          const rows = await db
            .select({
              id:         merchants.id,
              shopDomain: merchants.shopDomain,
              status:     merchants.status,
            })
            .from(merchants)
            .where(eq(merchants.publishableApiKey, publishableKey))
            .limit(1);

          const row = rows[0];
          if (row?.status === 'active') {
            merchant = { id: row.id, shopDomain: row.shopDomain };
          }
        } catch (err) {
          request.log.error({ err }, 'widgetAuth: DB lookup failed');
          return reply.code(503).send({
            error:   'Service Unavailable',
            message: 'Unable to validate API key. Please retry.',
          });
        }

        if (!merchant) {
          return reply.code(401).send({
            error:   'Unauthorised',
            message: 'Invalid or inactive API key.',
          });
        }

        tenantId   = merchant.id;
        shopDomain = merchant.shopDomain;

        // 5. Populate cache (fire-and-forget)
        setCachedApiKey(valkey, publishableKey, { tenantId, shopDomain }).catch(
          (err) => request.log.warn({ err }, 'widgetAuth: Valkey set failed'),
        );
      }

      // 6. Origin validation
      const rawOrigin = request.headers['origin'];

      if (!rawOrigin) {
        return reply.code(403).send({
          error:   'Forbidden',
          message: 'Origin header is required for widget API requests.',
        });
      }

      const originHostname = parseOriginHostname(rawOrigin);

      if (!originHostname) {
        return reply.code(403).send({
          error:   'Forbidden',
          message: 'Malformed or opaque Origin header.',
        });
      }

      if (!isOriginAllowed(originHostname, shopDomain)) {
        request.log.warn(
          { originHostname, shopDomain, tenantId },
          'widgetAuth: Origin mismatch — possible key leak or misconfiguration',
        );
        return reply.code(403).send({
          error:   'Forbidden',
          message: `Origin "${rawOrigin}" is not authorised for this API key.`,
        });
      }

      // 7. Attach tenant context
      request.tenantId   = tenantId;
      request.shopDomain = shopDomain;
      request.log = request.log.child({ tenantId, shopDomain });
    },
  );
}

export default fp(widgetAuthPlugin, {
  name:    'widgetAuth',
  fastify: '5.x',
});