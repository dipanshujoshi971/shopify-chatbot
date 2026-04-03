/**
 * apps/api/src/routes/widget/config.ts
 *
 * GET /widget/config
 * Returns the widget appearance configuration for the authenticated tenant.
 * The widget calls this on init to load theme color, position, greeting,
 * starter questions, bot name, etc.
 *
 * Protected by widgetAuth (API key + origin check).
 */

import type { FastifyPluginAsync } from 'fastify';
import { pgPool } from '../../db.js';

const configRoutes: FastifyPluginAsync = async (app) => {
  app.get('/config', async (request, reply) => {
    const { tenantId, shopDomain } = request;
    const safeName = tenantId.replace('store_', '').replace(/[^a-z0-9_]/g, '_');

    try {
      // Ensure widget_config column exists
      await pgPool.unsafe(
        `ALTER TABLE "tenant_${safeName}"."agent_config"
         ADD COLUMN IF NOT EXISTS widget_config JSONB DEFAULT '{}'::jsonb`,
      );

      const rows = await pgPool.unsafe(
        `SELECT bot_name, tone, use_emojis, custom_instructions,
                COALESCE(widget_config, '{}'::jsonb) AS widget_config
           FROM "tenant_${safeName}"."agent_config"
          WHERE id = 'singleton'`,
      ) as any[];

      const row = rows[0];

      if (!row) {
        return reply.send({
          botName: 'Assistant',
          tone: 'friendly',
          useEmojis: false,
          greeting: 'Hi there! How can I help you today?',
          themeColor: '#059669',
          position: 'right',
          mode: 'light',
          starterButtons: [],
        });
      }

      const wc = row.widget_config ?? {};

      return reply.send({
        botName: row.bot_name ?? 'Assistant',
        tone: row.tone ?? 'friendly',
        useEmojis: row.use_emojis ?? false,
        greeting: wc.greeting ?? 'Hi there! How can I help you today?',
        themeColor: wc.themeColor ?? wc.theme ?? '#059669',
        position: wc.position ?? 'right',
        mode: wc.mode ?? 'light',
        starterButtons: wc.starterButtons ?? [],
        customInstructions: row.custom_instructions ?? null,
      });
    } catch (err) {
      request.log.error({ err, tenantId }, 'widget/config: failed to load config');
      // Return sensible defaults on error
      return reply.send({
        botName: 'Assistant',
        tone: 'friendly',
        useEmojis: false,
        greeting: 'Hi there! How can I help you today?',
        themeColor: '#059669',
        position: 'right',
        mode: 'light',
        starterButtons: [],
      });
    }
  });

  // POST /widget/ticket — customer raises a ticket to the merchant
  app.post(
    '/ticket',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'subject', 'message'],
          properties: {
            email: { type: 'string', minLength: 1, maxLength: 320 },
            subject: { type: 'string', minLength: 1, maxLength: 500 },
            message: { type: 'string', minLength: 1, maxLength: 5000 },
            conversationId: { type: 'string' },
            sessionId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { tenantId } = request;
      const safeName = tenantId.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
      const body = request.body as {
        email: string;
        subject: string;
        message: string;
        conversationId?: string;
        sessionId?: string;
      };

      try {
        // Ensure columns exist
        await pgPool.unsafe(
          `ALTER TABLE "tenant_${safeName}"."support_tickets"
           ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '',
           ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'customer',
           ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'`,
        );

        const ticketId = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

        await pgPool.unsafe(
          `INSERT INTO "tenant_${safeName}"."support_tickets"
             (id, customer_email, customer_message, subject, ticket_type,
              conversation_id, status, priority, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'customer', $5, 'open', 'normal', now(), now())`,
          [ticketId, body.email, body.message, body.subject, body.conversationId ?? null],
        );

        return reply.send({
          success: true,
          ticketId,
          message: 'Your ticket has been submitted. We will get back to you soon!',
        });
      } catch (err) {
        request.log.error({ err, tenantId }, 'widget/ticket: failed to create ticket');
        return reply.code(500).send({
          success: false,
          message: 'Could not submit your ticket. Please try again.',
        });
      }
    },
  );
};

export default configRoutes;
