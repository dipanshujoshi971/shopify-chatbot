'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  Zap,
  MessageSquare,
  Users,
  ArrowLeft,
  Crown,
  Globe,
  Key,
  Clock,
  Copy,
  Check,
  Loader2,
  Activity,
  Bot,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { estimateCost, formatCost } from '@/lib/token-cost';

interface MerchantDetail {
  id: string;
  shopDomain: string;
  status: string;
  planId: string;
  publishableApiKey: string;
  clerkUserId: string | null;
  clerkOrgId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  dpaAcceptedAt: string | null;
  frozenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MerchantStats {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalConversations: number;
  totalMessages: number;
  activeConversations: number;
  tokensToday: number;
  inputTokensToday: number;
  outputTokensToday: number;
  tokensThisWeek: number;
  inputTokensThisWeek: number;
  outputTokensThisWeek: number;
  tokensThisMonth: number;
  inputTokensThisMonth: number;
  outputTokensThisMonth: number;
  convsToday: number;
  convsThisWeek: number;
  openTickets: number;
  recentConversations: any[];
  dailyUsage: any[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminMerchantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/merchants/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setMerchant(data.merchant);
        setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function copyApiKey() {
    if (merchant?.publishableApiKey) {
      navigator.clipboard.writeText(merchant.publishableApiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!merchant || !stats) {
    return (
      <div className="text-center py-20">
        <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Merchant not found</p>
        <Link href="/admin/merchants" className="text-xs text-red-500 font-semibold mt-2 inline-block">
          Back to Merchants
        </Link>
      </div>
    );
  }

  const totalCost = estimateCost(stats.totalInputTokens, stats.totalOutputTokens);
  const weeklyCost = estimateCost(stats.inputTokensThisWeek, stats.outputTokensThisWeek);
  const monthlyCost = estimateCost(stats.inputTokensThisMonth, stats.outputTokensThisMonth);

  // Simple bar chart from daily usage
  const maxTokens = Math.max(...stats.dailyUsage.map((d: any) => d.tokens), 1);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Back button + Header */}
      <div>
        <Link
          href="/admin/merchants"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Merchants
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{merchant.shopDomain}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize',
                merchant.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500',
              )}>
                {merchant.status}
              </span>
              <span className={cn('text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize flex items-center gap-1', {
                'bg-blue-500/15 text-blue-500': merchant.planId === 'starter',
                'bg-emerald-500/15 text-emerald-500': merchant.planId === 'growth',
                'bg-violet-500/15 text-violet-500': merchant.planId === 'pro',
                'bg-amber-500/15 text-amber-500': merchant.planId === 'enterprise',
              })}>
                <Crown className="w-3 h-3" />
                {merchant.planId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Token Usage — Input/Output Split */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Token Usage & Cost</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* All Time */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">All Time</p>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownToLine className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Input</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.totalInputTokens.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpFromLine className="w-3 h-3 text-violet-500" />
                <span className="text-xs text-muted-foreground">Output</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.totalOutputTokens.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Est. Cost</span>
              </div>
              <p className="text-lg font-bold text-emerald-500">{formatCost(totalCost)}</p>
            </div>
          </div>

          {/* Today */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Today</p>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownToLine className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Input</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.inputTokensToday.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpFromLine className="w-3 h-3 text-violet-500" />
                <span className="text-xs text-muted-foreground">Output</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.outputTokensToday.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Est. Cost</span>
              </div>
              <p className="text-lg font-bold text-emerald-500">{formatCost(estimateCost(stats.inputTokensToday, stats.outputTokensToday))}</p>
            </div>
          </div>

          {/* This Week */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">This Week</p>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownToLine className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Input</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.inputTokensThisWeek.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpFromLine className="w-3 h-3 text-violet-500" />
                <span className="text-xs text-muted-foreground">Output</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.outputTokensThisWeek.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Est. Cost</span>
              </div>
              <p className="text-lg font-bold text-emerald-500">{formatCost(weeklyCost)}</p>
            </div>
          </div>

          {/* This Month */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">This Month</p>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownToLine className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Input</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.inputTokensThisMonth.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUpFromLine className="w-3 h-3 text-violet-500" />
                <span className="text-xs text-muted-foreground">Output</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.outputTokensThisMonth.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Est. Cost</span>
              </div>
              <p className="text-lg font-bold text-emerald-500">{formatCost(monthlyCost)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Other Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Conversations', value: stats.totalConversations.toLocaleString(), icon: MessageSquare, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Total Messages', value: stats.totalMessages.toLocaleString(), icon: Users, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Active Sessions', value: stats.activeConversations.toString(), icon: Activity, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Open Tickets', value: stats.openTickets.toString(), icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium">{s.label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Usage Chart — Stacked Input/Output */}
      {stats.dailyUsage.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daily Token Usage (Last 30 Days)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Input + Output tokens per day</p>
            </div>
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
          <div className="flex items-end gap-1 h-40">
            {stats.dailyUsage.map((d: any, i: number) => {
              const height = Math.max((d.tokens / maxTokens) * 100, 2);
              const inputPct = d.tokens > 0 ? ((d.input_tokens ?? 0) / d.tokens) * 100 : 50;
              const date = new Date(d.day);
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                >
                  <div className="hidden group-hover:block absolute -top-14 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap z-10 shadow-lg">
                    <p className="font-semibold">{(d.input_tokens ?? 0).toLocaleString()} input</p>
                    <p className="font-semibold">{(d.output_tokens ?? 0).toLocaleString()} output</p>
                    <p className="text-emerald-500 font-semibold">{formatCost(estimateCost(d.input_tokens ?? 0, d.output_tokens ?? 0))}</p>
                    <p className="text-muted-foreground">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div
                    className="w-full rounded-t overflow-hidden transition-opacity opacity-80 hover:opacity-100 min-h-[2px]"
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
              {stats.dailyUsage.length > 0 && new Date((stats.dailyUsage[0] as any).day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {stats.dailyUsage.length > 0 && new Date((stats.dailyUsage[stats.dailyUsage.length - 1] as any).day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Merchant Details */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Merchant Details</h3>
          <div className="space-y-0 divide-y divide-[var(--glass-border)]">
            <DetailRow label="Merchant ID" value={merchant.id} mono />
            <DetailRow label="Shop Domain" value={merchant.shopDomain} icon={<Globe className="w-3.5 h-3.5" />} />
            <DetailRow label="Created" value={new Date(merchant.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} icon={<Clock className="w-3.5 h-3.5" />} />
            <DetailRow label="Clerk User ID" value={merchant.clerkUserId ?? 'Not linked'} mono />
            <DetailRow label="Stripe Customer" value={merchant.stripeCustomerId ?? 'None'} mono />
            <DetailRow label="Stripe Subscription" value={merchant.stripeSubscriptionId ?? 'None'} mono />
            <DetailRow label="DPA Accepted" value={merchant.dpaAcceptedAt ? new Date(merchant.dpaAcceptedAt).toLocaleDateString() : 'No'} />
            {merchant.frozenAt && (
              <DetailRow label="Frozen At" value={new Date(merchant.frozenAt).toLocaleDateString()} />
            )}
          </div>
        </div>

        {/* API Key + Recent Conversations */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-chart-5/10 flex items-center justify-center">
                <Key className="w-4.5 h-4.5 text-chart-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">API Key</h3>
                <p className="text-xs text-muted-foreground">Publishable widget key</p>
              </div>
            </div>
            <div className="rounded-xl bg-accent/20 border border-[var(--glass-border)] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Publishable Key</p>
                <p className="text-sm font-mono text-foreground mt-0.5 break-all">
                  {merchant.publishableApiKey}
                </p>
              </div>
              <button
                onClick={copyApiKey}
                className="flex items-center gap-1.5 text-xs text-red-500 font-semibold hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/5 flex-shrink-0 ml-3"
              >
                {copiedKey ? (
                  <><Check className="w-3.5 h-3.5" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy</>
                )}
              </button>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--glass-border)]">
              <h3 className="text-sm font-semibold text-foreground">Recent Conversations</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest 10 chatbot interactions</p>
            </div>
            {stats.recentConversations.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--glass-border)]">
                {stats.recentConversations.map((conv: any) => {
                  const convCost = estimateCost(conv.prompt_tokens ?? 0, conv.completion_tokens ?? 0);
                  return (
                    <div key={conv.id} className="flex items-center justify-between px-5 py-3 hover:bg-accent/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                          conv.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground',
                        )}>
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {conv.customer_id ? `Customer ${conv.customer_id.slice(0, 10)}` : `Guest ${conv.session_id.slice(0, 10)}...`}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {conv.total_turns} turns &middot;
                            <span className="text-blue-500"> {(conv.prompt_tokens ?? 0).toLocaleString()} in</span> /
                            <span className="text-violet-500"> {(conv.completion_tokens ?? 0).toLocaleString()} out</span>
                            {convCost > 0 && <span className="text-emerald-500"> &middot; {formatCost(convCost)}</span>}
                            &middot; {timeAgo(conv.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0',
                        conv.status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : conv.status === 'escalated' ? 'bg-amber-500/15 text-amber-500' : 'bg-muted text-muted-foreground',
                      )}>
                        {conv.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`text-sm text-foreground ${mono ? 'font-mono text-xs' : 'font-medium'} max-w-[60%] truncate text-right`}>
        {value}
      </span>
    </div>
  );
}
