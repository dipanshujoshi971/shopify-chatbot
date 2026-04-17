import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdmin } from '@/lib/admin';
import { db, pgPool } from '@/lib/db';
import { merchants } from '@chatbot/db';
import { emitRealtime } from '@/lib/internal-emit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await getSuperAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  const stores = await db.select({ id: merchants.id, shopDomain: merchants.shopDomain }).from(merchants);

  for (const store of stores) {
    const sn = store.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
    try {
      const rows = await pgPool.unsafe(
        `SELECT id, subject, customer_email, customer_message, status, ticket_type,
                priority, conversation_id, replies, assignee, created_at, updated_at,
                admin_unread_count, merchant_unread_count
           FROM "tenant_${sn}"."support_tickets"
          WHERE id = $1`,
        [id],
      );

      if (rows[0]) {
        const ticket = rows[0] as any;
        let messages: unknown[] = [];
        if (ticket.conversation_id) {
          messages = await pgPool.unsafe(
            `SELECT id, role, content, created_at
               FROM "tenant_${sn}"."messages"
              WHERE conversation_id = $1
              ORDER BY created_at ASC`,
            [ticket.conversation_id],
          );
        }

        return NextResponse.json({
          ticket: { ...ticket, merchantId: store.id, shopDomain: store.shopDomain },
          messages,
        });
      }
    } catch {
      // Continue searching other schemas
    }
  }

  return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await getSuperAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    assignee?: string;
    priority?: string;
    reply?: { message: string };
  };

  const stores = await db
    .select({ id: merchants.id, shopDomain: merchants.shopDomain })
    .from(merchants);

  for (const store of stores) {
    const sn = store.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
    try {
      const check = await pgPool.unsafe(
        `SELECT id FROM "tenant_${sn}"."support_tickets" WHERE id = $1`,
        [id],
      );

      if (!check[0]) continue;

      // Defensive: a merchant who hasn't visited their tickets page since
      // deploy won't have the unread columns yet. ADD IF NOT EXISTS is a
      // cheap no-op once the columns are present.
      await pgPool.unsafe(
        `ALTER TABLE "tenant_${sn}"."support_tickets"
         ADD COLUMN IF NOT EXISTS admin_unread_count INT NOT NULL DEFAULT 0,
         ADD COLUMN IF NOT EXISTS merchant_unread_count INT NOT NULL DEFAULT 0`,
      );

      const updates: string[] = ['updated_at = now()'];
      const vals: unknown[] = [];
      let idx = 1;

      if (body.status) {
        updates.push(`status = $${idx++}`);
        vals.push(body.status);
      }
      if (body.assignee !== undefined) {
        updates.push(`assignee = $${idx++}`);
        vals.push(body.assignee);
      }
      if (body.priority) {
        updates.push(`priority = $${idx++}`);
        vals.push(body.priority);
      }

      let replyObj:
        | { id: string; author: string; message: string; createdAt: string }
        | null = null;
      if (body.reply) {
        replyObj = {
          id: `reply_${Date.now()}`,
          author: 'Super Admin',
          message: body.reply.message,
          createdAt: new Date().toISOString(),
        };
        updates.push(`replies = COALESCE(replies, '[]'::jsonb) || $${idx++}::jsonb`);
        vals.push(JSON.stringify(replyObj));
        updates.push(`merchant_unread_count = COALESCE(merchant_unread_count, 0) + 1`);
      }

      vals.push(id);

      await pgPool.unsafe(
        `UPDATE "tenant_${sn}"."support_tickets"
            SET ${updates.join(', ')}
          WHERE id = $${idx}`,
        vals as any[],
      );

      if (replyObj) {
        emitRealtime(`tenant:${store.id}`, 'ticket:reply', {
          ticketId: id,
          from: 'admin',
          reply: replyObj,
        });
      }

      return NextResponse.json({ success: true });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
}
