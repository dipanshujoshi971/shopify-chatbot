import type { FastifyPluginAsync } from 'fastify';
import { eq, merchants, auditLog } from '@chatbot/db';
import { nanoid } from 'nanoid';
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

    const safeName = merchant.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
    const customerId = String(customer.id);

    // Delete messages belonging to conversations with this customer
    const deletedMessages = await pgPool.unsafe(`
      DELETE FROM "tenant_${safeName}"."messages"
      WHERE conversation_id IN (
        SELECT id FROM "tenant_${safeName}"."conversations"
        WHERE customer_id = $1
      )
    `, [customerId]);

    // Delete support tickets linked to this customer's email
    if (customer.email) {
      await pgPool.unsafe(`
        DELETE FROM "tenant_${safeName}"."support_tickets"
        WHERE customer_email = $1
      `, [customer.email]);
    }

    // Delete conversations for this customer
    const deletedConversations = await pgPool.unsafe(`
      DELETE FROM "tenant_${safeName}"."conversations"
      WHERE customer_id = $1
    `, [customerId]);

    await db.insert(auditLog).values({
      id:       nanoid(),
      tenantId: merchant.id,
      actor:    'shopify',
      action:   'customer.redacted',
      metadata: JSON.stringify({
        shop,
        customerId: customer.id,
        deletedConversations: deletedConversations?.length ?? 0,
        deletedMessages: deletedMessages?.length ?? 0,
      }),
    });

    request.log.info(
      { shop, customerId: customer.id },
      'Customer data redacted',
    );
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

    const safeName = merchant.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
    const customerId = String(customer.id);

    // Gather all customer data from tenant schema
    const conversations = await pgPool.unsafe(`
      SELECT id, session_id, status, total_tokens_used, total_turns, created_at
      FROM "tenant_${safeName}"."conversations"
      WHERE customer_id = $1
      ORDER BY created_at DESC
    `, [customerId]);

    const conversationIds = conversations.map((c: Record<string, unknown>) => c.id as string);

    let messages: unknown[] = [];
    if (conversationIds.length > 0) {
      messages = await pgPool.unsafe(`
        SELECT id, conversation_id, role, content, created_at
        FROM "tenant_${safeName}"."messages"
        WHERE conversation_id = ANY($1)
        ORDER BY created_at ASC
      `, [conversationIds]);
    }

    const tickets = await pgPool.unsafe(`
      SELECT id, customer_email, customer_message, status, created_at
      FROM "tenant_${safeName}"."support_tickets"
      WHERE customer_email = $1
      ORDER BY created_at DESC
    `, [customer.email]);

    const customerData = {
      customer: { id: customer.id, email: customer.email },
      conversations,
      messages,
      support_tickets: tickets,
    };

    await db.insert(auditLog).values({
      id:       nanoid(),
      tenantId: merchant.id,
      actor:    'shopify',
      action:   'customer.data_exported',
      metadata: JSON.stringify({
        shop,
        customerId: customer.id,
        requestId:  data_request.id,
        recordCount: {
          conversations: conversations.length,
          messages:      messages.length,
          tickets:       tickets.length,
        },
        export: customerData,
      }),
    });

    request.log.info(
      { shop, customerId: customer.id, records: conversations.length + messages.length + tickets.length },
      'Customer data export prepared',
    );
    return reply.code(200).send();
  });

  // Note: Product discovery uses Shopify Storefront MCP (real-time catalog data).
  // No product/inventory webhook handlers needed — the chatbot always queries
  // live Shopify data via MCP, so there's no local product cache to keep in sync.

};

export default webhookRoutes;