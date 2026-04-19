'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Store,
  Search,
  Zap,
  MessageSquare,
  Crown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { estimateCost, formatCost } from '@/lib/token-cost';
import { SHOW_BILLING } from '@/lib/flags';

interface MerchantRow {
  id: string;
  shopDomain: string;
  status: string;
  planId: string;
  clerkUserId: string | null;
  createdAt: string;
  frozenAt: string | null;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalConversations: number;
  tokensThisWeek: number;
  inputTokensThisWeek: number;
  outputTokensThisWeek: number;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-500',
  frozen: 'bg-red-500/15 text-red-500',
};

const PLAN_STYLES: Record<string, string> = {
  starter: 'bg-blue-500/15 text-blue-500',
  growth: 'bg-emerald-500/15 text-emerald-500',
  pro: 'bg-violet-500/15 text-violet-500',
  enterprise: 'bg-amber-500/15 text-amber-500',
};

export default function AdminMerchantsPage() {
  const searchParams = useSearchParams();
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/admin/merchants?${params}`);
      const data = await res.json();
      setMerchants(data.merchants ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch {
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Merchants</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage all {total} merchants on the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by domain or merchant ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm text-foreground placeholder:text-muted-foreground border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-transparent"
          />
        </div>
        <div className="flex gap-2">
          {['', 'active', 'frozen'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border',
                statusFilter === s
                  ? 'border-red-500/30 bg-red-500/10 text-red-500'
                  : 'border-[var(--glass-border)] text-muted-foreground hover:text-foreground hover:bg-accent/30',
              )}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
        </div>
      ) : merchants.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No merchants found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Store</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                  {SHOW_BILLING && <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Plan</th>}
                  <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="flex items-center justify-end gap-1">
                      <ArrowDownToLine className="w-3 h-3" />Input
                    </span>
                  </th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="flex items-center justify-end gap-1">
                      <ArrowUpFromLine className="w-3 h-3" />Output
                    </span>
                  </th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    <span className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3" />Est. Cost
                    </span>
                  </th>
                  <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Conversations</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {merchants.map((m) => {
                  const cost = estimateCost(m.totalInputTokens, m.totalOutputTokens);
                  return (
                    <tr key={m.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Store className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{m.shopDomain}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{m.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize', STATUS_STYLES[m.status] ?? 'bg-muted text-muted-foreground')}>
                          {m.status}
                        </span>
                      </td>
                      {SHOW_BILLING && (
                      <td className="px-5 py-3.5">
                        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize flex items-center gap-1 w-fit', PLAN_STYLES[m.planId] ?? 'bg-muted text-muted-foreground')}>
                          <Crown className="w-3 h-3" />
                          {m.planId}
                        </span>
                      </td>
                      )}
                      <td className="px-5 py-3.5 text-right">
                        <div>
                          <span className="text-sm font-semibold text-blue-500">{m.totalInputTokens.toLocaleString()}</span>
                          <p className="text-[10px] text-muted-foreground">{m.inputTokensThisWeek.toLocaleString()} /wk</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div>
                          <span className="text-sm font-semibold text-violet-500">{m.totalOutputTokens.toLocaleString()}</span>
                          <p className="text-[10px] text-muted-foreground">{m.outputTokensThisWeek.toLocaleString()} /wk</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-500" />
                          <span className="text-sm font-semibold text-foreground">{formatCost(cost)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-sm text-foreground">{m.totalConversations.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/merchants/${m.id}`}
                          className="text-xs text-red-500 font-semibold hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          Details
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--glass-border)]">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({total} merchants)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--glass-border)] text-muted-foreground hover:text-foreground hover:bg-accent/30 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--glass-border)] text-muted-foreground hover:text-foreground hover:bg-accent/30 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
