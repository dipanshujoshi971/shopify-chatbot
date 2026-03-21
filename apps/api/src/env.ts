import { config } from 'dotenv';
config();

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),        // for Fastify binding
  APP_URL: z.string().default('http://localhost:3001'), // for building URLs

  // Database
  DATABASE_URL: z.string().url(),

  // Valkey / Redis
  VALKEY_URL: z.string().default('redis://localhost:6379'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
 
  // Shopify
  SHOPIFY_CLIENT_ID: z.string(),
  SHOPIFY_CLIENT_SECRET: z.string(),
  SHOPIFY_SCOPES: z.string().default('read_products,write_products,read_orders,write_script_tags,read_customers'),
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