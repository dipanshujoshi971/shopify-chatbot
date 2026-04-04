'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  HeadphonesIcon,
  Search,
  Clock,
  CheckCircle2,
  Circle,
  MessageSquare,
  Loader2,
  X,
  Send,
  Store,
  Ticket,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketData {
  id: string;
  subject: string;
  customer_email: string;
  customer_message: string;
  status: string;
  ticket_type: string;
  priority: string;
  conversation_id: string | null;
  replies: any[];
  assignee: string | null;
  created_at: string;
  updated_at: string;
  merchantId: string;
  shopDomain: string;
}

const statusConfig: Record<string, { icon: typeof Circle; color: string; label: string }> = {
  open: { icon: Circle, color: 'text-blue-500', label: 'Open' },
  assigned: { icon: Clock, color: 'text-amber-500', label: 'Assigned' },
  resolved: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Resolved' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-500',
  medium: 'bg-amber-500/10 text-amber-500',
  high: 'bg-red-500/10 text-red-500',
};

const typeLabels: Record<string, string> = {
  customer: 'Customer Escalation',
  merchant_to_admin: 'Merchant Support',
};

/* ─── Ticket Detail Modal ─── */
function TicketDetailModal({
  ticket,
  onClose,
  onUpdate,
}: {
  ticket: TicketData;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Load full ticket details + chat history
  useEffect(() => {
    setLoadingChat(true);
    fetch(`/api/admin/tickets/${ticket.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setChatMessages(data.messages);
      })
      .catch(() => {})
      .finally(() => setLoadingChat(false));
  }, [ticket.id]);

  async function handleReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: { message: reply } }),
      });
      setReply('');
      onUpdate();
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: string) {
    await fetch(`/api/admin/tickets/${ticket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onUpdate();
  }

  async function handlePriorityChange(priority: string) {
    await fetch(`/api/admin/tickets/${ticket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    });
    onUpdate();
  }

  const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
  const st = statusConfig[ticket.status] ?? statusConfig.open;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">{ticket.id.slice(0, 12)}</span>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase', priorityColors[ticket.priority] ?? priorityColors.medium)}>
                  {ticket.priority}
                </span>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', st.color, 'bg-current/10')}>
                  {st.label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-violet-500/10 text-violet-500">
                  {typeLabels[ticket.ticket_type] ?? ticket.ticket_type}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{ticket.subject || 'No Subject'}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Store className="w-3 h-3 text-muted-foreground" />
                <Link
                  href={`/admin/merchants/${ticket.merchantId}`}
                  className="text-[11px] text-red-500 hover:text-red-400 font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {ticket.shopDomain}
                </Link>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Original message */}
          <div className="rounded-xl bg-accent/20 border border-[var(--glass-border)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Original Message</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{ticket.customer_message}</p>
            <p className="text-[11px] text-muted-foreground mt-2">From: {ticket.customer_email}</p>
          </div>

          {/* Chat history if linked */}
          {ticket.conversation_id && chatMessages.length > 0 && (
            <div className="rounded-xl border border-[var(--glass-border)] p-4">
              <h4 className="text-xs font-semibold text-foreground mb-3">Linked Chat History</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {chatMessages.map((msg: any) => {
                  let content = msg.content;
                  try {
                    const parsed = JSON.parse(msg.content);
                    content = parsed.text ?? parsed.content ?? msg.content;
                  } catch { /* raw string */ }
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'px-3 py-2 rounded-lg text-xs',
                        msg.role === 'user'
                          ? 'bg-blue-500/10 text-foreground ml-8'
                          : 'bg-accent/30 text-foreground mr-8',
                      )}
                    >
                      <span className="font-semibold text-[10px] text-muted-foreground uppercase">
                        {msg.role}
                      </span>
                      <p className="mt-0.5 leading-relaxed">{content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Replies */}
          {replies.map((r: any, i: number) => (
            <div
              key={r.id ?? i}
              className={cn(
                'rounded-xl p-4 border',
                r.author === 'Super Admin'
                  ? 'bg-red-500/5 border-red-500/20 ml-8'
                  : r.author === 'Merchant'
                    ? 'bg-primary/5 border-primary/20 ml-4'
                    : 'bg-accent/20 border-[var(--glass-border)] mr-8',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-xs font-semibold', r.author === 'Super Admin' ? 'text-red-500' : 'text-foreground')}>
                  {r.author}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t border-[var(--glass-border)] space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Status:</span>
              {(['open', 'assigned', 'resolved'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all',
                    ticket.status === s
                      ? 'bg-red-500/15 text-red-500'
                      : 'text-muted-foreground hover:bg-accent/30',
                  )}
                >
                  {statusConfig[s]?.label ?? s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Priority:</span>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriorityChange(p)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all',
                    ticket.priority === p
                      ? priorityColors[p]
                      : 'text-muted-foreground hover:bg-accent/30',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply as Super Admin..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
              className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
            <button
              onClick={handleReply}
              disabled={sending || !reply.trim()}
              className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);

    try {
      const res = await fetch(`/api/admin/tickets?${params}`);
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = search
    ? tickets.filter(
        (t) =>
          t.subject.toLowerCase().includes(search.toLowerCase()) ||
          t.customer_message.toLowerCase().includes(search.toLowerCase()) ||
          t.shopDomain.toLowerCase().includes(search.toLowerCase()),
      )
    : tickets;

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    assigned: tickets.filter((t) => t.status === 'assigned').length,
    high: tickets.filter((t) => t.priority === 'high' && t.status !== 'resolved').length,
  };

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Support Tickets</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage tickets from all merchants across the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: counts.total, icon: Ticket, color: 'text-red-500 bg-red-500/10' },
          { label: 'Open', count: counts.open, icon: Circle, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Assigned', count: counts.assigned, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'High Priority', count: counts.high, icon: HeadphonesIcon, color: 'text-red-500 bg-red-500/10' },
        ].map((item) => (
          <div key={item.label} className="glass-card p-4">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', item.color)}>
              <item.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">{item.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tickets, merchants..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm text-foreground placeholder:text-muted-foreground border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Status filters */}
          {[
            { value: '', label: 'All' },
            { value: 'open', label: 'Open' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'resolved', label: 'Resolved' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-semibold transition-all border',
                statusFilter === s.value
                  ? 'border-red-500/30 bg-red-500/10 text-red-500'
                  : 'border-[var(--glass-border)] text-muted-foreground hover:text-foreground hover:bg-accent/30',
              )}
            >
              {s.label}
            </button>
          ))}
          <div className="w-px bg-border self-stretch" />
          {/* Type filters */}
          {[
            { value: '', label: 'All Types' },
            { value: 'customer', label: 'Customer' },
            { value: 'merchant_to_admin', label: 'Merchant' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setTypeFilter(s.value)}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-semibold transition-all border',
                typeFilter === s.value
                  ? 'border-violet-500/30 bg-violet-500/10 text-violet-500'
                  : 'border-[var(--glass-border)] text-muted-foreground hover:text-foreground hover:bg-accent/30',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets list */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <HeadphonesIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--glass-border)]">
            {filtered.map((ticket) => {
              const st = statusConfig[ticket.status] ?? statusConfig.open;
              const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full text-left px-5 py-4 hover:bg-accent/20 transition-all flex items-center gap-4"
                >
                  <st.icon className={cn('w-5 h-5 flex-shrink-0', st.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">
                        {ticket.id.slice(0, 10)}
                      </span>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase', priorityColors[ticket.priority])}>
                        {ticket.priority}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-violet-500/10 text-violet-500">
                        {typeLabels[ticket.ticket_type] ?? ticket.ticket_type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{ticket.subject || 'No Subject'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Store className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{ticket.shopDomain}</span>
                      <span className="text-[11px] text-muted-foreground">&middot;</span>
                      <span className="text-[11px] text-muted-foreground truncate">{ticket.customer_message.slice(0, 80)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />
                      {replies.length}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            load();
            fetch(`/api/admin/tickets/${selectedTicket.id}`)
              .then((r) => r.json())
              .then((data) => {
                if (data.ticket) setSelectedTicket(data.ticket);
              });
          }}
        />
      )}
    </div>
  );
}
