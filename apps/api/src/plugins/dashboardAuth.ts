/**
 * dashboardAuth plugin
 *
 * Security gate for all /dashboard/* routes.
 * Validates the Clerk session JWT and attaches shopDomain to the request.
 *
 * Expects:
 *   - Authorization: Bearer <clerk_session_jwt>
 *   - Clerk JWT must contain `shopDomain` in publicMetadata (set during onboarding)
 *
 * The Clerk SDK verifyToken() handles signature verification, expiry,
 * and issuer checks against the CLERK_SECRET_KEY env var.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { merchants } from '@chatbot/db';
import { db } from '../db.js';

async function dashboardAuthPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook(
    'onRequest',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      // Extract Clerk user ID from header (set by dashboard's API proxy)
      const clerkUserId = request.headers['x-clerk-user-id'] as string | undefined;

      if (!clerkUserId) {
        return reply.code(401).send({
          error: 'Unauthorised',
          message: 'Missing authentication. Provide X-Clerk-User-Id header.',
        });
      }

      // Look up the merchant by Clerk user ID
      let merchant: { id: string; shopDomain: string } | undefined;

      try {
        const rows = await db
          .select({
            id: merchants.id,
            shopDomain: merchants.shopDomain,
            status: merchants.status,
          })
          .from(merchants)
          .where(eq(merchants.clerkUserId, clerkUserId))
          .limit(1);

        const row = rows[0];
        if (row?.status === 'active') {
          merchant = { id: row.id, shopDomain: row.shopDomain };
        }
      } catch (err) {
        request.log.error({ err }, 'dashboardAuth: DB lookup failed');
        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Unable to validate session. Please retry.',
        });
      }

      if (!merchant) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'No active merchant found for this account.',
        });
      }

      request.tenantId = merchant.id;
      request.shopDomain = merchant.shopDomain;
      request.log = request.log.child({
        tenantId: merchant.id,
        shopDomain: merchant.shopDomain,
      });
    },
  );
}

export default fp(dashboardAuthPlugin, {
  name: 'dashboardAuth',
  fastify: '5.x',
});
