/**
 * apps/api/src/lib/llm.ts
 *
 * LLM Provider — Azure OpenAI
 * ──────────────────────────────────────────────────────────────────
 * Returns the Vercel AI SDK LanguageModelV1 instance using Azure OpenAI.
 *
 * Models (deployment names):
 *   fast    → gpt-4.1-mini  (default, most traffic)
 *   quality → gpt-4.1       (complex queries)
 */

import { createAzure }  from '@ai-sdk/azure';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { env }           from '../env.js';

// ── Deployment Names ───────────────────────────────────────────────

const MODELS = {
  fast   : 'gpt-4.1-mini',
  quality: 'gpt-4.1',
} as const;

export type LLMTier = 'fast' | 'quality';

// ── Lazy Azure OpenAI provider ────────────────────────────────────

let _azure: ReturnType<typeof createAzure> | null = null;

function getAzureProvider(): ReturnType<typeof createAzure> {
  if (!_azure) {
    if (!env.AZURE_API_KEY) {
      throw new Error(
        '[llm] AZURE_API_KEY is not set. Add AZURE_API_KEY to your .env file.',
      );
    }
    _azure = createAzure({
      resourceName: env.AZURE_RESOURCE_NAME,
      apiKey: env.AZURE_API_KEY,
    });
  }
  return _azure;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * getLLMModel
 *
 * Returns the Vercel AI SDK model instance for Azure OpenAI.
 *
 * @param tier  'fast' (default) — gpt-4.1-mini
 *              'quality'        — gpt-4.1
 */
export function getLLMModel(tier: LLMTier = 'fast'): LanguageModelV1 {
  return getAzureProvider()(MODELS[tier]);
}

/**
 * getLLMInfo
 *
 * Returns provider + model name for structured logging / response headers.
 */
export function getLLMInfo(tier: LLMTier = 'fast'): {
  provider: 'azure';
  model: string;
} {
  return { provider: 'azure', model: MODELS[tier] };
}
