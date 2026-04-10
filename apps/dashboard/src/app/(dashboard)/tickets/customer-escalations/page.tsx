'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Search,
  Clock,
  User,
  Loader2,
  Flame,
  Timer,
  CheckCircle2,
  ShieldAlert,
  MessageSquare,
  X,
  Send,
  ExternalLink,
  Circle,
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
  conversation_id: string | null;
  replies: any[];
  assignee: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  open: { label: 'New', color: 'bg-blue-500/15 text-blue-500' },
  assigned: { label: 'Reviewing', color: 'bg-amber-500/15 text-amber-500' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500/15 text-emerald-500' },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  low: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10' },
  high: { color: 'text-red-500', bg: 'bg-red-500/10' },
};

/* ─── Ticket Detail Modal ─── */
function EscalationDetail({
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
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (ticket.conversation_id) {
      fetch(`/api/conversations/${ticket.conversation_id}`)
        .then((r) => r.json())
        .then((data) => setMessages(data.messages ?? []))
        .catch(() => {});
    }
  }, [ticket.conversation_id]);

  async function handleReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: { author: 'Merchant', message: reply },
        }),
      });
      setReply('');
      onUpdate();
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: string) {
    await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onUpdate();
  }

  const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
  const stat = statusLabels[ticket.status] ?? statusLabels.open;
  const prio = priorityConfig[ticket.priority] ?? priorityConfig.medium;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', prio.bg)}>
                <AlertTriangle className={cn('w-4 h-4', prio.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{ticket.id.slice(0, 12)}</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase', prio.bg, prio.color)}>
                    {ticket.priority}
                  </span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', stat.color)}>
                    {stat.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground mt-1">{ticket.subject || 'Customer Escalation'}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {ticket.customer_email}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(ticket.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Customer message */}
          <div className="rounded-xl bg-accent/20 border border-[var(--glass-border)] p-4">
            <p className="text-xs font-semibold text-foreground mb-2">Customer Message</p>
            <p className="text-sm text-foreground leading-relaxed">{ticket.customer_message}</p>
          </div>

          {/* Linked conversation preview */}
          {messages.length > 0 && (
            <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden">
              <div className="px-4 py-2.5 bg-accent/10 border-b border-[var(--glass-border)] flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Chat History</span>
                <span className="text-[10px] text-muted-foreground">{messages.length} messages</span>
              </div>
              <div className="p-4 max-h-[200px] overflow-y-auto space-y-2">
                {messages.slice(-6).map((msg: any) => {
                  let text = msg.content;
                  try {
                    const parsed = JSON.parse(msg.content);
                    text = parsed.text ?? parsed;
                  } catch {}
                  if (msg.role === 'tool' || !text) return null;
                  return (
                    <div key={msg.id} className={cn('text-xs', msg.role === 'user' ? 'text-chart-2' : 'text-muted-foreground')}>
                      <span className="font-semibold">{msg.role === 'user' ? 'Customer' : 'Bot'}:</span>{' '}
                      {typeof text === 'string' ? text.slice(0, 200) : ''}
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
                r.author === 'Merchant'
                  ? 'bg-primary/5 border-primary/20 ml-8'
                  : 'bg-accent/20 border-[var(--glass-border)] mr-8',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">{r.author}</span>
                <span className="text-[10px] text-muted-foreground">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{r.message}</p>
            </div>
          ))}
        </div>

        {/* Reply + status */}
        <div className="px-6 py-4 border-t border-[var(--glass-border)] space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mark as:</span>
            {(['open', 'assigned', 'resolved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
                  ticket.status === s
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-accent/30',
                )}
              >
                {statusLabels[s]?.label ?? s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to customer..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
              className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleReply}
              disabled={sending || !reply.trim()}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-50"
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
export default function CustomerEscalationsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'customer' });
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/tickets?${params}`);
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = search
    ? tickets.filter(
        (t) =>
          t.customer_email.toLowerCase().includes(search.toLowerCase()) ||
          t.customer_message.toLowerCase().includes(search.toLowerCase()) ||
          (t.subject && t.subject.toLowerCase().includes(search.toLowerCase())),
      )
    : tickets;

  const urgentCount = tickets.filter((t) => t.priority === 'high' && t.status !== 'resolved').length;
  const unresolvedCount = tickets.filter((t) => t.status !== 'resolved').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Customer Escalations</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Conversations escalated by the AI that need human attention
        </p>
      </div>

      {/* Alert banner */}
      {urgentCount > 0 && (
        <div className="glass-card p-4 mb-6 border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {urgentCount} high-priority escalation{urgentCount > 1 ? 's' : ''} need attention
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                High priority issues should be addressed promptly
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-muted-foreground font-medium">Unresolved</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{unresolvedCount}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{total}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{resolvedCount}</p>
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
            placeholder="Search by customer or issue..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'open', 'assigned', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all',
                filter === s
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30',
              )}
            >
              {s === 'all' ? 'All' : statusLabels[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Escalations list */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card py-16 text-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card py-16 text-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No escalations found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Escalations appear here when the AI can&apos;t resolve customer issues
            </p>
          </div>
        ) : (
          filtered.map((ticket) => {
            const prio = priorityConfig[ticket.priority] ?? priorityConfig.medium;
            const stat = statusLabels[ticket.status] ?? statusLabels.open;
            const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
            return (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="w-full text-left glass-card p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', prio.bg)}>
                      <AlertTriangle className={cn('w-5 h-5', prio.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{ticket.id.slice(0, 10)}</span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase', prio.bg, prio.color)}>
                          {ticket.priority}
                        </span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', stat.color)}>
                          {stat.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {ticket.subject || 'Customer Escalation'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {ticket.customer_message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <MessageSquare className="w-3 h-3" />
                    {replies.length}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-foreground font-medium">{ticket.customer_email}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedTicket && (
        <EscalationDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            load();
            fetch(`/api/tickets/${selectedTicket.id}`)
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
