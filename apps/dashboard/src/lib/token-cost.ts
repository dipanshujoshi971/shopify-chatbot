
// Pricing per 1M tokens (USD)
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini':  { input: 0.15,  output: 0.60  },
  'gpt-4o':       { input: 2.50,  output: 10.00 },
};

// Embedding pricing per 1M tokens (USD) — input only, no output
const EMBEDDING_PRICING: Record<string, number> = {
  'text-embedding-3-small': 0.02,
  'text-embedding-3-large': 0.13,
};

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

// Default model for cost estimation (matches LLM_PROVIDER default: 'fast' tier)
const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Estimate cost in USD for a given token count
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = DEFAULT_MODEL,
): number {
  const pricing = PRICING[model] ?? PRICING[DEFAULT_MODEL];
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

/**
 * Format cost as a human-readable string
 */
export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Estimate embedding cost in USD for a given token count
 */
export function estimateEmbeddingCost(
  tokens: number,
  model: string = DEFAULT_EMBEDDING_MODEL,
): number {
  const pricePerMillion = EMBEDDING_PRICING[model] ?? EMBEDDING_PRICING[DEFAULT_EMBEDDING_MODEL];
  return (tokens / 1_000_000) * pricePerMillion;
}

/**
 * Get all available model pricing for display
 */
export function getModelPricing() {
  return PRICING;
}

/**
 * Get embedding model pricing for display
 */
export function getEmbeddingPricing() {
  return EMBEDDING_PRICING;
}
