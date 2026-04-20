/**
 * apps/api/src/routes/playgroundChat.ts
 *
 * POST /internal/playground-chat
 *
 * HMAC-signed endpoint used by the dashboard AI Playground so merchants can
 * test their live chatbot flow from the admin UI. Reuses the same system
 * prompt + tools + LLM as /widget/chat, but:
 *   - Auth is HMAC (INTERNAL_HMAC_SECRET), not the widget key / origin.
 *   - Accepts a previewConfig override so merchants can try changes without
 *     saving them.
 *   - No persistence, no budget counters, no rate limits — it's an
 *     ephemeral test harness scoped to the signed-in merchant.
 */

import crypto from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { generateText, type CoreMessage } from 'ai';
import { merchants, eq } from '@chatbot/db';
import { db, pgPool } from '../db.js';
import { env } from '../env.js';
import { buildSystemPrompt } from '../lib/systemPrompt.js';
import { createAdminTools } from '../lib/tools.js';
import { createStorefrontMCPTools } from '../lib/storefrontTools.js';
import { getLLMModel, getLLMInfo } from '../lib/llm.js';

const INTERNAL_CONTENT_TYPE = 'application/x-internal-playground-chat';

const MAX_STEPS = 8;
const LLM_TIMEOUT_MS = 45_000;

interface PreviewConfig {
  botName?: string;
  tone?: string;
  customInstructions?: string | null;
  useEmojis?: boolean;
}

interface PlaygroundChatBody {
  tenantId: string;
  shopDomain: string;
  message: string;
  sessionId: string;
  previewConfig?: PreviewConfig;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

const playgroundChatRoutes: FastifyPluginAsync = async (app) => {
  // Raw-body parser so HMAC is computed over the exact bytes the caller signed.
  app.addContentTypeParser(
    INTERNAL_CONTENT_TYPE,
    { parseAs: 'string' },
    (_req, body, done) => done(null, body),
  );

  app.post('/internal/playground-chat', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');

    if (typeof req.body !== 'string') {
      return reply.code(415).send({ error: `expected Content-Type: ${INTERNAL_CONTENT_TYPE}` });
    }
    const raw = req.body;

    const sigHeader = req.headers['x-internal-signature'];
    if (!sigHeader || typeof sigHeader !== 'string') {
      return reply.code(401).send({ error: 'missing signature' });
    }

    const expected = crypto
      .createHmac('sha256', env.INTERNAL_HMAC_SECRET)
      .update(raw)
      .digest();

    let provided: Buffer;
    try {
      provided = Buffer.from(sigHeader, 'base64url');
    } catch {
      return reply.code(401).send({ error: 'bad signature encoding' });
    }
    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      return reply.code(401).send({ error: 'invalid signature' });
    }

    let parsed: PlaygroundChatBody;
    try {
      parsed = JSON.parse(raw) as PlaygroundChatBody;
    } catch {
      return reply.code(400).send({ error: 'invalid json' });
    }

    const { tenantId, shopDomain, message, sessionId, previewConfig, history } = parsed;
    if (!tenantId || !shopDomain || !message || !sessionId) {
      return reply.code(400).send({ error: 'missing required fields' });
    }
    if (message.length > 8000) {
      return reply.code(400).send({ error: 'message too long' });
    }

    const [merchant] = await db
      .select({ encryptedShopifyToken: merchants.encryptedShopifyToken })
      .from(merchants)
      .where(eq(merchants.id, tenantId))
      .limit(1);

    if (!merchant) {
      return reply.code(404).send({ error: 'merchant not found' });
    }

    const systemPrompt = buildSystemPrompt(
      {
        botName: previewConfig?.botName ?? 'Assistant',
        tone: previewConfig?.tone ?? 'friendly',
        customInstructions: previewConfig?.customInstructions ?? null,
        useEmojis: previewConfig?.useEmojis ?? false,
      },
      shopDomain,
    );

    const mcpTools = createStorefrontMCPTools(shopDomain);
    const adminTools = createAdminTools({
      tenantId,
      shopDomain,
      sql: pgPool,
      hasShopifyToken: !!merchant.encryptedShopifyToken,
    });
    const tools = { ...mcpTools, ...adminTools };

    const chatHistory: CoreMessage[] = (history ?? [])
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    const llmInfo = getLLMInfo('fast');
    req.log.info({ tenantId, sessionId, ...llmInfo }, 'playground_chat_start');

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), LLM_TIMEOUT_MS);
    try {
      const result = await generateText({
        model: getLLMModel('fast'),
        system: systemPrompt,
        messages: [...chatHistory, { role: 'user', content: message }],
        tools,
        maxSteps: MAX_STEPS,
        abortSignal: abort.signal,
      });

      const text = result.text ?? '';
      let products: any[] = [];
      let cart: any = null;
      let order: any = null;

      for (const step of result.steps) {
        if (!step.toolResults?.length) continue;
        for (const tr of step.toolResults) {
          if (tr.toolName === 'search_catalog') {
            const extracted = (tr.result as any)?.__shopbot_products ?? [];
            if (extracted.length > 0) products = extracted;
          }
          if (tr.toolName === 'get_order_status') {
            const r = tr.result as any;
            if (r?.found !== false && r?.orderNumber) order = r;
          }
          if (tr.toolName === 'get_cart' || tr.toolName === 'update_cart') {
            const r = tr.result as any;
            if (r?.__shopbot_cart) cart = r.__shopbot_cart;
          }
        }
      }
      if (cart || order) products = [];

      const sanitizedText = (cart || order)
        ? text
            .replace(/\bhttps?:\/\/\S+/gi, '')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[:\-–—]\s*(?=\n|$)/g, '')
            .trim()
        : text;

      req.log.info({ tenantId, sessionId, totalSteps: result.steps.length }, 'playground_chat_finish');

      return reply.send({ text: sanitizedText, products, cart, order });
    } catch (err) {
      const isTimeout = abort.signal.aborted;
      req.log.error({ err, tenantId, sessionId, isTimeout }, 'playground_chat: generateText failed');
      return reply.code(isTimeout ? 504 : 500).send({
        text: isTimeout
          ? 'The assistant took too long to respond. Please try again.'
          : 'Something went wrong. Please try again.',
        products: [],
        cart: null,
        order: null,
      });
    } finally {
      clearTimeout(timer);
    }
  });
};

export default playgroundChatRoutes;
