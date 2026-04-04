import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdmin } from '@/lib/admin';
import { db, pgPool } from '@/lib/db';
import { merchants, eq } from '@chatbot/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await getSuperAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  const rows = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, id))
    .limit(1);

  if (!rows[0]) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });

  const merchant = rows[0];
  const sn = merchant.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');

  let stats = {
    totalTokens: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalConversations: 0,
    totalMessages: 0,
    activeConversations: 0,
    tokensToday: 0,
    inputTokensToday: 0,
    outputTokensToday: 0,
    tokensThisWeek: 0,
    inputTokensThisWeek: 0,
    outputTokensThisWeek: 0,
    tokensThisMonth: 0,
    inputTokensThisMonth: 0,
    outputTokensThisMonth: 0,
    convsToday: 0,
    convsThisWeek: 0,
    openTickets: 0,
    recentConversations: [] as any[],
    dailyUsage: [] as any[],
  };

  try {
    const [
      tokens, convs, msgs, active, tokensToday, tokensWeek, tokensMonth,
      convsToday, convsWeek, tickets, recentConvs, dailyUsage,
    ] = await Promise.all([
      pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations"`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations"`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."messages"`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE status='active' AND updated_at >= NOW() - INTERVAL '1 hour'`),
      pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '1 day'`),
      pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '30 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '1 day'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."support_tickets" WHERE status != 'resolved'`).catch(() => [{ c: 0 }]),
      pgPool.unsafe(`SELECT id, session_id, customer_id, status, total_turns, total_tokens_used, prompt_tokens, completion_tokens, created_at FROM "tenant_${sn}"."conversations" ORDER BY created_at DESC LIMIT 10`),
      pgPool.unsafe(`
        SELECT DATE_TRUNC('day', created_at) AS day,
               COALESCE(SUM(total_tokens_used),0)::int AS tokens,
               COALESCE(SUM(prompt_tokens),0)::int AS input_tokens,
               COALESCE(SUM(completion_tokens),0)::int AS output_tokens,
               COUNT(*)::int AS conversations
        FROM "tenant_${sn}"."conversations"
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY day ASC
      `),
    ]);

    stats = {
      totalTokens: (tokens[0] as any)?.c ?? 0,
      totalInputTokens: (tokens[0] as any)?.input ?? 0,
      totalOutputTokens: (tokens[0] as any)?.output ?? 0,
      totalConversations: (convs[0] as any)?.c ?? 0,
      totalMessages: (msgs[0] as any)?.c ?? 0,
      activeConversations: (active[0] as any)?.c ?? 0,
      tokensToday: (tokensToday[0] as any)?.c ?? 0,
      inputTokensToday: (tokensToday[0] as any)?.input ?? 0,
      outputTokensToday: (tokensToday[0] as any)?.output ?? 0,
      tokensThisWeek: (tokensWeek[0] as any)?.c ?? 0,
      inputTokensThisWeek: (tokensWeek[0] as any)?.input ?? 0,
      outputTokensThisWeek: (tokensWeek[0] as any)?.output ?? 0,
      tokensThisMonth: (tokensMonth[0] as any)?.c ?? 0,
      inputTokensThisMonth: (tokensMonth[0] as any)?.input ?? 0,
      outputTokensThisMonth: (tokensMonth[0] as any)?.output ?? 0,
      convsToday: (convsToday[0] as any)?.c ?? 0,
      convsThisWeek: (convsWeek[0] as any)?.c ?? 0,
      openTickets: (tickets[0] as any)?.c ?? 0,
      recentConversations: recentConvs as any[],
      dailyUsage: dailyUsage as any[],
    };
  } catch {
    // Tenant schema might not exist
  }

  // Return merchant without encrypted token (security)
  return NextResponse.json({
    merchant: {
      id: merchant.id,
      shopDomain: merchant.shopDomain,
      status: merchant.status,
      planId: merchant.planId,
      publishableApiKey: merchant.publishableApiKey,
      clerkUserId: merchant.clerkUserId,
      clerkOrgId: merchant.clerkOrgId,
      stripeCustomerId: merchant.stripeCustomerId,
      stripeSubscriptionId: merchant.stripeSubscriptionId,
      dpaAcceptedAt: merchant.dpaAcceptedAt,
      frozenAt: merchant.frozenAt,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
    },
    stats,
  });
}
