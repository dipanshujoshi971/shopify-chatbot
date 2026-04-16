import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { merchants, eq } from '@chatbot/db';
import { decryptToken, getActiveThemeId } from '@/lib/shopify';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
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

  const accessToken = decryptToken(merchant.encryptedShopifyToken);
  const themeId = await getActiveThemeId(merchant.shopDomain, accessToken);

  if (!themeId) {
    return NextResponse.json({ error: 'Could not fetch active theme' }, { status: 500 });
  }

  // Extract store handle from "storename.myshopify.com"
  const storeHandle = merchant.shopDomain.replace('.myshopify.com', '');
  const url = `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps`;

  return NextResponse.json({ url });
}
