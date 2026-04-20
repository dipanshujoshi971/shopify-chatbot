import { NextResponse } from 'next/server';
import { getSuperAdmin } from '@/lib/admin';
import { db, pgPool } from '@/lib/db';
import { merchants } from '@chatbot/db';

export async function GET() {
  try {
    const adminId = await getSuperAdmin();
    if (!adminId) return NextResponse.json({ count: 0 });

    const stores = await db.select({ id: merchants.id }).from(merchants);

    let total = 0;
    for (const store of stores) {
      const sn = store.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
      try {
        const rows = await pgPool.unsafe(
          `SELECT COALESCE(SUM(admin_unread_count), 0)::int AS count
             FROM "tenant_${sn}"."support_tickets"`,
        );
        total += (rows[0] as any)?.count ?? 0;
      } catch {
        // schema missing or column missing — skip
      }
    }

    return NextResponse.json({ count: total });
  } catch (err) {
    console.error('[tickets/unread-count] failed:', err);
    return NextResponse.json({ count: 0 });
  }
}
