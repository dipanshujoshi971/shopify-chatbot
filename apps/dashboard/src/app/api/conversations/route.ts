import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);
  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
  const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));
  const status = searchParams.get('status') ?? 'all';
  const offset = (page - 1) * limit;

  const whereClause = status !== 'all' ? `WHERE status = '${status}'` : '';

  try {
    const [rows, countRows] = await Promise.all([
      pgPool.unsafe(
        `SELECT id, session_id, status, total_tokens_used, total_turns, created_at, updated_at
           FROM "tenant_${sn}"."conversations"
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      pgPool.unsafe(
        `SELECT COUNT(*)::int AS total
           FROM "tenant_${sn}"."conversations"
           ${whereClause}`,
      ),
    ]);

    return NextResponse.json({
      conversations: rows,
      total: (countRows[0] as any)?.total ?? 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ conversations: [], total: 0, page: 1, limit });
  }
}