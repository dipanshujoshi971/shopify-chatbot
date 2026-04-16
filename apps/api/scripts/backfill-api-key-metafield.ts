/**
 * One-time backfill script: sets the publishable API key as a shop metafield
 * for all existing merchants so the theme extension can auto-read it.
 *
 * Usage:
 *   npx tsx apps/api/scripts/backfill-api-key-metafield.ts
 *
 * Run this AFTER deploying the updated theme extension (shopify app deploy)
 * so the Liquid template can read {{ app.metafields.shopchat.api_key }}.
 */

import { config } from 'dotenv';
config({ path: 'apps/api/.env' });

import postgres from 'postgres';
import { decryptToken, setApiKeyMetafield } from '../src/lib/shopify.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

async function main() {
  const merchants = await sql`
    SELECT id, shop_domain, publishable_api_key, encrypted_shopify_token
    FROM merchants
    WHERE status = 'active'
      AND encrypted_shopify_token IS NOT NULL
  `;

  console.log(`Found ${merchants.length} active merchant(s) to backfill.\n`);

  let success = 0;
  let failed = 0;

  for (const m of merchants) {
    try {
      const accessToken = decryptToken(m.encrypted_shopify_token);
      await setApiKeyMetafield(m.shop_domain, accessToken, m.publishable_api_key);
      console.log(`  OK  ${m.shop_domain}`);
      success++;
    } catch (err) {
      console.error(`  FAIL  ${m.shop_domain}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone. Success: ${success}, Failed: ${failed}`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
