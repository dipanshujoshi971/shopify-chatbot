import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);
  const { id } = await params;

  try {
    await pgPool.unsafe(
      `ALTER TABLE "tenant_${sn}"."support_tickets"
       ADD COLUMN IF NOT EXISTS admin_unread_count INT NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS merchant_unread_count INT NOT NULL DEFAULT 0`,
    );
    await pgPool.unsafe(
      `UPDATE "tenant_${sn}"."support_tickets"
          SET merchant_unread_count = 0
        WHERE id = $1`,
      [id],
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}
