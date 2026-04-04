import { NextResponse } from 'next/server';
import { getSuperAdmin } from '@/lib/admin';
import { db, pgPool } from '@/lib/db';
import { merchants, eq, sql } from '@chatbot/db';

export async function GET() {
  const adminId = await getSuperAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Platform-wide stats
  const [allMerchants, activeMerchants, frozenMerchants] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(merchants),
    db.select({ count: sql<number>`count(*)::int` }).from(merchants).where(eq(merchants.status, 'active')),
    db.select({ count: sql<number>`count(*)::int` }).from(merchants).where(eq(merchants.status, 'frozen')),
  ]);

  // Get all active merchant IDs to query tenant schemas
  const activeStores = await db
    .select({ id: merchants.id, planId: merchants.planId })
    .from(merchants)
    .where(eq(merchants.status, 'active'));

  let totalTokens = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalConversations = 0;
  let totalMessages = 0;
  let totalTokensToday = 0;
  let totalInputTokensToday = 0;
  let totalOutputTokensToday = 0;
  let totalConvsToday = 0;

  for (const store of activeStores) {
    const sn = store.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
    try {
      const [tokens, convs, msgs, tokensToday, convsToday] = await Promise.all([
        pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations"`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations"`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."messages"`),
        pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '1 day'`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '1 day'`),
      ]);
      totalTokens += (tokens[0] as any)?.c ?? 0;
      totalInputTokens += (tokens[0] as any)?.input ?? 0;
      totalOutputTokens += (tokens[0] as any)?.output ?? 0;
      totalConversations += (convs[0] as any)?.c ?? 0;
      totalMessages += (msgs[0] as any)?.c ?? 0;
      totalTokensToday += (tokensToday[0] as any)?.c ?? 0;
      totalInputTokensToday += (tokensToday[0] as any)?.input ?? 0;
      totalOutputTokensToday += (tokensToday[0] as any)?.output ?? 0;
      totalConvsToday += (convsToday[0] as any)?.c ?? 0;
    } catch {
      // Tenant schema might not exist yet
    }
  }

  // Plan distribution
  const planCounts: Record<string, number> = {};
  for (const s of activeStores) {
    planCounts[s.planId] = (planCounts[s.planId] ?? 0) + 1;
  }

  return NextResponse.json({
    totalMerchants: allMerchants[0]?.count ?? 0,
    activeMerchants: activeMerchants[0]?.count ?? 0,
    frozenMerchants: frozenMerchants[0]?.count ?? 0,
    totalTokens,
    totalInputTokens,
    totalOutputTokens,
    totalConversations,
    totalMessages,
    totalTokensToday,
    totalInputTokensToday,
    totalOutputTokensToday,
    totalConvsToday,
    planDistribution: planCounts,
  });
}
