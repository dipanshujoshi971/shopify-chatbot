'use client';

import {
  Gauge,
  Clock,
  Zap,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const RESPONSE_TIMES = [
  { time: '< 500ms', count: 1240, pct: 62 },
  { time: '500ms-1s', count: 480, pct: 24 },
  { time: '1s-2s', count: 200, pct: 10 },
  { time: '2s-5s', count: 60, pct: 3 },
  { time: '> 5s', count: 20, pct: 1 },
];

const UPTIME_DAYS = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  status: i === 12 ? 'degraded' : i === 22 ? 'incident' : 'operational',
}));

const HOURLY_LATENCY = [
  { hour: '00', avg: 420, p95: 890 },
  { hour: '04', avg: 380, p95: 720 },
  { hour: '08', avg: 510, p95: 1100 },
  { hour: '12', avg: 680, p95: 1450 },
  { hour: '16', avg: 720, p95: 1600 },
  { hour: '20', avg: 560, p95: 1200 },
];

const maxLatency = Math.max(...HOURLY_LATENCY.map((h) => h.p95));

export default function PerformancePage() {
  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Performance & Response</h2>
        <p className="text-sm text-muted-foreground mt-0.5">System health, latency metrics, and uptime monitoring</p>
      </div>

      {/* Health overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Response Time', value: '520ms', trend: -12, icon: Clock, color: 'text-primary bg-primary/10', good: true },
          { label: 'Uptime (30d)', value: '99.87%', trend: 0.02, icon: Activity, color: 'text-emerald-500 bg-emerald-500/10', good: true },
          { label: 'Error Rate', value: '0.3%', trend: -0.1, icon: AlertCircle, color: 'text-chart-4 bg-chart-4/10', good: true },
          { label: 'Throughput', value: '2.4k/hr', trend: 18, icon: Zap, color: 'text-chart-2 bg-chart-2/10', good: true },
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
        {/* Latency chart */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Latency by Hour</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Average and P95 response times</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Avg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-chart-5" />
                <span className="text-muted-foreground">P95</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-4 h-48">
            {HOURLY_LATENCY.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex gap-1 flex-1 items-end">
                  <div
                    className="flex-1 rounded-t-lg bg-gradient-to-t from-primary to-primary/60"
                    style={{ height: `${(h.avg / maxLatency) * 140}px` }}
                  />
                  <div
                    className="flex-1 rounded-t-lg bg-gradient-to-t from-chart-5 to-chart-5/60"
                    style={{ height: `${(h.p95 / maxLatency) * 140}px` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{h.hour}:00</span>
              </div>
            ))}
          </div>
        </div>

        {/* Response time distribution */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Response Time Distribution</h3>
          <p className="text-xs text-muted-foreground mb-5">Breakdown of response speeds</p>
          <div className="space-y-3">
            {RESPONSE_TIMES.map((rt) => (
              <div key={rt.time}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground">{rt.time}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{rt.count.toLocaleString()}</span>
                    <span className="text-[10px] font-semibold text-primary">{rt.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-2.5 rounded-full bg-accent/30 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      rt.pct >= 50 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                      rt.pct >= 10 ? 'bg-gradient-to-r from-primary to-primary/60' :
                      rt.pct >= 3 ? 'bg-gradient-to-r from-chart-4 to-chart-4/60' :
                      'bg-gradient-to-r from-red-400 to-red-400/60',
                    )}
                    style={{ width: `${Math.max(rt.pct, 2)}%` }}
                  />
                </div>
              </div>
            ))}
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
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span className="text-muted-foreground">Incident</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {UPTIME_DAYS.map((d) => (
            <div
              key={d.day}
              className={cn(
                'flex-1 h-10 rounded-md transition-all hover:scale-110',
                d.status === 'operational' ? 'bg-emerald-500/60 hover:bg-emerald-500/80' :
                d.status === 'degraded' ? 'bg-amber-500/60 hover:bg-amber-500/80' :
                'bg-red-500/60 hover:bg-red-500/80',
              )}
              title={`Day ${d.day}: ${d.status}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* System resources */}
      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { label: 'CPU Usage', value: 34, icon: Cpu, unit: '%', status: 'Healthy' },
          { label: 'Memory', value: 62, icon: HardDrive, unit: '%', status: 'Normal' },
          { label: 'Network I/O', value: 28, icon: Wifi, unit: 'MB/s', status: 'Healthy' },
        ].map((resource) => (
          <div key={resource.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <resource.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{resource.label}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                {resource.status}
              </span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-foreground">{resource.value}</span>
              <span className="text-sm text-muted-foreground mb-1">{resource.unit}</span>
            </div>
            <div className="mt-3 w-full h-2 rounded-full bg-accent/30 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  resource.value < 50 ? 'bg-emerald-500' : resource.value < 80 ? 'bg-chart-4' : 'bg-red-400',
                )}
                style={{ width: `${resource.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
