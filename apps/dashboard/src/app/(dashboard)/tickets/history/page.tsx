'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */
interface TicketData {
  id: string;
  subject: string;
  customer_email: string;
  customer_message: string;
  status: string;
  ticket_type: string;
  priority: string;
  replies: any[];
  created_at: string;
  updated_at: string;
}

const resolutionConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  resolved: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10', label: 'Resolved' },
  open: { icon: Clock, color: 'text-blue-500 bg-blue-500/10', label: 'Open' },
  assigned: { icon: Clock, color: 'text-amber-500 bg-amber-500/10', label: 'Assigned' },
};

export default function TicketHistoryPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'merchant_to_admin' | 'customer'>('all');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/tickets?${params}`);
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = search
    ? tickets.filter(
        (t) =>
          t.subject?.toLowerCase().includes(search.toLowerCase()) ||
          t.id.toLowerCase().includes(search.toLowerCase()) ||
          t.customer_email.toLowerCase().includes(search.toLowerCase()),
      )
    : tickets;

  const totalResolved = tickets.filter((t) => t.status === 'resolved').length;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  function exportCSV() {
    const header = 'ID,Subject,Type,Status,Priority,Email,Created,Updated\n';
    const rows = filtered
      .map(
        (t) =>
          `"${t.id}","${t.subject}","${t.ticket_type}","${t.status}","${t.priority}","${t.customer_email}","${t.created_at}","${t.updated_at}"`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Ticket History</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All tickets across your store</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Total Tickets</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{total}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalResolved}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total > 0 ? Math.round((totalResolved / total) * 100) : 0}% resolution rate
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-chart-2" />
            <span className="text-xs text-muted-foreground font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{total - totalResolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket ID, subject, or email..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {([
            { id: 'all' as const, label: 'All Types' },
            { id: 'customer' as const, label: 'Customer' },
            { id: 'merchant_to_admin' as const, label: 'Merchant' },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTypeFilter(t.id);
                setPage(1);
              }}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                typeFilter === t.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="hidden lg:grid grid-cols-[80px_1fr_100px_90px_90px_80px_100px] gap-4 px-5 py-3 border-b border-[var(--glass-border)] text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>ID</span>
          <span>Subject</span>
          <span>Type</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Replies</span>
          <span>Created</span>
        </div>
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <History className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--glass-border)]">
            {filtered.map((ticket) => {
              const res = resolutionConfig[ticket.status] ?? resolutionConfig.open;
              const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
              return (
                <div
                  key={ticket.id}
                  className="grid grid-cols-1 lg:grid-cols-[80px_1fr_100px_90px_90px_80px_100px] gap-2 lg:gap-4 px-5 py-4 hover:bg-accent/20 transition-all items-center"
                >
                  <span className="text-xs font-mono text-muted-foreground">{ticket.id.slice(0, 10)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {ticket.subject || ticket.customer_message.slice(0, 50)}
                    </p>
                    <p className="text-xs text-muted-foreground lg:hidden mt-0.5">
                      {ticket.ticket_type} &middot; {ticket.status} &middot; {ticket.priority}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'hidden lg:inline-flex text-[11px] px-2 py-0.5 rounded-full font-medium w-fit',
                      ticket.ticket_type === 'merchant_to_admin'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-amber-500/10 text-amber-500',
                    )}
                  >
                    {ticket.ticket_type === 'merchant_to_admin' ? 'Merchant' : 'Customer'}
                  </span>
                  <span className={cn('hidden lg:inline-flex text-[11px] px-2 py-0.5 rounded-full font-semibold w-fit', res.color)}>
                    {res.label}
                  </span>
                  <span
                    className={cn(
                      'hidden lg:inline-flex text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase w-fit',
                      ticket.priority === 'high'
                        ? 'bg-red-500/10 text-red-500'
                        : ticket.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-blue-500/10 text-blue-500',
                    )}
                  >
                    {ticket.priority}
                  </span>
                  <span className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3" />
                    {replies.length}
                  </span>
                  <span className="hidden lg:block text-xs text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[var(--glass-border)] flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
