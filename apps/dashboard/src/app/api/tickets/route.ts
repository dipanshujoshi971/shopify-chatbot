import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';
import { nanoid } from '@/lib/nanoid';

async function ensureTicketColumns(sn: string) {
  await pgPool.unsafe(
    `ALTER TABLE "tenant_${sn}"."support_tickets"
     ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '',
     ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'customer',
     ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
     ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]'::jsonb,
     ADD COLUMN IF NOT EXISTS assignee TEXT`,
  );
}

const VALID_STATUSES = new Set(['open', 'assigned', 'resolved']);
const VALID_TYPES = new Set(['customer', 'merchant_to_admin']);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));
  const offset = (page - 1) * limit;
  const rawStatus = searchParams.get('status') ?? 'all';
  const status = VALID_STATUSES.has(rawStatus) ? rawStatus : null;
  const rawType = searchParams.get('type') ?? 'all';
  const ticketType = VALID_TYPES.has(rawType) ? rawType : null;

  try {
    await ensureTicketColumns(sn);

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (status) {
      conditions.push(`status = $${paramIdx++}`);
      params.push(status);
    }
    if (ticketType) {
      conditions.push(`ticket_type = $${paramIdx++}`);
      params.push(ticketType);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countRows] = await Promise.all([
      pgPool.unsafe(
        `SELECT id, subject, customer_email, customer_message, status, ticket_type,
                priority, conversation_id, replies, assignee, created_at, updated_at
           FROM "tenant_${sn}"."support_tickets"
           ${where}
           ORDER BY created_at DESC
           LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
        [...params, limit, offset],
      ),
      pgPool.unsafe(
        `SELECT COUNT(*)::int AS total
           FROM "tenant_${sn}"."support_tickets"
           ${where}`,
        params,
      ),
    ]);

    return NextResponse.json({
      tickets: rows,
      total: (countRows[0] as any)?.total ?? 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ tickets: [], total: 0, page: 1, limit });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);
  const body = (await req.json()) as {
    subject: string;
    message: string;
    customerEmail?: string;
    conversationId?: string;
    ticketType?: string;
    priority?: string;
  };

  if (!body.subject || !body.message) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
  }

  try {
    await ensureTicketColumns(sn);

    const id = nanoid();
    await pgPool.unsafe(
      `INSERT INTO "tenant_${sn}"."support_tickets"
         (id, subject, customer_email, customer_message, conversation_id, ticket_type, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', now(), now())`,
      [
        id,
        body.subject,
        body.customerEmail ?? merchant.shopDomain,
        body.message,
        body.conversationId ?? null,
        body.ticketType ?? 'customer',
        body.priority ?? 'medium',
      ],
    );

    return NextResponse.json({ success: true, ticketId: id });
  } catch {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
