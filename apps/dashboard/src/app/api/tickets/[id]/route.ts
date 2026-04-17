import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';
import { emitRealtime } from '@/lib/internal-emit';

export async function GET(
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
    const rows = await pgPool.unsafe(
      `SELECT id, subject, customer_email, customer_message, status, ticket_type,
              priority, conversation_id, replies, assignee, created_at, updated_at,
              admin_unread_count, merchant_unread_count
         FROM "tenant_${sn}"."support_tickets"
        WHERE id = $1`,
      [id],
    );

    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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

    return NextResponse.json({ ticket, messages });
  } catch {
    return NextResponse.json({ error: 'Failed to load ticket' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);
  const { id } = await params;

  const body = (await req.json()) as {
    status?: string;
    assignee?: string;
    priority?: string;
    reply?: { author: string; message: string };
  };

  try {
    const existingRows = await pgPool.unsafe(
      `SELECT ticket_type, subject FROM "tenant_${sn}"."support_tickets" WHERE id = $1`,
      [id],
    );
    const existing = existingRows[0] as
      | { ticket_type?: string; subject?: string }
      | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updates: string[] = ['updated_at = now()'];
    const vals: (string | number)[] = [];
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
        author: body.reply.author,
        message: body.reply.message,
        createdAt: new Date().toISOString(),
      };
      updates.push(`replies = COALESCE(replies, '[]'::jsonb) || $${idx++}::jsonb`);
      vals.push(JSON.stringify(replyObj));
      // Merchant replying on a merchant_to_admin ticket → bump admin unread.
      if (existing.ticket_type === 'merchant_to_admin') {
        updates.push(`admin_unread_count = COALESCE(admin_unread_count, 0) + 1`);
      }
    }

    vals.push(id);

    await pgPool.unsafe(
      `UPDATE "tenant_${sn}"."support_tickets"
          SET ${updates.join(', ')}
        WHERE id = $${idx}`,
      vals,
    );

    if (replyObj && existing.ticket_type === 'merchant_to_admin') {
      emitRealtime('admin:global', 'ticket:reply', {
        ticketId: id,
        merchantId: merchant.id,
        shopDomain: merchant.shopDomain,
        subject: existing.subject,
        from: 'merchant',
        reply: replyObj,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
