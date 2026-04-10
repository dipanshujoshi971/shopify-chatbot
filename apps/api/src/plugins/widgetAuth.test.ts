/**
 * widgetAuth.test.ts
 *
 * Tests every branch of the security gate using Fastify's inject() —
 * no real network, no real DB, no real Valkey.
 *
 * Run with:  npx vitest run src/plugins/widgetAuth.test.ts
 */

import Fastify from 'fastify';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock @chatbot/db so tests don't need a real Postgres connection ──────────
vi.mock('@chatbot/db', async () => {
  return {
    createDbClient: vi.fn(),
    merchants: {
      id: 'id',
      shopDomain: 'shop_domain',
      publishableApiKey: 'publishable_api_key',
      status: 'status',
    },
    eq: vi.fn((col, val) => ({ col, val })),
  };
});

// ── Mock env so DATABASE_URL is always defined ───────────────────────────────
vi.mock('../env.js', () => ({
  env: { DATABASE_URL: 'postgresql://test/test' },
}));

import widgetAuthPlugin from './widgetAuth.js';
import { createDbClient } from '@chatbot/db';

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

// Format matches auth.ts: `pk_${nanoid(32)}`
const VALID_KEY    = 'pk_ABCDEFGHIJKLMNOPQRSTUVWXYZabcd12';
const VALID_TENANT = 'store_acme_shop';
const VALID_DOMAIN = 'acme-shop.myshopify.com';
const VALID_ORIGIN = `https://${VALID_DOMAIN}`;

// --------------------------------------------------------------------------
// Builder helpers
// --------------------------------------------------------------------------

function makeValkey(storeMap: Record<string, string> = {}) {
  return {
    get: vi.fn(async (k: string) => storeMap[k] ?? null),
    set: vi.fn(async (k: string, v: string) => { storeMap[k] = v; return 'OK'; }),
    del: vi.fn(async (k: string) => { delete storeMap[k]; return 1; }),
  } as unknown as import('ioredis').Redis;
}

/**
 * Build a Fastify app with widgetAuth registered and a simple probe route.
 * `dbRows` maps publishable_api_key → { id, shopDomain, status }.
 */
function buildApp(
  dbRows: Record<string, { id: string; shopDomain: string; status: string } | null> = {},
  valkey = makeValkey(),
) {
  const fastify = Fastify({ logger: false });

  // Mock createDbClient to return a fake Drizzle db
  (createDbClient as ReturnType<typeof vi.fn>).mockReturnValue({
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(({ val }) => ({
        limit: vi.fn().mockResolvedValue(
          // First call: find by publishable_api_key
          // Second call: check status by id
          dbRows[val] ? [dbRows[val]] : [],
        ),
      })),
    },
  });

  fastify.register(widgetAuthPlugin, { valkey });

  // Probe endpoint — returns the injected tenant context if auth passes
  fastify.get('/probe', async (req) => ({
    tenantId:   req.tenantId,
    shopDomain: req.shopDomain,
  }));

  return { fastify, valkey };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('widgetAuthPlugin — key extraction', () => {
  it('returns 401 when no key is provided', async () => {
    const { fastify } = buildApp();
    const res = await fastify.inject({ method: 'GET', url: '/probe', headers: { origin: VALID_ORIGIN } });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe('Unauthorised');
  });

  it('accepts key from X-Widget-Key header', async () => {
    const { fastify } = buildApp({
      [VALID_KEY]: { id: VALID_TENANT, shopDomain: VALID_DOMAIN, status: 'active' },
    });
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { origin: VALID_ORIGIN, 'x-widget-key': VALID_KEY },
    });
    expect(res.statusCode).toBe(200);
  });

  it('accepts key from ?widgetKey query param (SSE fallback)', async () => {
    const { fastify } = buildApp({
      [VALID_KEY]: { id: VALID_TENANT, shopDomain: VALID_DOMAIN, status: 'active' },
    });
    const res = await fastify.inject({
      method: 'GET', url: `/probe?widgetKey=${VALID_KEY}`,
      headers: { origin: VALID_ORIGIN },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 401 for a key that fails the format regex', async () => {
    const { fastify } = buildApp();
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { origin: VALID_ORIGIN, 'x-widget-key': 'not_a_valid_key' },
    });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).message).toMatch(/format/i);
  });

  it('rejects old pk_live_ style keys that do not match current format', async () => {
    const { fastify } = buildApp();
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { origin: VALID_ORIGIN, 'x-widget-key': 'pk_live_abc123' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('widgetAuthPlugin — DB / cache lookup', () => {
  it('returns 401 when key is not found in DB', async () => {
    const { fastify } = buildApp({});
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { origin: VALID_ORIGIN, 'x-widget-key': VALID_KEY },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when merchant status is frozen', async () => {
    const { fastify } = buildApp({
      [VALID_KEY]: { id: VALID_TENANT, shopDomain: VALID_DOMAIN, status: 'frozen' },
    });
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { origin: VALID_ORIGIN, 'x-widget-key': VALID_KEY },
    });
    expect(res.statusCode).toBe(401);
  });

  it('attaches tenantId and shopDomain on success', async () => {
    const { fastify } = buildApp({
      [VALID_KEY]: { id: VALID_TENANT, shopDomain: VALID_DOMAIN, status: 'active' },
    });
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { origin: VALID_ORIGIN, 'x-widget-key': VALID_KEY },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.tenantId).toBe(VALID_TENANT);
    expect(body.shopDomain).toBe(VALID_DOMAIN);
  });

  it('uses cache on second request — createDbClient called only once', async () => {
    const { fastify } = buildApp({
      [VALID_KEY]: { id: VALID_TENANT, shopDomain: VALID_DOMAIN, status: 'active' },
    });

    const inject = () =>
      fastify.inject({
        method: 'GET', url: '/probe',
        headers: { origin: VALID_ORIGIN, 'x-widget-key': VALID_KEY },
      });

    await inject(); // warms cache
    await inject(); // should hit cache

    // createDbClient should only have been called once (first request)
    expect(createDbClient).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when DB throws', async () => {
    (createDbClient as ReturnType<typeof vi.fn>).mockReturnValue({
      db: {
        select: vi.fn().mockReturnThis(),
        from:   vi.fn().mockReturnThis(),
        where:  vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('DB down')),
        }),
      },
    });

    const fastify = Fastify({ logger: false });
    fastify.register(widgetAuthPlugin, { valkey: makeValkey() });
    fastify.get('/probe', async () => ({ ok: true }));

    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { origin: VALID_ORIGIN, 'x-widget-key': VALID_KEY },
    });
    expect(res.statusCode).toBe(503);
  });
});

describe('widgetAuthPlugin — Origin validation', () => {
  it('returns 403 when Origin header is missing', async () => {
    const { fastify } = buildApp({
      [VALID_KEY]: { id: VALID_TENANT, shopDomain: VALID_DOMAIN, status: 'active' },
    });
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { 'x-widget-key': VALID_KEY }, // no Origin
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).message).toMatch(/Origin header is required/);
  });

  it('returns 403 when Origin is the string "null" (sandboxed iframe)', async () => {
    const { fastify } = buildApp({
      [VALID_KEY]: { id: VALID_TENANT, shopDomain: VALID_DOMAIN, status: 'active' },
    });
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { origin: 'null', 'x-widget-key': VALID_KEY },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when Origin hostname does not match shop_domain', async () => {
    const { fastify } = buildApp({
      [VALID_KEY]: { id: VALID_TENANT, shopDomain: VALID_DOMAIN, status: 'active' },
    });
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: { origin: 'https://evil.example.com', 'x-widget-key': VALID_KEY },
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).message).toMatch(/not authorised/);
  });

  it('is case-insensitive for Origin hostname comparison', async () => {
    const { fastify } = buildApp({
      [VALID_KEY]: { id: VALID_TENANT, shopDomain: VALID_DOMAIN, status: 'active' },
    });
    const res = await fastify.inject({
      method: 'GET', url: '/probe',
      headers: {
        origin: 'https://ACME-SHOP.myshopify.com', // uppercase
        'x-widget-key': VALID_KEY,
      },
    });
    expect(res.statusCode).toBe(200);
  });
});