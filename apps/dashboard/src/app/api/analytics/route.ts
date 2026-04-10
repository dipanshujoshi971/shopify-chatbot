import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);

  try {
    const [convCount, msgCount, tokenSum, activeSessions, dailyStats] = await Promise.all([
      // Total conversations last 7 days
      pgPool.unsafe(
        `SELECT COUNT(*)::int AS count
           FROM "tenant_${sn}"."conversations"
          WHERE created_at >= NOW() - INTERVAL '7 days'`,
      ),
      // Total messages last 7 days
      pgPool.unsafe(
        `SELECT COUNT(*)::int AS count
           FROM "tenant_${sn}"."messages"
          WHERE created_at >= NOW() - INTERVAL '7 days'`,
      ),
      // Total tokens last 7 days
      pgPool.unsafe(
        `SELECT COALESCE(SUM(total_tokens_used), 0)::int AS total
           FROM "tenant_${sn}"."conversations"
          WHERE created_at >= NOW() - INTERVAL '7 days'`,
      ),
      // Active conversations (last 1 hour)
      pgPool.unsafe(
        `SELECT COUNT(*)::int AS count
           FROM "tenant_${sn}"."conversations"
          WHERE status = 'active'
            AND updated_at >= NOW() - INTERVAL '1 hour'`,
      ),
      // Daily conversations last 14 days for chart
      pgPool.unsafe(
        `SELECT TO_CHAR(created_at::date, 'Mon DD') AS label,
                COUNT(*)::int AS conversations,
                COALESCE(SUM(total_tokens_used), 0)::int AS tokens
           FROM "tenant_${sn}"."conversations"
          WHERE created_at >= NOW() - INTERVAL '14 days'
          GROUP BY created_at::date, label
          ORDER BY created_at::date`,
      ),
    ]);

    return NextResponse.json({
      conversations:  (convCount[0] as any)?.count   ?? 0,
      messages:       (msgCount[0] as any)?.count    ?? 0,
      tokensUsed:     (tokenSum[0] as any)?.total    ?? 0,
      activeSessions: (activeSessions[0] as any)?.count ?? 0,
      daily: dailyStats,
    });
  } catch {
    // Tenant schema might not exist yet (new install)
    return NextResponse.json({
      conversations: 0,
      messages: 0,
      tokensUsed: 0,
      activeSessions: 0,
      daily: [],
    });
  }
}