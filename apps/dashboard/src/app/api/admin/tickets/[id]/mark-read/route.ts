import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdmin } from '@/lib/admin';
import { db, pgPool } from '@/lib/db';
import { merchants } from '@chatbot/db';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await getSuperAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const stores = await db.select({ id: merchants.id }).from(merchants);

  for (const store of stores) {
    const sn = store.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
    try {
      await pgPool.unsafe(
        `ALTER TABLE "tenant_${sn}"."support_tickets"
         ADD COLUMN IF NOT EXISTS admin_unread_count INT NOT NULL DEFAULT 0,
         ADD COLUMN IF NOT EXISTS merchant_unread_count INT NOT NULL DEFAULT 0`,
      );
      const res = await pgPool.unsafe(
        `UPDATE "tenant_${sn}"."support_tickets"
            SET admin_unread_count = 0
          WHERE id = $1
        RETURNING id`,
        [id],
      );
      if (res.length > 0) {
        return NextResponse.json({ success: true });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
}
