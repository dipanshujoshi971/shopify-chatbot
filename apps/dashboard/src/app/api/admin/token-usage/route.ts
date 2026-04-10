import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdmin } from '@/lib/admin';
import { db, pgPool } from '@/lib/db';
import { merchants, eq } from '@chatbot/db';

export async function GET(request: NextRequest) {
  const adminId = await getSuperAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days') ?? '30', 10)));

  const activeStores = await db
    .select({ id: merchants.id, shopDomain: merchants.shopDomain, planId: merchants.planId })
    .from(merchants)
    .where(eq(merchants.status, 'active'));

  // Per-merchant token usage
  const merchantUsage = await Promise.all(
    activeStores.map(async (store) => {
      const sn = store.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
      try {
        const [total, period, daily] = await Promise.all([
          pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations"`),
          pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '${days} days'`),
          pgPool.unsafe(`
            SELECT DATE_TRUNC('day', created_at) AS day,
                   COALESCE(SUM(total_tokens_used),0)::int AS tokens,
                   COALESCE(SUM(prompt_tokens),0)::int AS input_tokens,
                   COALESCE(SUM(completion_tokens),0)::int AS output_tokens,
                   COUNT(*)::int AS conversations
            FROM "tenant_${sn}"."conversations"
            WHERE created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY DATE_TRUNC('day', created_at)
            ORDER BY day ASC
          `),
        ]);
        return {
          merchantId: store.id,
          shopDomain: store.shopDomain,
          planId: store.planId,
          totalTokens: (total[0] as any)?.c ?? 0,
          totalInputTokens: (total[0] as any)?.input ?? 0,
          totalOutputTokens: (total[0] as any)?.output ?? 0,
          periodTokens: (period[0] as any)?.c ?? 0,
          periodInputTokens: (period[0] as any)?.input ?? 0,
          periodOutputTokens: (period[0] as any)?.output ?? 0,
          dailyBreakdown: daily,
        };
      } catch {
        return {
          merchantId: store.id,
          shopDomain: store.shopDomain,
          planId: store.planId,
          totalTokens: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          periodTokens: 0,
          periodInputTokens: 0,
          periodOutputTokens: 0,
          dailyBreakdown: [],
        };
      }
    }),
  );

  // Sort by period tokens descending (highest consumers first)
  merchantUsage.sort((a, b) => b.periodTokens - a.periodTokens);

  // Aggregate daily totals across all merchants
  const dailyTotals: Record<string, { tokens: number; inputTokens: number; outputTokens: number; conversations: number }> = {};
  for (const m of merchantUsage) {
    for (const d of m.dailyBreakdown) {
      const key = new Date((d as any).day).toISOString().slice(0, 10);
      if (!dailyTotals[key]) dailyTotals[key] = { tokens: 0, inputTokens: 0, outputTokens: 0, conversations: 0 };
      dailyTotals[key].tokens += (d as any).tokens;
      dailyTotals[key].inputTokens += (d as any).input_tokens;
      dailyTotals[key].outputTokens += (d as any).output_tokens;
      dailyTotals[key].conversations += (d as any).conversations;
    }
  }

  const platformDaily = Object.entries(dailyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  return NextResponse.json({
    days,
    merchantUsage: merchantUsage.map(({ dailyBreakdown, ...rest }) => rest),
    platformDaily,
    totalPlatformTokens: merchantUsage.reduce((sum, m) => sum + m.totalTokens, 0),
    totalPlatformInputTokens: merchantUsage.reduce((sum, m) => sum + m.totalInputTokens, 0),
    totalPlatformOutputTokens: merchantUsage.reduce((sum, m) => sum + m.totalOutputTokens, 0),
    periodPlatformTokens: merchantUsage.reduce((sum, m) => sum + m.periodTokens, 0),
    periodPlatformInputTokens: merchantUsage.reduce((sum, m) => sum + m.periodInputTokens, 0),
    periodPlatformOutputTokens: merchantUsage.reduce((sum, m) => sum + m.periodOutputTokens, 0),
  });
}
