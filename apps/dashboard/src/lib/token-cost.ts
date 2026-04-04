/**
 * Token cost estimation utility
 *
 * Calculates approximate cost based on LLM provider pricing.
 * Prices as of 2025 — update when provider pricing changes.
 *
 * Usage:
 *   estimateCost(inputTokens, outputTokens)
 *   formatCost(0.0042)  // "$0.004"
 */

// Pricing per 1M tokens (USD)
const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o-mini':  { input: 0.15,  output: 0.60  },
  'gpt-4o':       { input: 2.50,  output: 10.00 },
  // Anthropic
  'claude-haiku-4-5-20251001':  { input: 0.80,  output: 4.00  },
  'claude-sonnet-4-5-20251001': { input: 3.00,  output: 15.00 },
};

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
 * Get all available model pricing for display
 */
export function getModelPricing() {
  return PRICING;
}
