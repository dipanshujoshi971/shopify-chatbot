/**
 * apps/api/src/routes/widget/chat.ts
 *
 * POST /widget/chat
 * Requires widgetAuth middleware (sets request.tenantId + request.shopDomain).
 *
 * Returns a consistent JSON response for every request:
 * {
 *   text: string,
 *   products: ShopifyProduct[],
 *   cart: CartResult | null,
 *   order: OrderStatusResult | null,
 *   conversationId: string,
 * }
 *
 * This replaces the previous streaming approach to ensure the widget
 * always receives a predictable structure it can render without breaking.
 */

import type { FastifyPluginAsync } from 'fastify';
import { generateText, type CoreMessage } from 'ai';
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
  starter:    200_000,
  growth:     500_000,
  pro:        -1,
  enterprise: -1,
};

const HARD_LIMITS = {
  maxTurns:        50,
  maxTotalTokens:  200_000,
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
          request.log.info({ conversationId }, 'chat: client-supplied conversationId not found — creating new conversation');
          await pgPool.unsafe(
            `INSERT INTO "tenant_${safeName}"."conversations"
               (id, session_id, status, total_tokens_used, total_turns, created_at, updated_at)
             VALUES ($1, $2, 'active', 0, 0, now(), now())`,
            [conversationId, body.sessionId],
          );
        } else {
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
            if (parsed.type === 'text') {
              text = parsed.text ?? '';
              // If the message included product data (with variant IDs), append
              // a compact summary so the LLM can use variant IDs in future turns.
              if (Array.isArray(parsed.products) && parsed.products.length > 0) {
                const productSummary = parsed.products.map((p: any) => {
                  const variants = (p.variants ?? []).map((v: any) =>
                    `  - variant_id: ${v.id}, title: "${v.title}", price: ${v.price?.amount ?? '?'} ${v.price?.currencyCode ?? ''}, available: ${v.availableForSale ?? '?'}`
                  ).join('\n');
                  return `Product: "${p.title}" (handle: ${p.handle})\n${variants}`;
                }).join('\n\n');
                text += `\n\n[Previously shown products with variant IDs for cart operations]\n${productSummary}`;
              }
            } else {
              text = JSON.stringify(parsed);
            }
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

      const llmInfo = getLLMInfo('fast');
      request.log.info({ tenantId, conversationId, ...llmInfo }, 'chat_request_start');

      // ── 9. Call LLM via generateText (non-streaming, consistent output) ──
      try {
        const result = await generateText({
          model:    getLLMModel('fast'),
          system:   systemPrompt,
          messages: [
            ...history,
            { role: 'user', content: userMessage },
          ],
          tools,
          maxSteps: HARD_LIMITS.maxSteps,
        });

        // ── 10. Build consistent JSON response from tool results ────────────
        const responseText = result.text ?? '';
        let products: any[] = [];
        let cart: any = null;
        let order: any = null;

        // Walk through all steps to collect tool results
        for (const step of result.steps) {
          if (!step.toolResults?.length) continue;

          for (const tr of step.toolResults) {
            request.log.info(
              { toolName: tr.toolName, resultType: typeof tr.result, resultKeys: tr.result && typeof tr.result === 'object' ? Object.keys(tr.result as any) : null },
              'chat: tool result received',
            );

            // Product search results
            if (tr.toolName === 'search_shop_catalog') {
              const toolResult = tr.result as any;
              const extractedProducts = toolResult?.__shopbot_products ?? [];
              if (extractedProducts.length > 0) {
                products = extractedProducts;
                request.log.info(
                  { productCount: products.length, hasVariants: products.some((p: any) => p.variants?.length > 0) },
                  'chat: products extracted from search',
                );
              }
            }

            // Order status results
            if (tr.toolName === 'get_order_status') {
              const toolResult = tr.result as any;
              if (toolResult?.found !== false && toolResult?.orderNumber) {
                order = toolResult;
              }
              request.log.info(
                { found: toolResult?.found, orderNumber: toolResult?.orderNumber, message: toolResult?.message },
                'chat: order result',
              );
            }

            // Cart results (get_cart or update_cart)
            if (tr.toolName === 'get_cart' || tr.toolName === 'update_cart') {
              const toolResult = tr.result as any;
              if (toolResult?.__shopbot_cart) {
                cart = toolResult.__shopbot_cart;
              }
              request.log.info(
                { hasCart: !!cart, cartId: cart?.cartId, toolText: toolResult?.text?.substring(0, 200) },
                'chat: cart result',
              );
            }
          }
        }

        // ── 11. Token accounting ────────────────────────────────────────────
        const safeNum = (v: unknown): number => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };

        let promptTokensTotal = 0;
        let completionTokensTotal = 0;
        for (const step of result.steps) {
          promptTokensTotal += safeNum(step.usage?.promptTokens);
          completionTokensTotal += safeNum(step.usage?.completionTokens);
        }
        if (promptTokensTotal === 0 && completionTokensTotal === 0) {
          promptTokensTotal = safeNum(result.usage?.promptTokens);
          completionTokensTotal = safeNum(result.usage?.completionTokens);
        }
        const tokensUsed = promptTokensTotal + completionTokensTotal;

        request.log.info(
          { tenantId, conversationId, tokensUsed, promptTokens: promptTokensTotal, completionTokens: completionTokensTotal, totalSteps: result.steps.length },
          'chat: token accounting',
        );

        const newTurns  = currentTurns + 1;
        const newTokens = currentTotalTokens + tokensUsed;

        // Valkey budget counters — fire-and-forget
        valkey
          .pipeline()
          .hset(budgetKey(tenantId, conversationId), 'turns', String(newTurns), 'tokens', String(newTokens))
          .expire(budgetKey(tenantId, conversationId), 86_400)
          .exec()
          .catch((err) =>
            request.log.warn({ err }, 'chat: Valkey budget update failed'),
          );

        // ── 12. Persist assistant message + update conversation ─────────────
        // IMPORTANT: Include product variant IDs in the stored message so the
        // LLM can reference them in future turns (e.g. "add X to cart").
        // Without this, the LLM has no variant IDs when the user asks to add
        // a product that was shown in a previous turn.
        const persistedContent: Record<string, unknown> = { type: 'text', text: responseText };
        if (products.length > 0) {
          persistedContent.products = products.map((p: any) => ({
            title: p.title,
            handle: p.handle,
            variants: (p.variants ?? []).map((v: any) => ({
              id: v.id,
              title: v.title,
              price: v.price,
              availableForSale: v.availableForSale,
            })),
            priceRange: p.priceRange,
            availableForSale: p.availableForSale,
          }));
        }

        try {
          await pgPool.unsafe(
            `INSERT INTO "tenant_${safeName}"."messages"
               (id, conversation_id, role, content, created_at)
             VALUES ($1, $2, 'assistant', $3, now())`,
            [nanoid(), conversationId, JSON.stringify(persistedContent)],
          );

          await pgPool.unsafe(
            `UPDATE "tenant_${safeName}"."conversations"
                SET total_tokens_used  = total_tokens_used + $1,
                    prompt_tokens      = prompt_tokens + $2,
                    completion_tokens  = completion_tokens + $3,
                    total_turns        = total_turns + 1,
                    updated_at         = now()
              WHERE id = $4`,
            [tokensUsed, promptTokensTotal, completionTokensTotal, conversationId],
          );
        } catch (err) {
          request.log.error({ err, tenantId, conversationId }, 'chat: DB write failed');
        }

        request.log.info(
          { tenantId, conversationId, ...llmInfo, tokensUsed, totalSteps: result.steps.length },
          'chat_request_finish',
        );

        // ── 13. Return consistent JSON response ─────────────────────────────
        return reply.send({
          text:           responseText,
          products,
          cart,
          order,
          conversationId,
        });

      } catch (err) {
        request.log.error({ err, tenantId, conversationId }, 'chat: generateText failed');
        return reply.code(500).send({
          text:           'Something went wrong. Please try again.',
          products:       [],
          cart:           null,
          order:          null,
          conversationId,
        });
      }
    },
  );
};

export default chatRoutes;
