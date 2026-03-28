import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { merchants, eq } from '@chatbot/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      id: merchants.id,
      shopDomain: merchants.shopDomain,
      status: merchants.status,
      planId: merchants.planId,
      publishableApiKey: merchants.publishableApiKey,
      createdAt: merchants.createdAt,
    })
    .from(merchants)
    .where(eq(merchants.clerkUserId, userId))
    .limit(1);

  if (!rows[0]) return NextResponse.json({ merchant: null });
  return NextResponse.json({ merchant: rows[0] });
}