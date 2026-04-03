/**
 * apps/api/src/routes/widget/chat.ts
 *
 * POST /widget/chat
 * Requires widgetAuth middleware (sets request.tenantId + request.shopDomain).
 * Streams LLM responses in Vercel AI SDK data-stream format.
 *
 * Fixes applied:
 *   1. closeStreamData() helper prevents double-close between onError + onFinish
 *   2. onError handler logs the real LLM error instead of swallowing it
 *   3. onFinish DB writes wrapped in try/catch so a DB failure can't corrupt the stream
 *   4. tokensUsed guarded with Number.isFinite() to prevent NaN → Postgres integer error
 *   5. onStepFinish only appends structured tool results the widget can render
 */

import type { FastifyPluginAsync } from 'fastify';
import { streamText, StreamData, type CoreMessage } from 'ai';
import { Readable }    from 'node:stream';
import { nanoid }      from 'nanoid';
import { merchants, eq } from '@chatbot/db';
import { valkey }      from '../../valkey.js';
import { db, pgPool }  from '../../db.js';
import { buildSystemPrompt }        from '../../lib/systemPrompt.js';
import { createAdminTools }         from '../../lib/tools.js';
import { createStorefrontMCPTools } from '../../lib/storefrontTools.js';
import { getLLMModel, getLLMInfo }  from '../../lib/llm.js';

// ── Plan token budgets (tokens per conversation) ──────────────────────────────
const PLAN_BUDGET: Record<string, number> = {
  starter:    10_000,
  growth:     50_000,
  pro:        -1,
  enterprise: -1,
};

const HARD_LIMITS = {
  maxTurns:        30,
  maxTotalTokens:  15_000,
  maxCharsPerTurn: 8_000,
  maxSteps:        8,
} as const;

const MAX_HISTORY = 20;

const budgetKey = (tenantId: string, conversationId: string) =>
  `budget:${tenantId}:${conversationId}`;

// ─────────────────────────────────────────────────────────────────────────────

const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/chat',
    {
      schema: {
        body: {
          type: 'object',
          required: ['message', 'sessionId'],
          properties: {
            message:        { type: 'string', minLength: 1, maxLength: 8000 },
            sessionId:      { type: 'string', minLength: 1, maxLength: 128 },
            conversationId: { type: 'string' },
            cartId:         { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { tenantId, shopDomain } = request;
      const body = request.body as {
        message:         string;
        sessionId:       string;
        conversationId?: string;
        cartId?:         string;
      };

      const safeName = tenantId.replace('store_', '').replace(/[^a-z0-9_]/g, '_');

      // ── Fast Valkey pre-check ─────────────────────────────────────────────
      if (body.conversationId) {
        try {
          const cached = await valkey.hgetall(budgetKey(tenantId, body.conversationId));

          if (cached && 'turns' in cached) {
            const cachedTurns  = parseInt(cached.turns  ?? '0', 10);
            const cachedTokens = parseInt(cached.tokens ?? '0', 10);

            if (cachedTurns >= HARD_LIMITS.maxTurns) {
              return reply.code(429).send({
                error:   'Turn limit reached',
                message: 'This conversation has reached its turn limit. Please start a new one.',
              });
            }

            if (cachedTokens >= HARD_LIMITS.maxTotalTokens) {
              return reply.code(429).send({
                error:   'Token limit reached',
                message: 'This conversation has reached its token limit. Please start a new one.',
              });
            }
          }
        } catch (err) {
          request.log.warn({ err }, 'chat: Valkey budget pre-check failed, continuing to DB');
        }
      }

      // ── 1. Load agent_config ──────────────────────────────────────────────
      const configRows = await pgPool.unsafe(
        `SELECT bot_name, tone, custom_instructions, use_emojis
           FROM "tenant_${safeName}"."agent_config"
          WHERE id = 'singleton'`,
      ) as any[];

      const cfg = configRows[0] ?? {
        bot_name:            'Assistant',
        tone:                'friendly',
        custom_instructions: null,
        use_emojis:          false,
      };

      // ── 2. Load merchant plan + encrypted Shopify token ───────────────────
      const [merchant] = await db
        .select({
          encryptedShopifyToken: merchants.encryptedShopifyToken,
          planId:                merchants.planId,
        })
        .from(merchants)
        .where(eq(merchants.id, tenantId))
        .limit(1);

      const planId     = merchant?.planId ?? 'starter';
      const planBudget = PLAN_BUDGET[planId] ?? PLAN_BUDGET.starter;

      // ── 3. Resolve conversation ───────────────────────────────────────────
      const conversationId = body.conversationId ?? nanoid();
      let currentTurns       = 0;
      let currentTotalTokens = 0;

      if (!body.conversationId) {
        // Case (a): brand-new conversation, no ID from client
        await pgPool.unsafe(
          `INSERT INTO "tenant_${safeName}"."conversations"
             (id, session_id, status, total_tokens_used, total_turns, created_at, updated_at)
           VALUES ($1, $2, 'active', 0, 0, now(), now())`,
          [conversationId, body.sessionId],
        );
      } else {
        // Cases (b) and (c): client supplied an ID
        const [conv] = await pgPool.unsafe(
          `SELECT id, total_tokens_used, total_turns, status
             FROM "tenant_${safeName}"."conversations"
            WHERE id = $1`,
          [conversationId],
        ) as any[];

        if (!conv) {
          // Case (c): client-generated ID, row doesn't exist yet — create it
          request.log.info({ conversationId }, 'chat: client-supplied conversationId not found — creating new conversation');
          await pgPool.unsafe(
            `INSERT INTO "tenant_${safeName}"."conversations"
               (id, session_id, status, total_tokens_used, total_turns, created_at, updated_at)
             VALUES ($1, $2, 'active', 0, 0, now(), now())`,
            [conversationId, body.sessionId],
          );
        } else {
          // Case (b): existing conversation — validate status and load budgets
          if (conv.status !== 'active') {
            return reply.code(400).send({ error: 'Conversation is closed' });
          }
          currentTurns       = conv.total_turns       ?? 0;
          currentTotalTokens = conv.total_tokens_used ?? 0;
        }
      }

      // ── DB-level budget checks (authoritative) ────────────────────────────
      if (currentTurns >= HARD_LIMITS.maxTurns) {
        return reply.code(429).send({
          error:   'Turn limit reached',
          message: 'This conversation has reached its turn limit. Please start a new one.',
        });
      }
      if (currentTotalTokens >= HARD_LIMITS.maxTotalTokens) {
        return reply.code(429).send({
          error:   'Token limit reached',
          message: 'This conversation has reached its token limit. Please start a new one.',
        });
      }
      if (planBudget !== -1 && currentTotalTokens >= planBudget) {
        return reply.code(429).send({
          error:   'Token budget exceeded',
          message: 'This conversation has reached its plan limit. Please start a new one.',
        });
      }

      // ── 4. Load conversation history ──────────────────────────────────────
      const historyRows = await pgPool.unsafe(
        `SELECT role, content
           FROM "tenant_${safeName}"."messages"
          WHERE conversation_id = $1
          ORDER BY created_at DESC
          LIMIT $2`,
        [conversationId, MAX_HISTORY],
      ) as any[];

      const history: CoreMessage[] = historyRows
        .reverse()
        .map((row: any): CoreMessage => {
          let text = row.content as string;
          try {
            const parsed = JSON.parse(row.content);
            text = parsed.type === 'text' ? parsed.text : JSON.stringify(parsed);
          } catch { /* plain string is fine */ }
          return { role: row.role as 'user' | 'assistant', content: text };
        });

      // ── 5. Persist the incoming user message immediately ──────────────────
      await pgPool.unsafe(
        `INSERT INTO "tenant_${safeName}"."messages"
           (id, conversation_id, role, content, created_at)
         VALUES ($1, $2, 'user', $3, now())`,
        [nanoid(), conversationId, JSON.stringify({ type: 'text', text: body.message })],
      );

      // ── 6. Build system prompt ────────────────────────────────────────────
      const systemPrompt = buildSystemPrompt(
        {
          botName:            cfg.bot_name,
          tone:               cfg.tone,
          customInstructions: cfg.custom_instructions,
          useEmojis:          cfg.use_emojis,
        },
        shopDomain,
      );

      // ── 7. Build tools ────────────────────────────────────────────────────
      const mcpTools   = createStorefrontMCPTools(shopDomain);
      const adminTools = createAdminTools({
        tenantId,
        shopDomain,
        sql:                   pgPool,
        encryptedShopifyToken: merchant?.encryptedShopifyToken ?? null,
      });

      const tools = { ...mcpTools, ...adminTools };

      // ── 8. Optionally inject cart context ─────────────────────────────────
      const userMessage = body.cartId
        ? `[cart_id: ${body.cartId}]\n${body.message}`
        : body.message;

      // ── 9. StreamData for tool annotations ────────────────────────────────
      //
      // FIX: Use a close-once helper so that onError and onFinish can both
      // call it safely without throwing "already closed" errors.
      //
      const streamData = new StreamData();
      let streamDataClosed = false;
      const closeStreamData = () => {
        if (!streamDataClosed) {
          streamDataClosed = true;
          streamData.close();
        }
      };

      const llmInfo = getLLMInfo('fast');
      request.log.info({ tenantId, conversationId, ...llmInfo }, 'chat_stream_start');

      // ── 10. Call LLM via Vercel AI SDK ────────────────────────────────────
      const result = streamText({
        model:    getLLMModel('fast'),
        system:   systemPrompt,
        messages: [
          ...history,
          { role: 'user', content: userMessage },
        ],
        tools,
        maxSteps: HARD_LIMITS.maxSteps,

        // FIX: Catch real LLM errors and log them. Without this the SDK
        // emits a generic "3:An error occurred." line and the widget shows
        // a vague warning. Now the real cause is visible in the API logs.
        onError: ({ error }) => {
          request.log.error(
            { tenantId, conversationId, err: error },
            'chat: streamText error',
          );
          closeStreamData();
        },

        // FIX: Only append tool results that the widget knows how to render.
        // The Shopify MCP storefront tools return plain text — appending them
        // as annotations makes the widget try (and fail) to render a carousel.
        // get_order_status returns a structured object the OrderCard can use.
        onStepFinish: async ({ toolResults }) => {
          if (!toolResults?.length) return;
          for (const tr of toolResults) {
            request.log.info(
              { toolName: tr.toolName, resultType: typeof tr.result, hasProducts: !!(tr.result as any)?.__shopbot_products },
              'chat: onStepFinish tool result',
            );

            // search_shop_catalog: extract parsed products for carousel
            if (tr.toolName === 'search_shop_catalog') {
              const result = tr.result as any;
              if (result?.__shopbot_products?.length > 0) {
                request.log.info(
                  { productCount: result.__shopbot_products.length },
                  'chat: forwarding product carousel annotation',
                );
                const safePayload = JSON.parse(JSON.stringify({
                  type      : 'tool_result',
                  toolName  : 'search_shop_catalog',
                  toolCallId: tr.toolCallId,
                  result    : {
                    products: result.__shopbot_products,
                    query:    result.__shopbot_query ?? '',
                  },
                }));
                streamData.append(safePayload);
              } else {
                request.log.warn(
                  { resultKeys: result && typeof result === 'object' ? Object.keys(result) : typeof result },
                  'chat: search_shop_catalog returned no __shopbot_products',
                );
              }
            }
            // get_order_status, get_cart, update_cart: forward directly
            if (tr.toolName === 'get_order_status' || tr.toolName === 'get_cart' || tr.toolName === 'update_cart') {
              const safePayload = JSON.parse(JSON.stringify({
                type      : 'tool_result',
                toolName  : tr.toolName,
                toolCallId: tr.toolCallId,
                result    : tr.result,
              }));
              streamData.append(safePayload);
            }
          }
        },

        onFinish: async ({ text, usage }) => {
          // FIX: close first so the HTTP stream terminates before the DB
          // writes — the client never waits for DB persistence anyway.
          closeStreamData();

          // FIX: Guard against NaN. With OpenAI multi-step tool calls,
          // usage can contain undefined values. undefined + undefined = NaN,
          // which Postgres rejects as "invalid input syntax for type integer".
          const rawTokens  = (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0);
          const tokensUsed = Number.isFinite(rawTokens) ? rawTokens : 0;

          const newTurns  = currentTurns + 1;
          const newTokens = currentTotalTokens + tokensUsed;

          // Valkey budget counters — fire-and-forget, never block the stream
          valkey
            .pipeline()
            .hset(budgetKey(tenantId, conversationId), 'turns', String(newTurns), 'tokens', String(newTokens))
            .expire(budgetKey(tenantId, conversationId), 86_400)
            .exec()
            .catch((err) =>
              request.log.warn({ err }, 'chat: Valkey budget update failed'),
            );

          // FIX: Wrap DB writes in try/catch. An unhandled rejection here
          // previously caused Fastify to emit a "response terminated with
          // an error with headers already sent" warning and corrupted the
          // stream close signal, leaving the widget stuck in loading state.
          try {
            await pgPool.unsafe(
              `INSERT INTO "tenant_${safeName}"."messages"
                 (id, conversation_id, role, content, created_at)
               VALUES ($1, $2, 'assistant', $3, now())`,
              [nanoid(), conversationId, JSON.stringify({ type: 'text', text })],
            );

            await pgPool.unsafe(
              `UPDATE "tenant_${safeName}"."conversations"
                  SET total_tokens_used = total_tokens_used + $1,
                      total_turns       = total_turns + 1,
                      updated_at        = now()
                WHERE id = $2`,
              [tokensUsed, conversationId],
            );
          } catch (err) {
            request.log.error({ err, tenantId, conversationId }, 'chat: onFinish DB write failed');
          }

          request.log.info(
            { tenantId, conversationId, ...llmInfo, ...usage },
            'chat_stream_finish',
          );
        },
      });

      // ── 11. Stream response to client ─────────────────────────────────────
      const nodeStream = Readable.fromWeb(result.toDataStream({ data: streamData }) as any);

      return reply
        .header('Content-Type',            'text/plain; charset=utf-8')
        .header('X-Vercel-AI-Data-Stream',  'v1')
        .header('Cache-Control',            'no-cache, no-transform')
        .header('X-Conversation-Id',         conversationId)
        .header('X-LLM-Provider',            llmInfo.provider)
        .header('X-LLM-Model',               llmInfo.model)
        .send(nodeStream);
    },
  );
};

export default chatRoutes;