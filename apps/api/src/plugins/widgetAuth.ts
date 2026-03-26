/**
 * widgetAuthPlugin
 *
 * Security gate for all /widget/* routes.
 *
 * Flow:
 *   1. Extract publishable API key from X-Widget-Key header (or ?widgetKey param)
 *   2. Validate key format
 *   3. Check Valkey cache (hot path — no DB round-trip)
 *   4. On cache miss: query public.merchants via Drizzle, verify key is active
 *   5. Validate Origin hostname matches merchant's registered shop_domain
 *   6. Attach tenantId + shopDomain to request for downstream handlers
 *   7. Populate Valkey cache for subsequent requests
 *
 * What this deliberately does NOT do:
 *   - Rate limiting (separate rateLimitPlugin per-tenant)
 *   - Session/JWT auth (chat sessions are keyed by conversationId)
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Redis } from 'ioredis';
import { eq } from 'drizzle-orm';
import { createDbClient, merchants } from '@chatbot/db';
import { env } from '../env.js';
import { getCachedApiKey, setCachedApiKey } from '../lib/apiKeyCache.js';

// --------------------------------------------------------------------------
// Options
// --------------------------------------------------------------------------

interface WidgetAuthPluginOptions {
  /** ioredis / Valkey client — already initialised in valkey.ts */
  valkey: Redis;
}

// --------------------------------------------------------------------------
// Key extraction
// --------------------------------------------------------------------------

/**
 * Extract the publishable API key from the request.
 *
 * Widget JS sends it as a custom header on every request:
 *   X-Widget-Key: pk_xxxxxxxxxxxxxx
 *
 * As a fallback (e.g. EventSource / SSE connections that can't set headers)
 * the key may appear as a query param:  ?widgetKey=pk_xxxxxxxxxxxxxx
 *
 * We never read from the body — that would require parsing before auth,
 * opening a DoS vector via oversized bodies.
 */
function extractApiKey(request: FastifyRequest): string | null {
  const header = request.headers['x-widget-key'];
  if (typeof header === 'string' && header.length > 0) return header;

  const query = (request.query as Record<string, string>)['widgetKey'];
  if (typeof query === 'string' && query.length > 0) return query;

  return null;
}

/**
 * Keys are issued in auth.ts as:
 *   `pk_${nanoid(32)}`
 *
 * nanoid(32) uses the default alphabet [A-Za-z0-9_-] and is 32 chars long.
 * The regex accepts 20–64 chars to stay forward-compatible with key rotations.
 */
const KEY_REGEX = /^pk_[A-Za-z0-9_-]{20,64}$/;

// --------------------------------------------------------------------------
// Origin validation
// --------------------------------------------------------------------------

/**
 * Extract hostname from an Origin header value.
 *
 * "https://acme-shop.myshopify.com" → "acme-shop.myshopify.com"
 * "null" (sandboxed iframe)         → null
 * malformed                         → null
 */
function parseOriginHostname(origin: string): string | null {
  if (!origin || origin === 'null') return null;
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Check whether the request origin is allowed for this merchant.
 *
 * Exact match against shop_domain is sufficient for myshopify.com storefronts.
 * When custom-domain support ships, add an `allowedDomains: string[]` column
 * and extend this check accordingly.
 */
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
      // ----------------------------------------------------------------
      // 1. Extract the publishable API key
      // ----------------------------------------------------------------
      const publishableKey = extractApiKey(request);

      if (!publishableKey) {
        return reply.code(401).send({
          error: 'Unauthorised',
          message: 'Missing widget API key. Provide X-Widget-Key header.',
        });
      }

      // ----------------------------------------------------------------
      // 2. Validate key format before hitting cache or DB
      // ----------------------------------------------------------------
      if (!KEY_REGEX.test(publishableKey)) {
        return reply.code(401).send({
          error: 'Unauthorised',
          message: 'Invalid API key format.',
        });
      }

      // ----------------------------------------------------------------
      // 3. Cache lookup (hot path)
      // ----------------------------------------------------------------
      let tenantId: string;
      let shopDomain: string;

      const cached = await getCachedApiKey(valkey, publishableKey).catch((err) => {
        // Valkey unavailable — degrade gracefully to DB path
        request.log.warn({ err }, 'widgetAuth: Valkey get failed, falling through to DB');
        return null;
      });

      if (cached) {
        tenantId = cached.tenantId;
        shopDomain = cached.shopDomain;
      } else {
        // ----------------------------------------------------------------
        // 4. DB lookup on cache miss — uses Drizzle exactly like auth.ts
        // ----------------------------------------------------------------
        let merchant: { id: string; shopDomain: string } | undefined;

        try {
          const { db } = createDbClient(env.DATABASE_URL);
          const rows = await db
            .select({ id: merchants.id, shopDomain: merchants.shopDomain })
            .from(merchants)
            .where(eq(merchants.publishableApiKey, publishableKey))
            .limit(1);

          // Only serve active merchants — frozen/deleted = denied
          const row = rows[0];
          if (row) {
            // Re-query status separately to avoid over-selecting
            const statusRows = await db
              .select({ status: merchants.status })
              .from(merchants)
              .where(eq(merchants.id, row.id))
              .limit(1);
            merchant = statusRows[0]?.status === 'active' ? row : undefined;
          }
        } catch (err) {
          request.log.error({ err }, 'widgetAuth: DB lookup failed');
          return reply.code(503).send({
            error: 'Service Unavailable',
            message: 'Unable to validate API key. Please retry.',
          });
        }

        if (!merchant) {
          // Don't reveal whether the key exists but is inactive vs. unknown
          return reply.code(401).send({
            error: 'Unauthorised',
            message: 'Invalid or inactive API key.',
          });
        }

        tenantId = merchant.id;
        shopDomain = merchant.shopDomain;

        // ----------------------------------------------------------------
        // 5. Populate cache — fire-and-forget; don't fail the request if
        //    Valkey is down at this point either
        // ----------------------------------------------------------------
        setCachedApiKey(valkey, publishableKey, { tenantId, shopDomain }).catch(
          (err) => request.log.warn({ err }, 'widgetAuth: Valkey set failed'),
        );
      }

      // ----------------------------------------------------------------
      // 6. Origin validation
      //
      // The Origin header is set by browsers on all cross-origin requests
      // and cannot be forged by JavaScript running in a page. A missing
      // Origin is only normal for same-origin requests or non-browser
      // clients (curl, Postman). We deny missing origins on widget routes
      // because a legitimate browser-embedded widget always sends one.
      // ----------------------------------------------------------------
      const rawOrigin = request.headers['origin'];

      if (!rawOrigin) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Origin header is required for widget API requests.',
        });
      }

      const originHostname = parseOriginHostname(rawOrigin);

      if (!originHostname) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Malformed or opaque Origin header.',
        });
      }

      if (!isOriginAllowed(originHostname, shopDomain)) {
        // Log with context so misconfigurations (e.g. custom domains) are easy to spot
        request.log.warn(
          { originHostname, shopDomain, tenantId },
          'widgetAuth: Origin mismatch — possible key leak or misconfiguration',
        );
        return reply.code(403).send({
          error: 'Forbidden',
          message: `Origin "${rawOrigin}" is not authorised for this API key.`,
        });
      }

      // ----------------------------------------------------------------
      // 7. Attach tenant context to request — all downstream handlers
      //    get request.tenantId and request.shopDomain for free.
      // ----------------------------------------------------------------
      request.tenantId = tenantId;
      request.shopDomain = shopDomain;

      // Enrich every subsequent pino log line in this request
      request.log = request.log.child({ tenantId, shopDomain });
    },
  );
}

export default fp(widgetAuthPlugin, {
  name: 'widgetAuth',
  fastify: '5.x',
});