import { NextRequest, NextResponse } from 'next/server';
import { getSuperAdmin } from '@/lib/admin';
import { db, pgPool } from '@/lib/db';
import { merchants, eq, sql } from '@chatbot/db';

export async function GET(request: NextRequest) {
  const adminId = await getSuperAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  // Build query conditions
  let query = db
    .select({
      id: merchants.id,
      shopDomain: merchants.shopDomain,
      status: merchants.status,
      planId: merchants.planId,
      clerkUserId: merchants.clerkUserId,
      createdAt: merchants.createdAt,
      frozenAt: merchants.frozenAt,
    })
    .from(merchants)
    .$dynamic();

  if (status) {
    query = query.where(eq(merchants.status, status));
  }

  const allRows = await query.orderBy(sql`${merchants.createdAt} DESC`);

  // Filter by search if needed
  let filtered = allRows;
  if (search) {
    const s = search.toLowerCase();
    filtered = allRows.filter(
      (m) => m.shopDomain.toLowerCase().includes(s) || m.id.toLowerCase().includes(s),
    );
  }

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  // Enrich each merchant with token usage from their tenant schema
  const enriched = await Promise.all(
    paged.map(async (m) => {
      const sn = m.id.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
      let totalTokens = 0;
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalConversations = 0;
      let tokensThisWeek = 0;
      let inputTokensThisWeek = 0;
      let outputTokensThisWeek = 0;
      try {
        const [tokens, convs, weekly] = await Promise.all([
          pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations"`),
          pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations"`),
          pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c, COALESCE(SUM(prompt_tokens),0)::int AS input, COALESCE(SUM(completion_tokens),0)::int AS output FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
        ]);
        totalTokens = (tokens[0] as any)?.c ?? 0;
        totalInputTokens = (tokens[0] as any)?.input ?? 0;
        totalOutputTokens = (tokens[0] as any)?.output ?? 0;
        totalConversations = (convs[0] as any)?.c ?? 0;
        tokensThisWeek = (weekly[0] as any)?.c ?? 0;
        inputTokensThisWeek = (weekly[0] as any)?.input ?? 0;
        outputTokensThisWeek = (weekly[0] as any)?.output ?? 0;
      } catch {
        // Tenant schema may not exist
      }
      return {
        ...m,
        totalTokens,
        totalInputTokens,
        totalOutputTokens,
        totalConversations,
        tokensThisWeek,
        inputTokensThisWeek,
        outputTokensThisWeek,
      };
    }),
  );

  return NextResponse.json({
    merchants: enriched,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
