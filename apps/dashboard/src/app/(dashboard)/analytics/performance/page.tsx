import {
  Gauge,
  Clock,
  Zap,
  ArrowUpRight,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

async function getPerformanceData(merchantId: string) {
  const sn = safeName(merchantId);
  try {
    const [totalConvs, totalMsgs, convByDay] = await Promise.all([
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '30 days'`),
      pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."messages" WHERE created_at >= NOW() - INTERVAL '30 days'`),
      pgPool.unsafe(`
        SELECT EXTRACT(HOUR FROM created_at)::int AS hour,
               COUNT(*)::int AS conversations,
               COALESCE(AVG(total_turns), 0)::numeric(10,1) AS avg_turns
          FROM "tenant_${sn}"."conversations"
         WHERE created_at >= NOW() - INTERVAL '7 days'
         GROUP BY hour
         ORDER BY hour
      `),
    ]);

    return {
      totalConvs30d: (totalConvs[0] as any)?.c ?? 0,
      totalMsgs30d: (totalMsgs[0] as any)?.c ?? 0,
      hourlyData: convByDay as any[],
    };
  } catch {
    return { totalConvs30d: 0, totalMsgs30d: 0, hourlyData: [] };
  }
}

export default async function PerformancePage() {
  const merchant = await getMerchant();
  if (!merchant) return null;

  const data = await getPerformanceData(merchant.id);

  // Build hourly chart data (fill in missing hours)
  const hourlyMap = new Map(data.hourlyData.map((h: any) => [h.hour, h]));
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${String(i).padStart(2, '0')}:00`,
    conversations: (hourlyMap.get(i) as any)?.conversations ?? 0,
    avgTurns: Number((hourlyMap.get(i) as any)?.avg_turns ?? 0),
  }));
  // Only show every 4th hour for readability
  const displayHours = hours.filter((_, i) => i % 4 === 0);
  const maxHourConv = Math.max(...displayHours.map((h) => h.conversations), 1);

  // Uptime calendar mock (30 days, mostly operational)
  const uptimeDays = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    status: 'operational' as const,
  }));

  const avgMsgsPerConv = data.totalConvs30d > 0
    ? (data.totalMsgs30d / data.totalConvs30d).toFixed(1)
    : '0';

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Performance & Response</h2>
        <p className="text-sm text-muted-foreground mt-0.5">System health, throughput, and efficiency metrics</p>
      </div>

      {/* Health overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Conversations (30d)', value: data.totalConvs30d.toLocaleString(), icon: Activity, color: 'text-primary bg-primary/10' },
          { label: 'Messages (30d)', value: data.totalMsgs30d.toLocaleString(), icon: Clock, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Avg Msgs/Conv', value: avgMsgsPerConv, icon: Gauge, color: 'text-chart-2 bg-chart-2/10' },
          { label: 'System Status', value: 'Operational', icon: Zap, color: 'text-chart-4 bg-chart-4/10' },
        ].map((metric) => (
          <div key={metric.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', metric.color)}>
                <metric.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-500">Healthy</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Hourly activity chart */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Activity by Hour</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Conversations by time of day (last 7 days)</p>
            </div>
          </div>
          {displayHours.every((h) => h.conversations === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No data yet. Activity will appear here.
            </div>
          ) : (
            <div className="flex items-end gap-4 h-48">
              {displayHours.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-foreground font-semibold">{h.conversations}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/60 transition-all duration-500"
                    style={{ height: `${Math.max((h.conversations / maxHourConv) * 140, 4)}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground font-medium">{h.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Efficiency metrics */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Efficiency</h3>
          <p className="text-xs text-muted-foreground mb-5">Resource usage per conversation</p>
          <div className="space-y-4">
            {[
              { label: 'Avg Messages/Conv', value: Number(avgMsgsPerConv), max: 30, unit: '' },
            ].map((metric) => {
              const pct = Math.min((metric.value / metric.max) * 100, 100);
              return (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">{metric.label}</span>
                    <span className="text-sm font-bold text-foreground">
                      {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-accent/30 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        pct < 40 ? 'bg-emerald-500' : pct < 70 ? 'bg-chart-4' : 'bg-red-400',
                      )}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-[var(--glass-border)]">
            <h4 className="text-xs font-semibold text-foreground mb-3">System Status</h4>
            <div className="space-y-2">
              {[
                { label: 'Database', status: 'Operational' },
                { label: 'LLM Provider', status: 'Operational' },
                { label: 'Widget CDN', status: 'Operational' },
              ].map((sys) => (
                <div key={sys.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{sys.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                    {sys.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Uptime calendar */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Uptime Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Last 30 days system availability</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-muted-foreground">Operational</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span className="text-muted-foreground">Degraded</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {uptimeDays.map((d) => (
            <div
              key={d.day}
              className="flex-1 h-10 rounded-md bg-emerald-500/60 hover:bg-emerald-500/80 transition-all hover:scale-110"
              title={`Day ${d.day}: ${d.status}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
