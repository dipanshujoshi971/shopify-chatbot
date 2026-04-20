import crypto from 'crypto';
import { env } from '../env.js';

export const SHOPIFY_SCOPES = env.SHOPIFY_SCOPES;

const SHOPIFY_API_VERSION = '2026-04';

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function buildInstallUrl(shop: string, state: string): string {
  const redirectUri = `${env.APP_URL}/api/auth/shopify/callback`;

  // NOTE: We intentionally do NOT pass `grant_options[]=per-user` here.
  // Without it, Shopify returns an OFFLINE access token (prefix `shpat_`) that
  // is permanent until the merchant uninstalls. With `per-user`, Shopify
  // returns an ONLINE token (prefix `shpua_`) that expires in ~24 hours — that
  // would break background order lookups after a day.
  const params = new URLSearchParams({
    client_id: env.SHOPIFY_CLIENT_ID,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  return `https://${shop}/admin/oauth/authorize?${params}`;
}

// Shape of Shopify's expiring-token response (Dec 2025+).
// `expiring=1` must be sent in the request body to receive these fields.
export interface ShopifyTokenResponse {
  access_token: string;
  expires_in: number;              // access token lifetime in seconds (~3600)
  refresh_token: string;
  refresh_token_expires_in: number; // refresh token lifetime in seconds (~7776000 = 90d)
  scope: string;
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<ShopifyTokenResponse> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
      code,
      expiring: '1',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.statusText}`);
  }

  const data = await response.json() as ShopifyTokenResponse;
  if (!data.refresh_token || !data.expires_in) {
    throw new Error(
      'Shopify did not return an expiring token. Check that `expiring=1` is sent.',
    );
  }
  return data;
}

// Refresh an expiring offline access token using the stored refresh token.
// Refresh tokens rotate — always persist the NEW refresh_token returned here.
export async function refreshAccessToken(
  shop: string,
  refreshToken: string,
): Promise<ShopifyTokenResponse> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as ShopifyTokenResponse;
  if (!data.access_token || !data.refresh_token) {
    throw new Error('Malformed refresh response from Shopify');
  }
  return data;
}

// ─── HMAC helpers ────────────────────────────────────────────────────────────

// OAuth HMAC — query params, hex-encoded
export function verifyShopifyHmac(query: Record<string, string>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&');

  const expected = crypto
    .createHmac('sha256', env.SHOPIFY_CLIENT_SECRET)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
}

// Webhook HMAC — raw body bytes, base64-encoded (different from OAuth)
export function verifyShopifyWebhookHmac(rawBody: Buffer, hmacHeader: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.SHOPIFY_CLIENT_SECRET)
    .update(rawBody)
    .digest('base64');

  // Use equal-length buffers to prevent timing attacks
  const a = Buffer.from(hmacHeader, 'utf8');
  const b = Buffer.from(expected, 'utf8');

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ─── Domain validation ───────────────────────────────────────────────────────

export function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

// ─── Token encryption ────────────────────────────────────────────────────────

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(env.SHOPIFY_CLIENT_SECRET, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(token), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(encryptedToken: string): string {
  const [ivHex, encryptedHex] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const key = crypto.scryptSync(env.SHOPIFY_CLIENT_SECRET, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}

// ─── Valid token helper (handles refresh) ───────────────────────────────────

// Returns a decrypted, non-expired Shopify Admin API access token for the
// merchant. If the stored token is within 60s of expiry (or already expired),
// it's refreshed using the stored refresh token and the DB row is updated.
// Callers must handle the case where the refresh token itself has expired
// (90-day lifetime) — in that case, the merchant must reinstall.
export async function getValidAccessToken(merchantId: string): Promise<string> {
  const { db } = await import('../db.js');
  const { merchants } = await import('@chatbot/db');
  const { eq } = await import('drizzle-orm');

  const [m] = await db
    .select({
      shopDomain: merchants.shopDomain,
      encryptedShopifyToken: merchants.encryptedShopifyToken,
      shopifyTokenExpiresAt: merchants.shopifyTokenExpiresAt,
      encryptedShopifyRefreshToken: merchants.encryptedShopifyRefreshToken,
      shopifyRefreshTokenExpiresAt: merchants.shopifyRefreshTokenExpiresAt,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!m?.encryptedShopifyToken) {
    throw new Error(`No Shopify token stored for merchant ${merchantId}`);
  }

  const now = Date.now();
  const expiresAt = m.shopifyTokenExpiresAt?.getTime() ?? 0;
  const stillValid = expiresAt > now + 60_000; // 60s safety margin

  if (stillValid) {
    return decryptToken(m.encryptedShopifyToken);
  }

  // Need to refresh
  if (!m.encryptedShopifyRefreshToken) {
    throw new Error(
      `Merchant ${merchantId} has no refresh token — must reinstall the app`,
    );
  }
  const refreshExpiresAt = m.shopifyRefreshTokenExpiresAt?.getTime() ?? 0;
  if (refreshExpiresAt <= now) {
    throw new Error(
      `Refresh token expired for merchant ${merchantId} — must reinstall the app`,
    );
  }

  const refreshed = await refreshAccessToken(
    m.shopDomain,
    decryptToken(m.encryptedShopifyRefreshToken),
  );

  // Persist rotated tokens
  await db
    .update(merchants)
    .set({
      encryptedShopifyToken: encryptToken(refreshed.access_token),
      shopifyTokenExpiresAt: new Date(now + refreshed.expires_in * 1000),
      encryptedShopifyRefreshToken: encryptToken(refreshed.refresh_token),
      shopifyRefreshTokenExpiresAt: new Date(
        now + refreshed.refresh_token_expires_in * 1000,
      ),
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchantId));

  return refreshed.access_token;
}

// ─── Webhook registration ────────────────────────────────────────────────────

// Registers per-merchant webhook subscriptions via the Shopify Admin GraphQL API.
// GDPR webhooks (shop/redact, customers/redact, customers/data_request) are
// configured once in the Shopify Partner Dashboard — not registered per-merchant.
export async function registerWebhooks(
  shop: string,
  accessToken: string,
  logger?: { warn: (obj: object, msg: string) => void }
): Promise<void> {
  const appUrl = env.APP_URL;

  const subscriptions = [
    // Mandatory — fires when merchant uninstalls the app
    { topic: 'APP_UNINSTALLED', url: `${appUrl}/api/webhooks/shopify/app-uninstalled` },
    // Note: Product discovery uses Shopify Storefront MCP (live data).
    // No product/inventory webhooks needed — MCP queries real-time catalog.
  ];

  const mutation = `
    mutation webhookSubscriptionCreate(
      $topic: WebhookSubscriptionTopic!,
      $webhookSubscription: WebhookSubscriptionInput!
    ) {
      webhookSubscriptionCreate(
        topic: $topic
        webhookSubscription: $webhookSubscription
      ) {
        webhookSubscription { id }
        userErrors { field message }
      }
    }
  `;

  for (const { topic, url } of subscriptions) {
    const res = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            topic,
            webhookSubscription: { callbackUrl: url, format: 'JSON' },
          },
        }),
      }
    );

    if (!res.ok) {
      logger?.warn({ topic, status: res.statusText }, 'Failed to register webhook');
    }
  }
}