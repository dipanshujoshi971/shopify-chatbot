import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

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
    const [convRows, msgRows] = await Promise.all([
      pgPool.unsafe(
        `SELECT id, session_id, status, total_tokens_used, total_turns, created_at, updated_at
           FROM "tenant_${sn}"."conversations"
          WHERE id = $1`,
        [id],
      ),
      pgPool.unsafe(
        `SELECT id, role, content, created_at
           FROM "tenant_${sn}"."messages"
          WHERE conversation_id = $1
          ORDER BY created_at ASC`,
        [id],
      ),
    ]);

    if (!convRows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      conversation: convRows[0],
      messages: msgRows,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}