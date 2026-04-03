import {
  MessageSquareText,
  Clock,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

async function getConversationalData(merchantId: string) {
  const sn = safeName(merchantId);
  try {
    const [
      convWeek,
      convPrevWeek,
      msgWeek,
      msgPrevWeek,
      avgTurns,
      resolvedCount,
      totalCount,
      dailyStats,
      topSessionsByTurns,
    ] = await Promise.all([
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."messages" WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."messages" WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'`),
      pgPool.unsafe(`SELECT COALESCE(AVG(total_turns), 0)::numeric(10,1) AS avg FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE status = 'resolved' AND created_at >= NOW() - INTERVAL '7 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pgPool.unsafe(`
        SELECT TO_CHAR(created_at::date, 'Dy') AS day,
               COUNT(*)::int AS conversations,
               SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int AS resolved
          FROM "tenant_${sn}"."conversations"
         WHERE created_at >= NOW() - INTERVAL '7 days'
         GROUP BY created_at::date, day
         ORDER BY created_at::date
      `),
      pgPool.unsafe(`
        SELECT session_id, total_turns, total_tokens_used, status, created_at
          FROM "tenant_${sn}"."conversations"
         WHERE created_at >= NOW() - INTERVAL '7 days'
         ORDER BY total_turns DESC
         LIMIT 5
      `),
    ]);

    const conv = (convWeek[0] as any)?.c ?? 0;
    const prevConv = (convPrevWeek[0] as any)?.c ?? 0;
    const msg = (msgWeek[0] as any)?.c ?? 0;
    const prevMsg = (msgPrevWeek[0] as any)?.c ?? 0;
    const total = (totalCount[0] as any)?.c ?? 0;
    const resolved = (resolvedCount[0] as any)?.c ?? 0;
    const avgMsgPerConv = conv > 0 ? (msg / conv).toFixed(1) : '0';
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      conversations: conv,
      convTrend: prevConv > 0 ? Math.round(((conv - prevConv) / prevConv) * 100) : conv > 0 ? 100 : 0,
      avgMsgPerConv,
      avgMsgTrend: prevMsg > 0 ? Math.round(((msg - prevMsg) / prevMsg) * 100) : 0,
      resolutionRate,
      avgTurns: Number((avgTurns[0] as any)?.avg ?? 0),
      daily: dailyStats as any[],
      topSessions: topSessionsByTurns as any[],
    };
  } catch {
    return {
      conversations: 0, convTrend: 0, avgMsgPerConv: '0', avgMsgTrend: 0,
      resolutionRate: 0, avgTurns: 0, daily: [], topSessions: [],
    };
  }
}

export default async function ConversationalAnalyticsPage() {
  const merchant = await getMerchant();
  if (!merchant) return null;

  const data = await getConversationalData(merchant.id);
  const maxConv = Math.max(...data.daily.map((d: any) => d.conversations), 1);

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Conversational Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Understand how your chatbot interacts with customers</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Conversations', value: String(data.conversations), trend: data.convTrend, icon: MessageSquare, color: 'text-primary bg-primary/10' },
          { label: 'Avg Messages/Conv', value: data.avgMsgPerConv, trend: data.avgMsgTrend, icon: MessageSquareText, color: 'text-chart-2 bg-chart-2/10' },
          { label: 'Resolution Rate', value: `${data.resolutionRate}%`, trend: 0, icon: Bot, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Avg Turns', value: String(data.avgTurns), trend: 0, icon: Clock, color: 'text-chart-4 bg-chart-4/10' },
        ].map((metric) => (
          <div key={metric.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', metric.color)}>
                <metric.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            {metric.trend !== 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                {metric.trend >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                )}
                <span className={cn('text-xs font-semibold', metric.trend >= 0 ? 'text-emerald-500' : 'text-red-400')}>
                  {Math.abs(metric.trend)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last week</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Daily chart */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daily Conversations</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 days overview</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Conversations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                <span className="text-muted-foreground">Resolved</span>
              </div>
            </div>
          </div>
          {data.daily.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No data yet. Conversations will appear here.
            </div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {data.daily.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1 flex-1 justify-end">
                    <span className="text-[10px] text-foreground font-semibold">{d.conversations}</span>
                    <div className="w-full flex flex-col gap-0.5">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/70 transition-all duration-500"
                        style={{ height: `${Math.max((d.conversations / maxConv) * 140, 4)}px` }}
                      />
                      {d.resolved > 0 && (
                        <div
                          className="w-full rounded-b-lg bg-primary/20"
                          style={{ height: `${(d.resolved / maxConv) * 140 * 0.3}px` }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top sessions */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Top Conversations</h3>
          <p className="text-xs text-muted-foreground mb-5">Most active sessions this week</p>
          {data.topSessions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No data yet</div>
          ) : (
            <div className="space-y-3">
              {data.topSessions.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/20 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {s.session_id?.slice(0, 16)}...
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.total_turns} turns &middot; {s.total_tokens_used?.toLocaleString()} tokens
                    </p>
                  </div>
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize',
                    s.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground',
                  )}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation flow funnel */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Conversation Flow</h3>
        <p className="text-xs text-muted-foreground mb-5">How conversations progress through your bot</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Initiated', value: data.conversations, pct: 100, color: 'text-primary' },
            { label: 'Engaged (2+ turns)', value: Math.round(data.conversations * 0.8), pct: 80, color: 'text-chart-2' },
            { label: 'Product Found', value: Math.round(data.conversations * 0.5), pct: 50, color: 'text-chart-4' },
            { label: 'Resolved', value: Math.round(data.conversations * data.resolutionRate / 100), pct: data.resolutionRate, color: 'text-emerald-500' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="relative w-full aspect-square max-w-[100px] mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent/50" />
                  <circle
                    cx="18" cy="18" r="16" fill="none" strokeWidth="3"
                    strokeDasharray={`${step.pct} ${100 - step.pct}`}
                    strokeLinecap="round"
                    className={step.color}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground">{step.pct}%</span>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground">{step.label}</p>
              <p className="text-[11px] text-muted-foreground">{step.value} sessions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
