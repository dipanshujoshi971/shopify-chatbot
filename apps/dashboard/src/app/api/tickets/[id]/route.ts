import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';
import { sendTicketReplyEmail } from '@/lib/email';

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
              priority, conversation_id, replies, assignee, created_at, updated_at
         FROM "tenant_${sn}"."support_tickets"
        WHERE id = $1`,
      [id],
    );

    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If ticket has a linked conversation, fetch its messages
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
    // Update status / assignee / priority if provided
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

    // Add reply if provided
    if (body.reply) {
      const replyObj = {
        id: `reply_${Date.now()}`,
        author: body.reply.author,
        message: body.reply.message,
        createdAt: new Date().toISOString(),
      };
      updates.push(`replies = COALESCE(replies, '[]'::jsonb) || $${idx++}::jsonb`);
      vals.push(JSON.stringify(replyObj));
    }

    vals.push(id);

    await pgPool.unsafe(
      `UPDATE "tenant_${sn}"."support_tickets"
          SET ${updates.join(', ')}
        WHERE id = $${idx}`,
      vals,
    );

    // Send email notification to customer if this is a reply
    if (body.reply) {
      try {
        const ticketRows = await pgPool.unsafe(
          `SELECT customer_email, subject FROM "tenant_${sn}"."support_tickets" WHERE id = $1`,
          [id],
        );
        const ticket = ticketRows[0] as any;
        if (ticket?.customer_email) {
          const shopDomain = merchant.shopDomain ?? '';
          const storeName = shopDomain.replace('.myshopify.com', '').replace(/-/g, ' ');
          sendTicketReplyEmail({
            customerEmail: ticket.customer_email,
            storeName: storeName || 'Store',
            ticketSubject: ticket.subject || 'Your Support Ticket',
            replyMessage: body.reply.message,
            ticketId: id,
          }).catch(() => {}); // Fire and forget — don't block the response
        }
      } catch {
        // Email failure shouldn't block ticket update
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
