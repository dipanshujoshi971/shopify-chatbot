'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HeadphonesIcon,
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  MessageSquare,
  Loader2,
  X,
  Send,
  ChevronRight,
  ArrowUpRight,
  Ticket,
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

/* ─── Create Ticket Modal ─── */
function CreateTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !message) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          ticketType: 'merchant_to_admin',
          priority,
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">Create Support Ticket</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              required
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'py-2 rounded-xl text-xs font-medium capitalize transition-all border',
                    priority === p
                      ? priorityColors[p] + ' border-current/20'
                      : 'border-[var(--glass-border)] text-muted-foreground hover:bg-accent/30',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              placeholder="Describe your issue in detail..."
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !subject || !message}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}

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
  const [newStatus, setNewStatus] = useState(ticket.status);

  async function handleReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: { author: 'Merchant', message: reply },
          status: newStatus !== ticket.status ? newStatus : undefined,
        }),
      });
      setReply('');
      onUpdate();
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: string) {
    setNewStatus(status);
    await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onUpdate();
  }

  const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
  const st = statusConfig[ticket.status] ?? statusConfig.open;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">{ticket.id.slice(0, 12)}</span>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase', priorityColors[ticket.priority] ?? priorityColors.medium)}>
                {ticket.priority}
              </span>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', st.color, 'bg-current/10')}>
                {st.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">{ticket.subject}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
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

        {/* Reply + status bar */}
        <div className="px-6 py-4 border-t border-[var(--glass-border)] space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            {(['open', 'assigned', 'resolved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all',
                  ticket.status === s
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-accent/30',
                )}
              >
                {statusConfig[s]?.label ?? s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
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
export default function MerchantSupportPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), type: 'merchant_to_admin' });
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/tickets?${params}`);
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = search
    ? tickets.filter(
        (t) =>
          t.subject.toLowerCase().includes(search.toLowerCase()) ||
          t.customer_message.toLowerCase().includes(search.toLowerCase()),
      )
    : tickets;

  const counts = {
    open: tickets.filter((t) => t.status === 'open').length,
    assigned: tickets.filter((t) => t.status === 'assigned').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Merchant Support</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Raise and manage tickets to the platform admin
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', count: total, icon: Ticket, color: 'text-primary bg-primary/10' },
          { label: 'Open', count: counts.open, icon: Circle, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Assigned', count: counts.assigned, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'Resolved', count: counts.resolved, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
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

      {/* Search + filters */}
      <div className="glass-card p-3 mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
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
              {s === 'all' ? 'All' : statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets list */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <HeadphonesIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tickets found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create a ticket to get support from our team</p>
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {ticket.id.slice(0, 10)}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase',
                          priorityColors[ticket.priority] ?? priorityColors.medium,
                        )}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {ticket.customer_message}
                    </p>
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

      {showCreate && (
        <CreateTicketModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            load();
            // Refresh the selected ticket
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
