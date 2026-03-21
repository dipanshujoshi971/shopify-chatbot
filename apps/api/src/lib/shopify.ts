import crypto from 'crypto';
import { env } from '../env.js';

export const SHOPIFY_SCOPES = env.SHOPIFY_SCOPES;

// Step 1 of OAuth — build the URL that sends merchant to Shopify's consent screen
export function buildInstallUrl(shop: string, state: string): string {
  const redirectUri = `${env.APP_URL}/api/auth/shopify/callback`;

  const params = new URLSearchParams({
    client_id: env.SHOPIFY_CLIENT_ID,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state,                    // random string to prevent CSRF attacks
    'grant_options[]': 'per-user',
  });

  return `https://${shop}/admin/oauth/authorize?${params}`;
}

// Step 2 of OAuth — exchange the code Shopify gave us for a real access token
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

// Verify the request actually came from Shopify, not an attacker
// Shopify signs every request with your client secret using HMAC-SHA256
export function verifyShopifyHmac(
  query: Record<string, string>
): boolean {
  const { hmac, ...rest } = query;

  if (!hmac) return false;

  // Sort params alphabetically and join as key=value pairs
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&');

  // Create our own HMAC and compare with Shopify's
  const expected = crypto
    .createHmac('sha256', env.SHOPIFY_CLIENT_SECRET)
    .update(message)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(expected)
  );
}

// Validate that the shop domain is a real Shopify store
// Prevents someone passing malicious URLs like "evil.com"
export function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

// Encrypt the access token before storing in Postgres
// If your database is ever breached, tokens are still protected
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(env.SHOPIFY_CLIENT_SECRET, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(token), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

// Decrypt the token when you need to make API calls
export function decryptToken(encryptedToken: string): string {
  const [ivHex, encryptedHex] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const key = crypto.scryptSync(env.SHOPIFY_CLIENT_SECRET, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}