/**
 * apps/api/src/routes/widget/chat.ts
 *
 * POST /widget/chat
 * Requires widgetAuth middleware (sets request.tenantId + request.shopDomain).
 * Streams Claude Haiku responses in Vercel AI SDK data-stream format.
 *
 * Changes from original
 * ─────────────────────
 * 1. DB connection fix: imports singleton pgPool + db instead of creating
 *    per-request pools.  The old `sql.end()` teardown is gone — the shared
 *    pool manages its own connection lifecycle.
 *
 * 2. Step 3 — Token budgets: Valkey counters are checked BEFORE calling
 *    the AI SDK.  Hard limits (30 turns, 15 000 tokens, 2 000 chars/turn)
 *    short-circuit the request without ever reaching Anthropic.  Counters
 *    are updated write-through after each successful turn.
 *
 * 3. Step 4 — Shopify Storefront MCP: product discovery and policy lookup
 *    are now served by Shopify's live MCP server instead of local DB ILIKE
 *    queries.  Cart tools (get_cart, update_cart) are new.
 *
 * 4. Step 5 — Admin API order status: kept as a manually-written tool
 *    because it requires the merchant's decrypted OAuth token.
 */

import type { FastifyPluginAsync } from 'fastify';
import { streamText, type CoreMessage } from 'ai';
import { anthropic }   from '@ai-sdk/anthropic';
import { Readable }    from 'node:stream';
import { nanoid }      from 'nanoid';
import { merchants, eq } from '@chatbot/db';
import { env }         from '../../env.js';
import { valkey }      from '../../valkey.js';
import { db, pgPool }  from '../../db.js';
import { buildSystemPrompt }        from '../../lib/systemPrompt.js';
import { createAdminTools }         from '../../lib/tools.js';
import { createStorefrontMCPTools } from '../../lib/storefrontTools.js';

// ── Plan token budgets (tokens per conversation) ──────────────────────────────
// -1 = unlimited.  Phase 3: read from a plan_features table.
const PLAN_BUDGET: Record<string, number> = {
  starter:    10_000,
  growth:     50_000,
  pro:        -1,
  enterprise: -1,
};

// ── Hard limits that apply to ALL plans ──────────────────────────────────────
// These protect against runaway sessions before they hit Anthropic.
const HARD_LIMITS = {
  /** Maximum turns before a conversation is considered closed */
  maxTurns: 30,
  /** Maximum cumulative tokens across the entire conversation */
  maxTotalTokens: 15_000,
  /** Maximum characters in a single user message (~2 000 tokens) */
  maxCharsPerTurn: 8_000,
  /** Maximum tool-call iterations per AI SDK call */
  maxSteps: 8,
} as const;

const MAX_HISTORY = 20;

// ── Valkey key helper ─────────────────────────────────────────────────────────
// Stores { turns, tokens } as a hash.  TTL: 24 h (86 400 s).
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
            // cartId is forwarded from the widget JS so the LLM can operate
            // on the shopper's existing cart without asking for it.
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

      // ── Step 3 · Fast Valkey pre-check ────────────────────────────────────
      // If we already have a cached budget counter for this conversation and it
      // has already hit a hard limit, reject immediately — no DB round-trip.
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
          // Valkey unavailable — fall through to DB check
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

      // ── 3. Load or create conversation ───────────────────────────────────
      // isNewConversation drives whether we INSERT or SELECT.
      const isNewConversation = !body.conversationId;
      const conversationId    = body.conversationId ?? nanoid();
      let currentTurns        = 0;
      let currentTotalTokens  = 0;

      if (isNewConversation) {
        await pgPool.unsafe(
          `INSERT INTO "tenant_${safeName}"."conversations"
             (id, session_id, status, total_tokens_used, total_turns, created_at, updated_at)
           VALUES ($1, $2, 'active', 0, 0, now(), now())`,
          [conversationId, body.sessionId],
        );
      } else {
        const [conv] = await pgPool.unsafe(
          `SELECT id, total_tokens_used, total_turns, status
             FROM "tenant_${safeName}"."conversations"
            WHERE id = $1`,
          [conversationId],
        ) as any[];

        if (!conv) {
          return reply.code(404).send({ error: 'Conversation not found' });
        }
        if (conv.status !== 'active') {
          return reply.code(400).send({ error: 'Conversation is closed' });
        }

        currentTurns       = conv.total_turns       ?? 0;
        currentTotalTokens = conv.total_tokens_used ?? 0;
      }

      // ── Step 3 · DB-level budget checks (authoritative) ───────────────────
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
        .reverse()                          // DESC → ASC (oldest first)
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
      // Step 4: Storefront MCP tools (product search, policies, cart)
      // Step 5: Admin API tools (order status, email escalation)
      const mcpTools   = createStorefrontMCPTools(shopDomain);
      const adminTools = createAdminTools({
        tenantId,
        shopDomain,
        sql:                   pgPool,
        encryptedShopifyToken: merchant?.encryptedShopifyToken ?? null,
      });

      const tools = { ...mcpTools, ...adminTools };

      // ── 8. Optionally inject cart context into the first user message ─────
      // If the widget JS passed a cartId, prepend it so the LLM knows there's
      // an existing cart to operate on without the customer having to mention it.
      const userMessage = body.cartId
        ? `[cart_id: ${body.cartId}]\n${body.message}`
        : body.message;

      // ── 9. Call Claude Haiku via Vercel AI SDK ────────────────────────────
      const result = streamText({
        model:    anthropic('claude-haiku-4-5-20251001'),
        system:   systemPrompt,
        messages: [
          ...history,
          { role: 'user', content: userMessage },
        ],
        tools,
        maxSteps: HARD_LIMITS.maxSteps,

        onFinish: async ({ text, usage }) => {
          const tokensUsed  = (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0);
          const newTurns    = currentTurns + 1;
          const newTokens   = currentTotalTokens + tokensUsed;

          // ── Step 3 · Update Valkey budget counters (write-through) ──
          // Fire-and-forget — a Valkey failure doesn't break the response.
          valkey
            .pipeline()
            .hset(budgetKey(tenantId, conversationId), 'turns', String(newTurns), 'tokens', String(newTokens))
            .expire(budgetKey(tenantId, conversationId), 86_400)
            .exec()
            .catch((err) =>
              request.log.warn({ err }, 'chat: Valkey budget update failed'),
            );

          // ── Persist assistant message ──
          await pgPool.unsafe(
            `INSERT INTO "tenant_${safeName}"."messages"
               (id, conversation_id, role, content, created_at)
             VALUES ($1, $2, 'assistant', $3, now())`,
            [nanoid(), conversationId, JSON.stringify({ type: 'text', text })],
          );

          // ── Update conversation stats ──
          await pgPool.unsafe(
            `UPDATE "tenant_${safeName}"."conversations"
                SET total_tokens_used = total_tokens_used + $1,
                    total_turns       = total_turns + 1,
                    updated_at        = now()
              WHERE id = $2`,
            [tokensUsed, conversationId],
          );
        },
      });

      // ── 10. Stream response to client ─────────────────────────────────────
      // Vercel AI SDK returns a Web ReadableStream — convert to Node.js Readable
      // so Fastify can pipe it to the HTTP response.
      // No sql.end() needed — the shared pgPool manages its own connections.
      const nodeStream = Readable.fromWeb(result.toDataStream() as any);

      return reply
        .header('Content-Type',            'text/plain; charset=utf-8')
        .header('X-Vercel-AI-Data-Stream',  'v1')
        .header('Cache-Control',            'no-cache, no-transform')
        .header('X-Conversation-Id',         conversationId)
        .send(nodeStream);
    },
  );
};

export default chatRoutes;