import crypto from 'crypto';

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
