import type { FastifyPluginAsync } from 'fastify';
import { eq, merchants, auditLog } from '@chatbot/db';
import { nanoid } from 'nanoid';
import { env } from '../env.js';
import { db, pgPool } from '../db.js';       // ← shared pool, no per-handler pools
import { verifyShopifyWebhookHmac } from '../lib/shopify.js';

// ─── Type augmentation ────────────────────────────────────────────────────────
declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

const webhookRoutes: FastifyPluginAsync = async (app) => {

  // ── Raw body capture ─────────────────────────────────────────────────────
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body, done) => {
      req.rawBody = body as Buffer;
      try {
        done(null, JSON.parse(body.toString('utf8')));
      } catch {
        const err = Object.assign(new Error('Invalid JSON'), { statusCode: 400 });
        done(err, undefined);
      }
    }
  );

  // ── HMAC verification (all webhook routes) ───────────────────────────────
  app.addHook('preHandler', async (request, reply) => {
    const hmac = request.headers['x-shopify-hmac-sha256'] as string | undefined;

    if (!hmac || !request.rawBody) {
      request.log.warn({ url: request.url }, 'Webhook missing HMAC or body');
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    if (!verifyShopifyWebhookHmac(request.rawBody, hmac)) {
      request.log.warn({ url: request.url }, 'Webhook HMAC verification failed');
      return reply.code(401).send({ error: 'Invalid HMAC' });
    }
  });

  // ─── app/uninstalled ─────────────────────────────────────────────────────
  app.post('/api/webhooks/shopify/app-uninstalled', async (request, reply) => {
    const shop      = request.headers['x-shopify-shop-domain'] as string;
    const webhookId = request.headers['x-shopify-webhook-id'] as string;

    request.log.info({ shop }, 'app/uninstalled received');

    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.shopDomain, shop))
      .limit(1);

    if (!merchant)                   return reply.code(200).send();
    if (merchant.status === 'frozen') return reply.code(200).send();

    await db.update(merchants)
      .set({ status: 'frozen', frozenAt: new Date(), updatedAt: new Date() })
      .where(eq(merchants.shopDomain, shop));

    await db.insert(auditLog).values({
      id:       nanoid(),
      tenantId: merchant.id,
      actor:    'shopify',
      action:   'merchant.frozen',
      metadata: JSON.stringify({ shop, webhookId, reason: 'app_uninstalled' }),
    });

    request.log.info({ shop, merchantId: merchant.id }, 'Merchant frozen — 30-day grace period started');
    return reply.code(200).send();
  });

  // ─── shop/redact ──────────────────────────────────────────────────────────
  app.post('/api/webhooks/shopify/shop-redact', async (request, reply) => {
    const body = request.body as { shop_domain: string; shop_id: number };
    const shop  = body.shop_domain;

    request.log.info({ shop }, 'shop/redact received');

    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.shopDomain, shop))
      .limit(1);

    if (!merchant) {
      request.log.warn({ shop }, 'shop/redact: merchant not found — already deleted?');
      return reply.code(200).send();
    }

    // Drop the entire tenant schema via shared pool (no separate pool needed)
    const safeName = merchant.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
    await pgPool.unsafe(`DROP SCHEMA IF EXISTS "tenant_${safeName}" CASCADE`);
    request.log.info({ shop, schema: `tenant_${safeName}` }, 'Tenant schema dropped');

    await db.insert(auditLog).values({
      id:       nanoid(),
      tenantId: merchant.id,
      actor:    'shopify',
      action:   'tenant.schema_dropped',
      metadata: JSON.stringify({ shop, reason: 'shop_redact' }),
    });

    return reply.code(200).send();
  });

  // ─── customers/redact ────────────────────────────────────────────────────
  app.post('/api/webhooks/shopify/customers-redact', async (request, reply) => {
    const body = request.body as {
      shop_domain: string;
      customer:    { id: number; email: string; phone?: string };
      orders_to_redact: number[];
    };

    const { shop_domain: shop, customer } = body;
    request.log.info({ shop, customerId: customer.id }, 'customers/redact received');

    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.shopDomain, shop))
      .limit(1);

    if (!merchant) return reply.code(200).send();

    await db.insert(auditLog).values({
      id:       nanoid(),
      tenantId: merchant.id,
      actor:    'shopify',
      action:   'customer.redact_requested',
      metadata: JSON.stringify({ shop, customerId: customer.id }),
    });

    return reply.code(200).send();
  });

  // ─── customers/data_request ──────────────────────────────────────────────
  app.post('/api/webhooks/shopify/customers-data-request', async (request, reply) => {
    const body = request.body as {
      shop_domain:  string;
      customer:     { id: number; email: string };
      data_request: { id: number };
    };

    const { shop_domain: shop, customer, data_request } = body;
    request.log.info({ shop, customerId: customer.id }, 'customers/data_request received');

    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.shopDomain, shop))
      .limit(1);

    if (!merchant) return reply.code(200).send();

    await db.insert(auditLog).values({
      id:       nanoid(),
      tenantId: merchant.id,
      actor:    'shopify',
      action:   'customer.data_requested',
      metadata: JSON.stringify({ shop, customerId: customer.id, requestId: data_request.id }),
    });

    return reply.code(200).send();
  });

  // ─── products/create · products/update · products/delete ─────────────────
  app.post('/api/webhooks/shopify/products', async (request, reply) => {
    const shop      = request.headers['x-shopify-shop-domain'] as string;
    const topic     = request.headers['x-shopify-topic'] as string;
    const webhookId = request.headers['x-shopify-webhook-id'] as string;
    const body      = request.body as Record<string, unknown>;

    request.log.info({ shop, topic }, 'Product webhook received');

    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.shopDomain, shop))
      .limit(1);

    if (!merchant || merchant.status !== 'active') return reply.code(200).send();

    const safeName = merchant.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');

    // Idempotency via shared pool — no per-handler pool created
    const claimed = await pgPool.unsafe(`
      INSERT INTO "tenant_${safeName}"."webhook_events"
        (id, idempotency_key, source, event_type)
      VALUES ($1, $2, 'shopify', $3)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id
    `, [nanoid(), webhookId, topic]);

    if (!claimed[0]) {
      request.log.info({ webhookId, topic }, 'Duplicate webhook — skipping');
      return reply.code(200).send();
    }

    if (topic === 'products/delete') {
      await pgPool.unsafe(`
        DELETE FROM "tenant_${safeName}"."products"
        WHERE shopify_product_id = $1
      `, [String(body['id'])]);
      request.log.info({ shop, productId: body['id'] }, 'Product deleted');
    } else {
      const productId = nanoid();
      const shopifyId = String(body['id']);
      const title     = String(body['title'] ?? '');
      const description = (body['body_html'] as string | null) ?? null;
      const variants  = body['variants'] as Array<{ price: string }> | undefined;
      const price     = variants?.[0]?.price ?? '0.00';
      const image     = body['image'] as { src: string } | null | undefined;
      const imageUrl  = image?.src ?? null;

      await pgPool.unsafe(`
        INSERT INTO "tenant_${safeName}"."products"
          (id, shopify_product_id, title, description, price, image_url, in_stock, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, now())
        ON CONFLICT (shopify_product_id) DO UPDATE SET
          title       = EXCLUDED.title,
          description = EXCLUDED.description,
          price       = EXCLUDED.price,
          image_url   = EXCLUDED.image_url,
          updated_at  = now()
      `, [productId, shopifyId, title, description, price, imageUrl]);

      request.log.info({ shop, shopifyId, topic }, 'Product upserted');
    }

    return reply.code(200).send();
  });

  // ─── inventory_levels/update ─────────────────────────────────────────────
  app.post('/api/webhooks/shopify/inventory', async (request, reply) => {
    const shop      = request.headers['x-shopify-shop-domain'] as string;
    const webhookId = request.headers['x-shopify-webhook-id'] as string;
    const body      = request.body as {
      inventory_item_id: number;
      location_id:       number;
      available:         number;
    };

    const [merchant] = await db.select()
      .from(merchants)
      .where(eq(merchants.shopDomain, shop))
      .limit(1);

    if (!merchant || merchant.status !== 'active') return reply.code(200).send();

    const safeName = merchant.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');

    const claimed = await pgPool.unsafe(`
      INSERT INTO "tenant_${safeName}"."webhook_events"
        (id, idempotency_key, source, event_type)
      VALUES ($1, $2, 'shopify', 'inventory_levels/update')
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id
    `, [nanoid(), webhookId]);

    if (!claimed[0]) return reply.code(200).send();

    const inStock = (body.available ?? 0) > 0;
    request.log.info(
      { shop, inventoryItemId: body.inventory_item_id, inStock },
      'Inventory update acknowledged (in_stock sync pending Phase 3 variant tracking)',
    );

    return reply.code(200).send();
  });

};

export default webhookRoutes;