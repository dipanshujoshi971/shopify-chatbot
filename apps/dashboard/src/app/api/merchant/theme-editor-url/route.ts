import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { merchants, eq } from '@chatbot/db';
import { getValidAccessToken, getActiveThemeId } from '@/lib/shopify';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      id: merchants.id,
      shopDomain: merchants.shopDomain,
      encryptedShopifyToken: merchants.encryptedShopifyToken,
    })
    .from(merchants)
    .where(eq(merchants.clerkUserId, userId))
    .limit(1);

  const merchant = rows[0];
  if (!merchant || !merchant.encryptedShopifyToken) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(merchant.id);
  } catch {
    return NextResponse.json(
      { error: 'Shopify token expired — please reinstall the app' },
      { status: 401 },
    );
  }
  const themeId = await getActiveThemeId(merchant.shopDomain, accessToken);

  if (!themeId) {
    return NextResponse.json({ error: 'Could not fetch active theme' }, { status: 500 });
  }

  const storeHandle = merchant.shopDomain.replace('.myshopify.com', '');
  const url = `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps`;

  return NextResponse.json({ url });
}
