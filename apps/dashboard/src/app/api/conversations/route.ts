import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

// Valid status values — whitelist prevents SQL injection
const VALID_STATUSES = new Set(['active', 'resolved', 'escalated']);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);
  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
  const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));
  const offset = (page - 1) * limit;

  // Whitelist status to prevent SQL injection — never interpolate user input directly
  const rawStatus = searchParams.get('status') ?? 'all';
  const status    = VALID_STATUSES.has(rawStatus) ? rawStatus : null; // null = all

  try {
    let rows: unknown[];
    let countRows: unknown[];

    if (status) {
      // Filtered by status — use $3/$1 parameterised query
      [rows, countRows] = await Promise.all([
        pgPool.unsafe(
          `SELECT id, session_id, status, total_tokens_used, total_turns, created_at, updated_at
             FROM "tenant_${sn}"."conversations"
            WHERE status = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3`,
          [status, limit, offset],
        ),
        pgPool.unsafe(
          `SELECT COUNT(*)::int AS total
             FROM "tenant_${sn}"."conversations"
            WHERE status = $1`,
          [status],
        ),
      ]);
    } else {
      // No filter
      [rows, countRows] = await Promise.all([
        pgPool.unsafe(
          `SELECT id, session_id, status, total_tokens_used, total_turns, created_at, updated_at
             FROM "tenant_${sn}"."conversations"
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2`,
          [limit, offset],
        ),
        pgPool.unsafe(
          `SELECT COUNT(*)::int AS total
             FROM "tenant_${sn}"."conversations"`,
        ),
      ]);
    }

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