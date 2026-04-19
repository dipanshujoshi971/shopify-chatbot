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

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<string> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.statusText}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
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