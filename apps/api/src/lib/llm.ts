/**
 * apps/api/src/lib/llm.ts
 *
 * LLM Provider Factory
 * ──────────────────────────────────────────────────────────────────
 * Returns the correct Vercel AI SDK LanguageModelV1 instance based
 * on the LLM_PROVIDER env var.
 *
 * Production default : anthropic / claude-haiku-4-5-20251001
 * Dev/test override  : openai  / gpt-4o-mini
 *   (set LLM_PROVIDER=openai + OPENAI_API_KEY=sk-proj-xxx in .env)
 *
 * All callers — currently only chat.ts — stay identical.
 * Only the model reference changes.
 *
 * Why anthropic uses the singleton import:
 *   @ai-sdk/anthropic's default export reads ANTHROPIC_API_KEY from
 *   process.env automatically. No explicit key passing needed, matches
 *   the existing pattern in chat.ts.
 */

import { anthropic }     from '@ai-sdk/anthropic';
import { createOpenAI }  from '@ai-sdk/openai';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { env }           from '../env.js';

// ── Model IDs ──────────────────────────────────────────────────────

const MODELS = {
  anthropic: {
    fast   : 'claude-haiku-4-5-20251001',    // 90 % of traffic
    quality: 'claude-sonnet-4-5-20251001',   // 10 % (escalation)
  },
  openai: {
    fast   : 'gpt-4o-mini',
    quality: 'gpt-4o',
  },
} as const;

export type LLMTier = 'fast' | 'quality';

// ── Lazy OpenAI provider (only created when LLM_PROVIDER=openai) ──

let _openai: ReturnType<typeof createOpenAI> | null = null;

function getOpenAIProvider(): ReturnType<typeof createOpenAI> {
  if (!_openai) {
    if (!env.OPENAI_API_KEY) {
      // Zod superRefine should catch this at startup, but guard here too
      throw new Error(
        '[llm] LLM_PROVIDER=openai but OPENAI_API_KEY is not set. ' +
        'Add OPENAI_API_KEY to your .env file.',
      );
    }
    _openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return _openai;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * getLLMModel
 *
 * Returns the Vercel AI SDK model instance for the configured provider.
 * Drop-in replacement for `anthropic('claude-haiku-4-5-20251001')`.
 *
 * @param tier  'fast' (default) — haiku / gpt-4o-mini
 *              'quality'        — sonnet / gpt-4o
 */
export function getLLMModel(tier: LLMTier = 'fast'): LanguageModelV1 {
  if (env.LLM_PROVIDER === 'openai') {
    return getOpenAIProvider()(MODELS.openai[tier]);
  }
  // Default: anthropic (reads ANTHROPIC_API_KEY from process.env automatically)
  return anthropic(MODELS.anthropic[tier]);
}

/**
 * getLLMInfo
 *
 * Returns provider + model name for structured logging / response headers.
 */
export function getLLMInfo(tier: LLMTier = 'fast'): {
  provider: 'anthropic' | 'openai';
  model: string;
} {
  const provider = env.LLM_PROVIDER;
  return { provider, model: MODELS[provider][tier] };
}