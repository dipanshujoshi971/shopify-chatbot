/**
 * apps/api/src/env.ts
 *
 * Environment validation — OpenAI only (no Anthropic).
 */
import { config } from 'dotenv';
config();

import { z } from 'zod';

const envSchema = z
  .object({
    // ── General ─────────────────────────────────────────────────────
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
      'read_products,read_orders,write_orders,read_customers,write_webhooks'
    ),

    // ── OpenAI (used for both LLM and embeddings) ───────────────────
    OPENAI_API_KEY: z.string(),

    // Cloudflare R2 (S3-compatible object storage)
    R2_ACCOUNT_ID: z.string(),
    R2_ACCESS_KEY_ID: z.string(),
    R2_SECRET_ACCESS_KEY: z.string(),
    R2_BUCKET_NAME: z.string(),
  })
;

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
