// POST /widget/chat
// Requires widgetAuth middleware (sets request.tenantId + request.shopDomain).
// Streams Claude Haiku responses in Vercel AI SDK data-stream format.

import type { FastifyPluginAsync } from 'fastify';
import { streamText, type CoreMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import postgres from 'postgres';
import { Readable } from 'node:stream';
import { nanoid } from 'nanoid';
import { createDbClient, merchants, eq } from '@chatbot/db';
import { env } from '../../env.js';
import { buildSystemPrompt } from '../../lib/systemPrompt.js';
import { createTools } from '../../lib/tools.js';

// ─── Token budgets per plan (tokens per conversation) ─────────────────────────
// -1 means unlimited. Phase 3: read these from a plan_features table.
const TOKEN_BUDGET: Record<string, number> = {
  starter:    10_000,
  growth:     50_000,
  pro:        -1,
  enterprise: -1,
};

// Max history messages sent to the model (keeps context window manageable)
const MAX_HISTORY = 20;

const chatRoutes: FastifyPluginAsync = async (app) => {

  app.post(
    '/chat',
    {
      schema: {
        body: {
          type: 'object',
          required: ['message', 'sessionId'],
          properties: {
            message:        { type: 'string', minLength: 1, maxLength: 2000 },
            sessionId:      { type: 'string', minLength: 1, maxLength: 128 },
            conversationId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { tenantId, shopDomain } = request;
      const body = request.body as {
        message: string;
        sessionId: string;
        conversationId?: string;
      };

      // Safe schema name — same derivation used throughout the codebase
      const safeName = tenantId.replace('store_', '').replace(/[^a-z0-9_]/g, '_');

      // One postgres connection shared across all queries in this request,
      // including tool executions. Closed when stream drains or errors.
      const sql = postgres(env.DATABASE_URL, {
        max: 3,
        prepare: false,
        idle_timeout: 20,
        connect_timeout: 2,
      });

      // Guard against double-close
      let sqlEnded = false;
      const endSql = () => {
        if (!sqlEnded) {
          sqlEnded = true;
          sql.end().catch(() => {});
        }
      };

      try {
        // ── 1. Load agent_config ──────────────────────────────────────────────
        const configRows = await sql.unsafe(
          `SELECT bot_name, tone, custom_instructions, use_emojis
             FROM "tenant_${safeName}"."agent_config"
            WHERE id = 'singleton'`,
        ) as any[];

        // Defaults match agent_config table defaults in schema/tenant.ts
        const cfg = configRows[0] ?? {
          bot_name:            'Assistant',
          tone:                'friendly',
          custom_instructions: null,
          use_emojis:          false,
        };

        // ── 2. Load merchant plan + encrypted Shopify token ───────────────────
        const { db } = createDbClient(env.DATABASE_URL);
        const [merchant] = await db
          .select({
            encryptedShopifyToken: merchants.encryptedShopifyToken,
            planId:                merchants.planId,
          })
          .from(merchants)
          .where(eq(merchants.id, tenantId))
          .limit(1);

        const planId = merchant?.planId ?? 'starter';
        const budget = TOKEN_BUDGET[planId] ?? TOKEN_BUDGET.starter;

        // ── 3. Load or create conversation ────────────────────────────────────
        let conversationId = body.conversationId;
        let currentTokens  = 0;

        if (conversationId) {
          const [conv] = await sql.unsafe(
            `SELECT id, total_tokens_used, status
               FROM "tenant_${safeName}"."conversations"
              WHERE id = $1`,
            [conversationId],
          ) as any[];

          if (!conv) {
            endSql();
            return reply.code(404).send({ error: 'Conversation not found' });
          }
          if (conv.status !== 'active') {
            endSql();
            return reply.code(400).send({ error: 'Conversation is closed' });
          }
          currentTokens = conv.total_tokens_used ?? 0;

        } else {
          conversationId = nanoid();
          await sql.unsafe(
            `INSERT INTO "tenant_${safeName}"."conversations"
               (id, session_id, status, total_tokens_used, total_turns, created_at, updated_at)
             VALUES ($1, $2, 'active', 0, 0, now(), now())`,
            [conversationId, body.sessionId],
          );
        }

        // ── 4. Token budget check ─────────────────────────────────────────────
        if (budget !== -1 && currentTokens >= budget) {
          endSql();
          return reply.code(429).send({
            error:   'Token budget exceeded',
            message: 'This conversation has reached its limit. Please start a new one.',
          });
        }

        // ── 5. Load conversation history (chronological order for the model) ──
        const historyRows = await sql.unsafe(
          `SELECT role, content
             FROM "tenant_${safeName}"."messages"
            WHERE conversation_id = $1
            ORDER BY created_at DESC
            LIMIT $2`,
          [conversationId, MAX_HISTORY],
        ) as any[];

        const history: CoreMessage[] = historyRows
          .reverse()                          // DESC → ASC (oldest first)
          .map((row: any): CoreMessage => {
            // content is stored as MessageContent JSON — extract text for AI SDK
            let text = row.content as string;
            try {
              const parsed = JSON.parse(row.content);
              text = parsed.type === 'text' ? parsed.text : JSON.stringify(parsed);
            } catch { /* plain string is fine */ }

            return { role: row.role as 'user' | 'assistant', content: text };
          });

        // ── 6. Save the incoming user message immediately ─────────────────────
        await sql.unsafe(
          `INSERT INTO "tenant_${safeName}"."messages"
             (id, conversation_id, role, content, created_at)
           VALUES ($1, $2, 'user', $3, now())`,
          [
            nanoid(),
            conversationId,
            JSON.stringify({ type: 'text', text: body.message }),
          ],
        );

        // ── 7. Build system prompt + tools ────────────────────────────────────
        const systemPrompt = buildSystemPrompt(
          {
            botName:            cfg.bot_name,
            tone:               cfg.tone,
            customInstructions: cfg.custom_instructions,
            useEmojis:          cfg.use_emojis,
          },
          shopDomain,
        );

        const tools = createTools({
          tenantId,
          shopDomain,
          sql,
          encryptedShopifyToken: merchant?.encryptedShopifyToken ?? null,
        });

        // ── 8. Call Claude Haiku via Vercel AI SDK ────────────────────────────
        const result = streamText({
          model: anthropic('claude-haiku-4-5-20251001'),
          system: systemPrompt,
          messages: [
            ...history,
            { role: 'user', content: body.message },
          ],
          tools,
          maxSteps: 5,   // allows multi-turn tool calls (e.g. search → respond)

          onFinish: async ({ text, usage }) => {
            // Fires when the model finishes — safe to write to DB here
            const tokensUsed =
              (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0);

            await sql.unsafe(
              `INSERT INTO "tenant_${safeName}"."messages"
                 (id, conversation_id, role, content, created_at)
               VALUES ($1, $2, 'assistant', $3, now())`,
              [
                nanoid(),
                conversationId,
                JSON.stringify({ type: 'text', text }),
              ],
            );

            await sql.unsafe(
              `UPDATE "tenant_${safeName}"."conversations"
                  SET total_tokens_used = total_tokens_used + $1,
                      total_turns       = total_turns + 1,
                      updated_at        = now()
                WHERE id = $2`,
              [tokensUsed, conversationId],
            );
          },
        });

        // ── 9. Stream response to client ──────────────────────────────────────
        // Vercel AI SDK returns a Web ReadableStream — convert to Node.js Readable
        // so Fastify can pipe it directly to the HTTP response.
        const nodeStream = Readable.fromWeb(result.toDataStream() as any);

        nodeStream.on('end',   endSql);
        nodeStream.on('error', endSql);

        // X-Conversation-Id lets the widget JS track the conversation across turns
        return reply
          .header('Content-Type',           'text/plain; charset=utf-8')
          .header('X-Vercel-AI-Data-Stream', 'v1')
          .header('Cache-Control',           'no-cache, no-transform')
          .header('X-Conversation-Id',        conversationId)
          .send(nodeStream);

      } catch (err) {
        endSql();
        request.log.error({ err }, 'widget/chat error');
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );
};

export default chatRoutes;