'use client';

import {
  Users,
  Globe,
  Clock,
  Smartphone,
  Monitor,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Activity,
  UserCheck,
  UserX,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ENGAGEMENT_HOURS = [
  { hour: '6am', value: 12 },
  { hour: '8am', value: 35 },
  { hour: '10am', value: 58 },
  { hour: '12pm', value: 72 },
  { hour: '2pm', value: 65 },
  { hour: '4pm', value: 48 },
  { hour: '6pm', value: 80 },
  { hour: '8pm', value: 92 },
  { hour: '10pm', value: 55 },
  { hour: '12am', value: 20 },
];

const maxValue = Math.max(...ENGAGEMENT_HOURS.map((h) => h.value));

const LOCATIONS = [
  { country: 'United States', pct: 42, visitors: '1,260' },
  { country: 'United Kingdom', pct: 18, visitors: '540' },
  { country: 'Canada', pct: 14, visitors: '420' },
  { country: 'Germany', pct: 10, visitors: '300' },
  { country: 'Australia', pct: 8, visitors: '240' },
  { country: 'Other', pct: 8, visitors: '240' },
];

const DEVICES = [
  { device: 'Mobile', pct: 62, icon: Smartphone, color: 'text-primary bg-primary/10' },
  { device: 'Desktop', pct: 32, icon: Monitor, color: 'text-chart-2 bg-chart-2/10' },
  { device: 'Tablet', pct: 6, icon: Monitor, color: 'text-chart-3 bg-chart-3/10' },
];

export default function CustomerBehaviorPage() {
  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Customer Behavior</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Understand how your customers interact with the chatbot</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unique Visitors', value: '3,000', trend: 15, icon: Users, color: 'text-primary bg-primary/10' },
          { label: 'Engagement Rate', value: '34%', trend: 5, icon: Activity, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Returning Users', value: '28%', trend: 8, icon: Repeat, color: 'text-chart-2 bg-chart-2/10' },
          { label: 'Avg Session Time', value: '3m 24s', trend: -2, icon: Clock, color: 'text-chart-4 bg-chart-4/10' },
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
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Peak hours heatmap */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground">Peak Engagement Hours</h3>
            <p className="text-xs text-muted-foreground mt-0.5">When your customers are most active</p>
          </div>
          <div className="flex items-end gap-2 h-48">
            {ENGAGEMENT_HOURS.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[9px] text-foreground font-semibold">{h.value}</span>
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all duration-500',
                    h.value === maxValue
                      ? 'bg-gradient-to-t from-primary to-primary/70 shadow-lg shadow-primary/20'
                      : 'bg-gradient-to-t from-primary/40 to-primary/20',
                  )}
                  style={{ height: `${(h.value / maxValue) * 150}px` }}
                />
                <span className="text-[9px] text-muted-foreground">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device breakdown */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Device Distribution</h3>
          <p className="text-xs text-muted-foreground mb-5">How customers access the chatbot</p>
          <div className="space-y-4">
            {DEVICES.map((d) => (
              <div key={d.device} className="flex items-center gap-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', d.color)}>
                  <d.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{d.device}</span>
                    <span className="text-sm font-bold text-foreground">{d.pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-accent/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-[var(--glass-border)]">
            <h4 className="text-xs font-semibold text-foreground mb-3">User Segments</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
                <UserCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">72%</p>
                <p className="text-[10px] text-muted-foreground">Engaged</p>
              </div>
              <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3 text-center">
                <UserX className="w-4 h-4 text-red-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">28%</p>
                <p className="text-[10px] text-muted-foreground">Bounced</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic distribution */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-chart-2/10 flex items-center justify-center">
            <Globe className="w-4.5 h-4.5 text-chart-2" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Geographic Distribution</h3>
            <p className="text-xs text-muted-foreground">Where your chatbot users are located</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LOCATIONS.map((loc) => (
            <div key={loc.country} className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-[var(--glass-border)]">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{loc.country}</p>
                <p className="text-xs text-muted-foreground">{loc.visitors} visitors</p>
              </div>
              <span className="text-sm font-bold text-foreground">{loc.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
