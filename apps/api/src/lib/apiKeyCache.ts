import type { Redis } from 'ioredis';

export interface CachedApiKeyEntry {
  tenantId: string;   // e.g. "store_acme_shop"
  shopDomain: string; // e.g. "acme-shop.myshopify.com"
}

// 5-minute TTL: fast enough to honour revocations, long enough to absorb
// bursts of widget page-loads without a Postgres round-trip every time.
const CACHE_TTL_SECONDS = 300;

const cacheKey = (key: string) => `apikey:${key}`;

export async function getCachedApiKey(
  valkey: Redis,
  publishableKey: string,
): Promise<CachedApiKeyEntry | null> {
  const raw = await valkey.get(cacheKey(publishableKey));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedApiKeyEntry;
  } catch {
    return null; // corrupted entry — fall through to DB
  }
}

export async function setCachedApiKey(
  valkey: Redis,
  publishableKey: string,
  entry: CachedApiKeyEntry,
): Promise<void> {
  await valkey.set(
    cacheKey(publishableKey),
    JSON.stringify(entry),
    'EX',
    CACHE_TTL_SECONDS,
  );
}

/**
 * Call when a merchant rotates their API key or is deactivated so the old
 * key is denied immediately rather than waiting for TTL expiry.
 */
export async function invalidateCachedApiKey(
  valkey: Redis,
  publishableKey: string,
): Promise<void> {
  await valkey.del(cacheKey(publishableKey));
}