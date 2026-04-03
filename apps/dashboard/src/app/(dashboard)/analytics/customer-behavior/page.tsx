import {
  Users,
  Globe,
  Clock,
  Smartphone,
  Monitor,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  UserCheck,
  UserX,
  Repeat,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

async function getCustomerData(merchantId: string) {
  const sn = safeName(merchantId);
  try {
    const [
      uniqueSessions,
      prevUniqueSessions,
      totalConvs,
      engagedConvs,
      returningSessions,
      hourlyActivity,
    ] = await Promise.all([
      pgPool.unsafe(`SELECT COUNT(DISTINCT session_id)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '30 days'`),
      pgPool.unsafe(`SELECT COUNT(DISTINCT session_id)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '30 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE total_turns >= 2 AND created_at >= NOW() - INTERVAL '30 days'`),
      pgPool.unsafe(`
        SELECT COUNT(*)::int AS c FROM (
          SELECT session_id FROM "tenant_${sn}"."conversations"
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY session_id HAVING COUNT(*) > 1
        ) AS returning_users
      `),
      pgPool.unsafe(`
        SELECT EXTRACT(HOUR FROM created_at)::int AS hour,
               COUNT(*)::int AS conversations
          FROM "tenant_${sn}"."conversations"
         WHERE created_at >= NOW() - INTERVAL '7 days'
         GROUP BY hour
         ORDER BY hour
      `),
    ]);

    const unique = (uniqueSessions[0] as any)?.c ?? 0;
    const prevUnique = (prevUniqueSessions[0] as any)?.c ?? 0;
    const total = (totalConvs[0] as any)?.c ?? 0;
    const engaged = (engagedConvs[0] as any)?.c ?? 0;
    const returning = (returningSessions[0] as any)?.c ?? 0;
    const engagementRate = total > 0 ? Math.round((engaged / total) * 100) : 0;
    const returningRate = unique > 0 ? Math.round((returning / unique) * 100) : 0;
    const uniqueTrend = prevUnique > 0 ? Math.round(((unique - prevUnique) / prevUnique) * 100) : unique > 0 ? 100 : 0;

    return {
      uniqueVisitors: unique,
      uniqueTrend,
      engagementRate,
      returningRate,
      hourlyActivity: hourlyActivity as any[],
      engagedCount: engaged,
      bouncedCount: total - engaged,
      totalConvs: total,
    };
  } catch {
    return {
      uniqueVisitors: 0, uniqueTrend: 0, engagementRate: 0, returningRate: 0,
      hourlyActivity: [], engagedCount: 0, bouncedCount: 0, totalConvs: 0,
    };
  }
}

export default async function CustomerBehaviorPage() {
  const merchant = await getMerchant();
  if (!merchant) return null;

  const data = await getCustomerData(merchant.id);

  // Build engagement hours (show 6am to 12am, every 2 hours)
  const hourlyMap = new Map(data.hourlyActivity.map((h: any) => [h.hour, h.conversations]));
  const engagementHours = Array.from({ length: 10 }, (_, i) => {
    const hour = 6 + i * 2;
    const h = hour % 24;
    return {
      hour: h,
      label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`,
      value: (hourlyMap.get(h) ?? 0) as number,
    };
  });
  const maxValue = Math.max(...engagementHours.map((h) => h.value), 1);

  const engagedPct = data.totalConvs > 0 ? Math.round((data.engagedCount / data.totalConvs) * 100) : 0;
  const bouncedPct = 100 - engagedPct;

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Customer Behavior</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Understand how your customers interact with the chatbot</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unique Visitors', value: data.uniqueVisitors.toLocaleString(), trend: data.uniqueTrend, icon: Users, color: 'text-primary bg-primary/10' },
          { label: 'Engagement Rate', value: `${data.engagementRate}%`, trend: 0, icon: Activity, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Returning Users', value: `${data.returningRate}%`, trend: 0, icon: Repeat, color: 'text-chart-2 bg-chart-2/10' },
          { label: 'Total Sessions', value: data.totalConvs.toLocaleString(), trend: 0, icon: Clock, color: 'text-chart-4 bg-chart-4/10' },
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
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Peak hours */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground">Peak Engagement Hours</h3>
            <p className="text-xs text-muted-foreground mt-0.5">When your customers are most active (last 7 days)</p>
          </div>
          {engagementHours.every((h) => h.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No data yet. Activity will appear here.
            </div>
          ) : (
            <div className="flex items-end gap-2 h-48">
              {engagementHours.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[9px] text-foreground font-semibold">{h.value}</span>
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all duration-500',
                      h.value === maxValue
                        ? 'bg-gradient-to-t from-primary to-primary/70 shadow-lg shadow-primary/20'
                        : 'bg-gradient-to-t from-primary/40 to-primary/20',
                    )}
                    style={{ height: `${Math.max((h.value / maxValue) * 150, 4)}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{h.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Engagement breakdown */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Engagement Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-5">How customers interact with the chatbot</p>

          {/* Donut-style visual */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-accent/30" />
                <circle
                  cx="18" cy="18" r="14" fill="none" strokeWidth="4"
                  strokeDasharray={`${engagedPct} ${bouncedPct}`}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{engagedPct}%</p>
                  <p className="text-[9px] text-muted-foreground">engaged</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
              <UserCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{engagedPct}%</p>
              <p className="text-[10px] text-muted-foreground">Engaged (2+ turns)</p>
            </div>
            <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3 text-center">
              <UserX className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{bouncedPct}%</p>
              <p className="text-[10px] text-muted-foreground">Bounced (1 turn)</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Returning visitor rate</span>
              <span className="font-bold text-foreground">{data.returningRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
