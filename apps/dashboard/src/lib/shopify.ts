import crypto from 'crypto';
import { db } from '@/lib/db';
import { merchants, eq } from '@chatbot/db';

const SHOPIFY_API_VERSION = '2026-04';

/** Decrypt a Shopify access token that was encrypted with AES-256-CBC */
export function decryptToken(encryptedToken: string): string {
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!secret) throw new Error('SHOPIFY_CLIENT_SECRET is not configured');

  const [ivHex, encryptedHex] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const key = crypto.scryptSync(secret, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}

function encryptToken(token: string): string {
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!secret) throw new Error('SHOPIFY_CLIENT_SECRET is not configured');
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(secret, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(token), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

interface ShopifyTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
}

/**
 * Returns a valid (decrypted, non-expired) Shopify Admin API token for the
 * merchant, refreshing via the stored refresh token when within 60s of expiry.
 * Throws if the refresh token itself has expired — caller must prompt reinstall.
 */
export async function getValidAccessToken(merchantId: string): Promise<string> {
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
  if (expiresAt > now + 60_000) {
    return decryptToken(m.encryptedShopifyToken);
  }

  if (!m.encryptedShopifyRefreshToken) {
    throw new Error(`Merchant ${merchantId} has no refresh token — must reinstall`);
  }
  if ((m.shopifyRefreshTokenExpiresAt?.getTime() ?? 0) <= now) {
    throw new Error(`Refresh token expired for merchant ${merchantId} — must reinstall`);
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET not configured');
  }

  const res = await fetch(`https://${m.shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: decryptToken(m.encryptedShopifyRefreshToken),
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to refresh token: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as ShopifyTokenResponse;
  if (!data.access_token || !data.refresh_token) {
    throw new Error('Malformed refresh response from Shopify');
  }

  await db
    .update(merchants)
    .set({
      encryptedShopifyToken: encryptToken(data.access_token),
      shopifyTokenExpiresAt: new Date(now + data.expires_in * 1000),
      encryptedShopifyRefreshToken: encryptToken(data.refresh_token),
      shopifyRefreshTokenExpiresAt: new Date(now + data.refresh_token_expires_in * 1000),
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchantId));

  return data.access_token;
}

/** Fetch the published theme ID from Shopify Admin API */
export async function getActiveThemeId(
  shop: string,
  accessToken: string,
): Promise<string | null> {
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/themes.json?role=main`,
    {
      headers: { 'X-Shopify-Access-Token': accessToken },
    },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { themes?: { id: number; role: string }[] };
  const main = data.themes?.find((t) => t.role === 'main');
  return main ? String(main.id) : null;
}
