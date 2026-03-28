/**
 * apps/api/src/env.ts
 *
 * Changes from original:
 *   + LLM_PROVIDER  enum('anthropic','openai')  default 'anthropic'
 *   + OPENAI_API_KEY  optional string
 *   + superRefine cross-field validation: OPENAI_API_KEY required when LLM_PROVIDER=openai
 *
 * All original fields are untouched.
 */
import { config } from 'dotenv';
config();

import { z } from 'zod';

const envSchema = z
  .object({
    // ── Original fields — DO NOT CHANGE ────────────────────────────────
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().default(3001),
    HOST: z.string().default('0.0.0.0'),
    APP_URL: z.string().default('http://localhost:3001'),

    // Database
    DATABASE_URL: z.string().url(),

    // Valkey / Redis
    VALKEY_URL: z.string().default('redis://localhost:6379'),

    // CORS
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

    // Shopify
    SHOPIFY_CLIENT_ID: z.string(),
    SHOPIFY_CLIENT_SECRET: z.string(),
    SHOPIFY_SCOPES: z.string().default(
      'read_products,write_products,read_orders,write_script_tags,read_customers,write_webhooks'
    ),

    // ── NEW: LLM provider toggle ────────────────────────────────────────
    //
    //   LLM_PROVIDER=anthropic  →  claude-haiku-4-5-20251001  (default, production)
    //   LLM_PROVIDER=openai     →  gpt-4o-mini                (dev / A-B testing)
    //
    //   Switch with a single env var change — no code changes required.
    //
    LLM_PROVIDER: z
      .enum(['anthropic', 'openai'])
      .default('anthropic'),

    //   Only required when LLM_PROVIDER=openai.
    //   Validated in superRefine below.
    //   @ai-sdk/anthropic reads ANTHROPIC_API_KEY from process.env automatically,
    //   so it doesn't need to be listed here unless you want Zod to validate it.
    OPENAI_API_KEY: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.LLM_PROVIDER === 'openai' && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code   : z.ZodIssueCode.custom,
        path   : ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY must be set when LLM_PROVIDER=openai',
      });
    }
  });

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Missing or invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
export type Env = typeof env;