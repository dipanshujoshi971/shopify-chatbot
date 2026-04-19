'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Zap,
  MessageSquare,
  Users,
  TrendingUp,
  ArrowUpRight,
  Crown,
  Loader2,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { estimateCost, formatCost } from '@/lib/token-cost';
import { SHOW_BILLING } from '@/lib/flags';

interface PlatformStats {
  totalMerchants: number;
  activeMerchants: number;
  frozenMerchants: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalConversations: number;
  totalMessages: number;
  totalTokensToday: number;
  totalInputTokensToday: number;
  totalOutputTokensToday: number;
  totalConvsToday: number;
  planDistribution: Record<string, number>;
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-blue-500/15 text-blue-500',
  growth: 'bg-emerald-500/15 text-emerald-500',
  pro: 'bg-violet-500/15 text-violet-500',
  enterprise: 'bg-amber-500/15 text-amber-500',
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const totalCost = estimateCost(stats.totalInputTokens, stats.totalOutputTokens);
  const todayCost = estimateCost(stats.totalInputTokensToday, stats.totalOutputTokensToday);

  const statCards = [
    {
      label: 'Total Merchants',
      value: stats.totalMerchants,
      icon: Store,
      sublabel: `${stats.activeMerchants} active, ${stats.frozenMerchants} frozen`,
      accent: false,
    },
    {
      label: 'Platform Tokens',
      value: stats.totalTokens.toLocaleString(),
      icon: Zap,
      sublabel: `${stats.totalTokensToday.toLocaleString()} today`,
      accent: true,
    },
    {
      label: 'Total Conversations',
      value: stats.totalConversations.toLocaleString(),
      icon: MessageSquare,
      sublabel: `${stats.totalConvsToday} today`,
      accent: false,
    },
    {
      label: 'Total Messages',
      value: stats.totalMessages.toLocaleString(),
      icon: Users,
      sublabel: 'All time',
      accent: false,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Activity className="w-3 h-3" />
              Super Admin
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Platform Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor all merchants and platform-wide usage
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={
              s.accent
                ? 'relative rounded-2xl p-5 bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/20 overflow-hidden'
                : 'glass-card p-5'
            }
          >
            {s.accent && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            )}
            <div className="flex items-center justify-between relative z-10">
              <span className={s.accent ? 'text-xs text-white/70 font-medium' : 'text-xs text-muted-foreground font-medium'}>
                {s.label}
              </span>
              <div className={s.accent ? 'w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center' : 'w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center'}>
                <s.icon className={s.accent ? 'w-5 h-5 text-white' : 'w-5 h-5 text-red-500'} />
              </div>
            </div>
            <p className={`text-3xl font-bold mt-3 relative z-10 ${s.accent ? 'text-white' : 'text-foreground'}`}>
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </p>
            <p className={`text-xs mt-1 relative z-10 ${s.accent ? 'text-white/60' : 'text-muted-foreground'}`}>
              {s.sublabel}
            </p>
          </div>
        ))}
      </div>

      {/* Token Breakdown + Cost */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Input Tokens</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalInputTokens.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.totalInputTokensToday.toLocaleString()} today</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Output Tokens</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <ArrowUpFromLine className="w-4 h-4 text-violet-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalOutputTokens.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.totalOutputTokensToday.toLocaleString()} today</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Est. Total Cost</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCost(totalCost)}</p>
          <p className="text-xs text-muted-foreground mt-1">Based on gpt-4.1-mini pricing</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Est. Cost Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCost(todayCost)}</p>
          <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Plan Distribution */}
        {SHOW_BILLING && (
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Plan Distribution</h3>
          <div className="space-y-3">
            {['starter', 'growth', 'pro', 'enterprise'].map((plan) => {
              const count = stats.planDistribution[plan] ?? 0;
              const pct = stats.activeMerchants > 0 ? Math.round((count / stats.activeMerchants) * 100) : 0;
              return (
                <div key={plan} className="flex items-center gap-3">
                  <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize', PLAN_COLORS[plan])}>
                    {plan}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-accent/30 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', {
                        'bg-blue-500': plan === 'starter',
                        'bg-emerald-500': plan === 'growth',
                        'bg-violet-500': plan === 'pro',
                        'bg-amber-500': plan === 'enterprise',
                      })}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Quick Actions */}
        <div className={cn('glass-card p-6', SHOW_BILLING ? 'lg:col-span-3' : 'lg:col-span-5')}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                href: '/admin/merchants',
                icon: Store,
                title: 'Manage Merchants',
                desc: `${stats.activeMerchants} active merchants`,
                color: 'text-blue-500 bg-blue-500/10',
              },
              {
                href: '/admin/token-usage',
                icon: Zap,
                title: 'Token Analytics',
                desc: `${formatCost(totalCost)} estimated cost`,
                color: 'text-red-500 bg-red-500/10',
              },
              {
                href: '/admin/merchants?status=frozen',
                icon: TrendingUp,
                title: 'Frozen Accounts',
                desc: `${stats.frozenMerchants} frozen merchants`,
                color: 'text-amber-500 bg-amber-500/10',
              },
              {
                href: '/admin/merchants?status=active',
                icon: Crown,
                title: 'Active Merchants',
                desc: 'View all active stores',
                color: 'text-emerald-500 bg-emerald-500/10',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[var(--glass-border)] hover:bg-accent/30 transition-all group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
