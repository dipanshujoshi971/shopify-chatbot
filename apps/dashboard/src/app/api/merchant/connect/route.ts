import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { merchants, eq } from '@chatbot/db';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shopDomain } = (await req.json()) as { shopDomain?: string };
  if (!shopDomain || !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shopDomain)) {
    return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 });
  }

  // Check the store exists in our DB
  const rows = await db
    .select({ id: merchants.id, clerkUserId: merchants.clerkUserId, status: merchants.status })
    .from(merchants)
    .where(eq(merchants.shopDomain, shopDomain))
    .limit(1);

  const merchant = rows[0];
  if (!merchant) {
    return NextResponse.json(
      { error: 'Store not found. Make sure you have installed the app from the Shopify App Store first.' },
      { status: 404 },
    );
  }

  if (merchant.status === 'frozen') {
    return NextResponse.json(
      { error: 'This store has been deactivated.' },
      { status: 403 },
    );
  }

  if (merchant.clerkUserId && merchant.clerkUserId !== userId) {
    return NextResponse.json(
      { error: 'This store is already connected to another account.' },
      { status: 409 },
    );
  }

  // Link Clerk user → merchant
  await db
    .update(merchants)
    .set({ clerkUserId: userId, updatedAt: new Date() })
    .where(eq(merchants.id, merchant.id));

  return NextResponse.json({ success: true, merchantId: merchant.id });
}