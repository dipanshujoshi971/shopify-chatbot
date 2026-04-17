import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ count: 0 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ count: 0 });

  const sn = safeName(merchant.id);
  try {
    await pgPool.unsafe(
      `ALTER TABLE "tenant_${sn}"."support_tickets"
       ADD COLUMN IF NOT EXISTS merchant_unread_count INT NOT NULL DEFAULT 0`,
    );
    const rows = await pgPool.unsafe(
      `SELECT COALESCE(SUM(merchant_unread_count), 0)::int AS count
         FROM "tenant_${sn}"."support_tickets"
        WHERE ticket_type = 'merchant_to_admin'`,
    );
    return NextResponse.json({ count: (rows[0] as any)?.count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
