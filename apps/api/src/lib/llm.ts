/**
 * apps/api/src/lib/llm.ts
 *
 * LLM Provider — OpenAI Only
 * ──────────────────────────────────────────────────────────────────
 * Returns the Vercel AI SDK LanguageModelV1 instance using OpenAI.
 *
 * Models:
 *   fast    → gpt-4o-mini  (default, most traffic)
 *   quality → gpt-4o       (complex queries)
 */

import { createOpenAI }  from '@ai-sdk/openai';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { env }           from '../env.js';

// ── Model IDs ──────────────────────────────────────────────────────

const MODELS = {
  fast   : 'gpt-4o-mini',
  quality: 'gpt-4o',
} as const;

export type LLMTier = 'fast' | 'quality';

// ── Lazy OpenAI provider ──────────────────────────────────────────

let _openai: ReturnType<typeof createOpenAI> | null = null;

function getOpenAIProvider(): ReturnType<typeof createOpenAI> {
  if (!_openai) {
    if (!env.OPENAI_API_KEY) {
      throw new Error(
        '[llm] OPENAI_API_KEY is not set. Add OPENAI_API_KEY to your .env file.',
      );
    }
    _openai = createOpenAI({
      apiKey: env.OPENAI_API_KEY,
      // CRITICAL: 'strict' mode tells the SDK to send
      // `stream_options: { include_usage: true }` to OpenAI.
      // Without this, OpenAI streams return NO token usage data,
      // causing promptTokens/completionTokens to be NaN → 0.
      compatibility: 'strict',
    });
  }
  return _openai;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * getLLMModel
 *
 * Returns the Vercel AI SDK model instance for OpenAI.
 *
 * @param tier  'fast' (default) — gpt-4o-mini
 *              'quality'        — gpt-4o
 */
export function getLLMModel(tier: LLMTier = 'fast'): LanguageModelV1 {
  return getOpenAIProvider()(MODELS[tier]);
}

/**
 * getLLMInfo
 *
 * Returns provider + model name for structured logging / response headers.
 */
export function getLLMInfo(tier: LLMTier = 'fast'): {
  provider: 'openai';
  model: string;
} {
  return { provider: 'openai', model: MODELS[tier] };
}
