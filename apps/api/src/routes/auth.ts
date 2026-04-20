import type { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { valkey } from '../valkey.js';
import { provisionTenantSchema } from '@chatbot/db';
import { merchants, auditLog, eq } from '@chatbot/db';
import { db } from '../db.js';              // ← singleton, no per-request pool
import { env } from '../env.js';
import {
  buildInstallUrl,
  exchangeCodeForToken,
  verifyShopifyHmac,
  isValidShopDomain,
  encryptToken,
  registerWebhooks,
} from '../lib/shopify.js';

const authRoutes: FastifyPluginAsync = async (app) => {

  app.get('/api/auth/shopify/install', async (request, reply) => {
    const { shop } = request.query as { shop?: string };

    if (!shop || !isValidShopDomain(shop)) {
      return reply.code(400).send({ error: 'Invalid shop domain' });
    }

    // If the merchant already has an ACTIVE record (returning user clicking
    // the app in Shopify admin), skip OAuth and send them straight to the
    // dashboard. Frozen/uninstalled merchants must re-run OAuth so the token
    // is refreshed and status is flipped back to 'active'.
    const existing = await db
      .select({
        id: merchants.id,
        encryptedShopifyToken: merchants.encryptedShopifyToken,
        status: merchants.status,
      })
      .from(merchants)
      .where(eq(merchants.shopDomain, shop))
      .limit(1);

    if (existing[0]?.encryptedShopifyToken && existing[0].status === 'active') {
      request.log.info({ shop }, 'Merchant already installed — redirecting to dashboard');
      const isSecure = env.NODE_ENV === 'production';
      reply.header(
        'Set-Cookie',
        `pending_shop=${shop}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${isSecure ? '; Secure' : ''}`,
      );
      const dashboardUrl = env.ALLOWED_ORIGINS.split(',')[0].trim();
      return reply.redirect(`${dashboardUrl}/sign-up`);
    }

    // New install — start OAuth flow
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

    // 3 — Verify state (CSRF protection)
    const storedShop = await valkey.get(`oauth_state:${state}`);
    if (!storedShop || storedShop !== shop) {
      request.log.warn({ shop, state }, 'State mismatch on Shopify callback');
      return reply.code(401).send({ error: 'Invalid state' });
    }
    await valkey.del(`oauth_state:${state}`);

    // 4 — Exchange code for expiring offline token + refresh token
    const tokens = await exchangeCodeForToken(shop, code);

    // 5 — Register webhooks (use raw token — needed for Admin API call)
    try {
      await registerWebhooks(shop, tokens.access_token, request.log);
      request.log.info({ shop }, 'Webhooks registered');
    } catch (err) {
      request.log.warn({ shop, err }, 'Failed to register some webhooks');
    }

    // 6 — Encrypt tokens for storage
    const now = Date.now();
    const encryptedToken        = encryptToken(tokens.access_token);
    const encryptedRefreshToken = encryptToken(tokens.refresh_token);
    const tokenExpiresAt        = new Date(now + tokens.expires_in * 1000);
    const refreshTokenExpiresAt = new Date(now + tokens.refresh_token_expires_in * 1000);

    // 7 — Upsert merchant using the singleton db (no new pool created)
    const merchantId        = `store_${shop.replace('.myshopify.com', '').replace(/[^a-z0-9]/g, '_')}`;
    const publishableApiKey = `pk_${nanoid(32)}`;

    // Was this merchant already linked to a Clerk account on a prior install?
    // If yes, send them to /sign-in; if brand-new, /sign-up.
    const priorLink = await db
      .select({ clerkUserId: merchants.clerkUserId })
      .from(merchants)
      .where(eq(merchants.shopDomain, shop))
      .limit(1);
    const hasClerkAccount = !!priorLink[0]?.clerkUserId;

    await db.insert(merchants).values({
      id:                             merchantId,
      shopDomain:                     shop,
      status:                         'active',
      planId:                         'starter',
      publishableApiKey,
      encryptedShopifyToken:          encryptedToken,
      shopifyTokenExpiresAt:          tokenExpiresAt,
      encryptedShopifyRefreshToken:   encryptedRefreshToken,
      shopifyRefreshTokenExpiresAt:   refreshTokenExpiresAt,
    }).onConflictDoUpdate({
      target: merchants.shopDomain,
      set: {
        status:                         'active',
        encryptedShopifyToken:          encryptedToken,
        shopifyTokenExpiresAt:          tokenExpiresAt,
        encryptedShopifyRefreshToken:   encryptedRefreshToken,
        shopifyRefreshTokenExpiresAt:   refreshTokenExpiresAt,
        frozenAt:                       null,
        updatedAt:                      new Date(),
      },
    });

    // 8 — Provision tenant schema + all tables
    const storeId = merchantId.replace('store_', '');
    await provisionTenantSchema(env.DATABASE_URL, storeId);
    request.log.info({ shop, merchantId }, 'Tenant schema provisioned');

    // 9 — Write audit log
    await db.insert(auditLog).values({
      id:       nanoid(),
      tenantId: merchantId,
      actor:    'system',
      action:   'tenant.created',
      metadata: JSON.stringify({ shop, plan: 'starter' }),
    });

    request.log.info({ shop, merchantId }, 'OAuth complete — merchant ready');

    // Set a short-lived cookie so the dashboard can auto-connect the store
    // after the merchant completes Clerk sign-up/sign-in.
    const isSecure = env.NODE_ENV === 'production';
    reply.header(
      'Set-Cookie',
      `pending_shop=${shop}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${isSecure ? '; Secure' : ''}`,
    );

    // Returning merchant with linked Clerk account → sign-in
    // Brand-new merchant → sign-up
    const dashboardUrl = env.ALLOWED_ORIGINS.split(',')[0].trim();
    const authPath = hasClerkAccount ? '/sign-in' : '/sign-up';
    return reply.redirect(`${dashboardUrl}${authPath}`);
  });

};

export default authRoutes;