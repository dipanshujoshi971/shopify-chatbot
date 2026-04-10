'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Store,
  Crown,
  Loader2,
  TrendingUp,
  Calendar,
  ExternalLink,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { estimateCost, formatCost } from '@/lib/token-cost';

interface MerchantUsage {
  merchantId: string;
  shopDomain: string;
  planId: string;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  periodTokens: number;
  periodInputTokens: number;
  periodOutputTokens: number;
}

interface DailyData {
  date: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  conversations: number;
}

interface TokenUsageData {
  days: number;
  merchantUsage: MerchantUsage[];
  platformDaily: DailyData[];
  totalPlatformTokens: number;
  totalPlatformInputTokens: number;
  totalPlatformOutputTokens: number;
  periodPlatformTokens: number;
  periodPlatformInputTokens: number;
  periodPlatformOutputTokens: number;
}

const PLAN_STYLES: Record<string, string> = {
  starter: 'bg-blue-500/15 text-blue-500',
  growth: 'bg-emerald-500/15 text-emerald-500',
  pro: 'bg-violet-500/15 text-violet-500',
  enterprise: 'bg-amber-500/15 text-amber-500',
};

export default function AdminTokenUsagePage() {
  const [data, setData] = useState<TokenUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/token-usage?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const maxDailyTokens = Math.max(...data.platformDaily.map((d) => d.tokens), 1);
  const totalCost = estimateCost(data.totalPlatformInputTokens, data.totalPlatformOutputTokens);
  const periodCost = estimateCost(data.periodPlatformInputTokens, data.periodPlatformOutputTokens);
  const avgDailyCost = data.platformDaily.length > 0 ? periodCost / data.platformDaily.length : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Token Usage & Cost</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform-wide token consumption and cost analytics
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                days === d
                  ? 'border-red-500/30 bg-red-500/10 text-red-500'
                  : 'border-[var(--glass-border)] text-muted-foreground hover:text-foreground hover:bg-accent/30',
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards — 2 rows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total tokens */}
        <div className="relative rounded-2xl p-4 bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/20 overflow-hidden col-span-2 sm:col-span-1 lg:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <span className="text-[10px] text-white/70 font-medium">Total Tokens</span>
          <p className="text-2xl font-bold mt-1 relative z-10">{data.totalPlatformTokens.toLocaleString()}</p>
          <p className="text-[10px] text-white/50 mt-0.5">All time</p>
        </div>

        {/* Input tokens */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownToLine className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] text-muted-foreground font-medium">Input ({days}d)</span>
          </div>
          <p className="text-xl font-bold text-foreground">{data.periodPlatformInputTokens.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{data.totalPlatformInputTokens.toLocaleString()} total</p>
        </div>

        {/* Output tokens */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpFromLine className="w-3 h-3 text-violet-500" />
            <span className="text-[10px] text-muted-foreground font-medium">Output ({days}d)</span>
          </div>
          <p className="text-xl font-bold text-foreground">{data.periodPlatformOutputTokens.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{data.totalPlatformOutputTokens.toLocaleString()} total</p>
        </div>

        {/* Period cost */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] text-muted-foreground font-medium">Period Cost ({days}d)</span>
          </div>
          <p className="text-xl font-bold text-emerald-500">{formatCost(periodCost)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{formatCost(totalCost)} total</p>
        </div>

        {/* Avg daily cost */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-muted-foreground font-medium">Avg Daily Cost</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCost(avgDailyCost)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Per day average</p>
        </div>

        {/* I/O ratio */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-muted-foreground font-medium">I/O Ratio</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {data.periodPlatformOutputTokens > 0
              ? (data.periodPlatformInputTokens / data.periodPlatformOutputTokens).toFixed(1)
              : '—'}
            :1
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Input to Output</p>
        </div>
      </div>

      {/* Daily Usage Chart — Stacked */}
      {data.platformDaily.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Daily Platform Token Usage</h3>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">Input</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-violet-500" />
                <span className="text-muted-foreground">Output</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-[2px] h-48">
            {data.platformDaily.map((d, i) => {
              const height = Math.max((d.tokens / maxDailyTokens) * 100, 2);
              const inputPct = d.tokens > 0 ? (d.inputTokens / d.tokens) * 100 : 50;
              const date = new Date(d.date);
              const dayCost = estimateCost(d.inputTokens, d.outputTokens);
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                >
                  <div className="hidden group-hover:block absolute -top-16 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap z-10 shadow-lg">
                    <p className="text-blue-500 font-semibold">{d.inputTokens.toLocaleString()} input</p>
                    <p className="text-violet-500 font-semibold">{d.outputTokens.toLocaleString()} output</p>
                    <p className="text-emerald-500 font-semibold">{formatCost(dayCost)}</p>
                    <p className="text-muted-foreground">{d.conversations} convs &middot; {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div
                    className="w-full rounded-t overflow-hidden opacity-80 hover:opacity-100 transition-opacity min-h-[2px]"
                    style={{ height: `${height}%` }}
                  >
                    <div className="w-full bg-blue-500" style={{ height: `${inputPct}%` }} />
                    <div className="w-full bg-violet-500" style={{ height: `${100 - inputPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              {data.platformDaily[0] && new Date(data.platformDaily[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {data.platformDaily.at(-1) && new Date(data.platformDaily.at(-1)!.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      {/* Per-Merchant Usage Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--glass-border)]">
          <h3 className="text-sm font-semibold text-foreground">Token Usage & Cost by Merchant</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Sorted by highest cost in the selected period</p>
        </div>
        {data.merchantUsage.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No usage data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">#</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Store</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Plan</th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="flex items-center justify-end gap-1"><ArrowDownToLine className="w-3 h-3" />Input ({days}d)</span>
                  </th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="flex items-center justify-end gap-1"><ArrowUpFromLine className="w-3 h-3" />Output ({days}d)</span>
                  </th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="flex items-center justify-end gap-1"><DollarSign className="w-3 h-3" />Period Cost</span>
                  </th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="flex items-center justify-end gap-1"><DollarSign className="w-3 h-3" />Total Cost</span>
                  </th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Cost Bar</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {data.merchantUsage.map((m, i) => {
                  const mPeriodCost = estimateCost(m.periodInputTokens, m.periodOutputTokens);
                  const mTotalCost = estimateCost(m.totalInputTokens, m.totalOutputTokens);
                  const maxPeriodCost = estimateCost(
                    data.merchantUsage[0]?.periodInputTokens || 0,
                    data.merchantUsage[0]?.periodOutputTokens || 0,
                  );
                  const barPct = maxPeriodCost > 0 ? Math.max((mPeriodCost / maxPeriodCost) * 100, 1) : 1;
                  return (
                    <tr key={m.merchantId} className="hover:bg-accent/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-muted-foreground font-mono">{i + 1}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Store className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-foreground truncate max-w-[160px]">{m.shopDomain}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize flex items-center gap-1 w-fit', PLAN_STYLES[m.planId])}>
                          <Crown className="w-3 h-3" />
                          {m.planId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-semibold text-blue-500">{m.periodInputTokens.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-semibold text-violet-500">{m.periodOutputTokens.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-emerald-500">{formatCost(mPeriodCost)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm text-muted-foreground">{formatCost(mTotalCost)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-28 h-2 rounded-full bg-accent/30 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/merchants/${m.merchantId}`}
                          className="text-xs text-red-500 font-semibold hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
