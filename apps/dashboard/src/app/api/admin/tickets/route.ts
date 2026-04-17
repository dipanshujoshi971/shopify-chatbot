import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdmin } from '@/lib/admin';
import { db, pgPool } from '@/lib/db';
import { merchants, eq } from '@chatbot/db';

export async function GET(request: NextRequest) {
  const adminId = await getSuperAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const merchantFilter = url.searchParams.get('merchant');

  // Get all active merchants (or filter by specific merchant)
  let storeQuery = db
    .select({ id: merchants.id, shopDomain: merchants.shopDomain })
    .from(merchants)
    .$dynamic();

  if (merchantFilter) {
    storeQuery = storeQuery.where(eq(merchants.id, merchantFilter));
  }

  const stores = await storeQuery;

  const allTickets: any[] = [];

  for (const store of stores) {
    const sn = store.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
    try {
      // Ensure columns exist
      await pgPool.unsafe(
        `ALTER TABLE "tenant_${sn}"."support_tickets"
         ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '',
         ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'customer',
         ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
         ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]'::jsonb,
         ADD COLUMN IF NOT EXISTS assignee TEXT,
         ADD COLUMN IF NOT EXISTS admin_unread_count INT NOT NULL DEFAULT 0,
         ADD COLUMN IF NOT EXISTS merchant_unread_count INT NOT NULL DEFAULT 0`,
      );

      const conditions: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (status) {
        conditions.push(`status = $${idx++}`);
        params.push(status);
      }
      if (type) {
        conditions.push(`ticket_type = $${idx++}`);
        params.push(type);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const rows = await pgPool.unsafe(
        `SELECT id, subject, customer_email, customer_message, status, ticket_type,
                priority, conversation_id, replies, assignee, created_at, updated_at,
                admin_unread_count, merchant_unread_count
           FROM "tenant_${sn}"."support_tickets"
           ${where}
           ORDER BY created_at DESC
           LIMIT 100`,
        params as any[],
      );

      for (const row of rows) {
        allTickets.push({
          ...row,
          merchantId: store.id,
          shopDomain: store.shopDomain,
        });
      }
    } catch {
      // Tenant schema might not exist or table missing
    }
  }

  // Sort all tickets by created_at desc
  allTickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    tickets: allTickets,
    total: allTickets.length,
  });
}
