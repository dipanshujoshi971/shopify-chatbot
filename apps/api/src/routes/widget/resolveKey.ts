/**
 * GET /widget/resolve-key?shop=xxx.myshopify.com
 *
 * Public (no auth) endpoint that returns the publishable API key for a shop.
 * Used by the widget when embedded via the theme app extension (which can't
 * pass the API key directly because the OAuth app and extension app have
 * different client IDs).
 */

import type { FastifyPluginAsync } from 'fastify';
import { db } from '../../db.js';
import { merchants, eq } from '@chatbot/db';

const resolveKeyRoute: FastifyPluginAsync = async (app) => {
  app.get('/widget/resolve-key', async (request, reply) => {
    const { shop } = request.query as { shop?: string };

    if (!shop || !/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
      return reply.code(400).send({ error: 'Invalid shop domain' });
    }

    const rows = await db
      .select({ publishableApiKey: merchants.publishableApiKey })
      .from(merchants)
      .where(eq(merchants.shopDomain, shop))
      .limit(1);

    if (!rows[0]) {
      return reply.code(404).send({ error: 'Shop not found' });
    }

    // Cache for 5 minutes — key rarely changes
    reply.header('Cache-Control', 'public, max-age=300');
    return reply.send({ apiKey: rows[0].publishableApiKey });
  });
};

export default resolveKeyRoute;
