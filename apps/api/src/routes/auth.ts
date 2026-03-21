import type { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { valkey } from '../valkey.js';
import { createDbClient, provisionTenantSchema } from '@chatbot/db';
import { merchants, auditLog } from '@chatbot/db';
import { env } from '../env.js';
import {
  buildInstallUrl,
  exchangeCodeForToken,
  verifyShopifyHmac,
  isValidShopDomain,
  encryptToken,
} from '../lib/shopify.js';

const authRoutes: FastifyPluginAsync = async (app) => {

  app.get('/api/auth/shopify/install', async (request, reply) => {
    const { shop } = request.query as { shop?: string };

    if (!shop || !isValidShopDomain(shop)) {
      return reply.code(400).send({ error: 'Invalid shop domain' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    await valkey.set(`oauth_state:${state}`, shop, 'EX', 600);

    const installUrl = buildInstallUrl(shop, state);
    request.log.info({ shop }, 'Starting Shopify OAuth install');
    return reply.redirect(installUrl);
  });

  app.get('/api/auth/shopify/callback', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const { shop, code, state } = query;

    // 1 — Verify HMAC
    if (!verifyShopifyHmac(query)) {
      request.log.warn({ shop }, 'Invalid HMAC on Shopify callback');
      return reply.code(401).send({ error: 'Invalid HMAC' });
    }

    // 2 — Validate shop domain
    if (!shop || !isValidShopDomain(shop)) {
      return reply.code(400).send({ error: 'Invalid shop domain' });
    }

    // 3 — Verify state
    const storedShop = await valkey.get(`oauth_state:${state}`);
    if (!storedShop || storedShop !== shop) {
      request.log.warn({ shop, state }, 'State mismatch on Shopify callback');
      return reply.code(401).send({ error: 'Invalid state' });
    }
    await valkey.del(`oauth_state:${state}`);

    // 4 — Exchange code for token
    const accessToken = await exchangeCodeForToken(shop, code);
    const encryptedToken = encryptToken(accessToken);

    // 5 — Save merchant to Postgres
    const { db } = createDbClient(env.DATABASE_URL);

    const merchantId = `store_${shop.replace('.myshopify.com', '').replace(/[^a-z0-9]/g, '_')}`;
    const publishableApiKey = `pk_${nanoid(32)}`;

    await db.insert(merchants).values({
      id: merchantId,
      shopDomain: shop,
      status: 'active',
      planId: 'starter',
      publishableApiKey,
    }).onConflictDoUpdate({
      target: merchants.shopDomain,
      set: {
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // 6 — Create tenant schema — uses raw postgres, no drizzle version conflict
    await provisionTenantSchema(env.DATABASE_URL, merchantId.replace('store_', ''));
    request.log.info({ shop, merchantId }, 'Tenant schema created');

    // 7 — Write audit log
    await db.insert(auditLog).values({
      id: nanoid(),
      tenantId: merchantId,
      actor: 'system',
      action: 'tenant.created',
      metadata: JSON.stringify({ shop, plan: 'starter' }),
    });

    request.log.info({ shop, merchantId }, 'Merchant saved to Postgres');

    // 8 — Redirect to dashboard
    return reply.redirect(`${env.ALLOWED_ORIGINS}/dashboard?shop=${shop}`);
  });

};

export default authRoutes;