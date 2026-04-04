'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Clock,
  Loader2,
  Ticket,
  X,
  Hash,
  ChevronLeft,
  CheckCircle2,
  Calendar,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */
interface Conversation {
  id: string;
  session_id: string;
  customer_id: string | null;
  status: string;
  total_tokens_used: number;
  total_turns: number;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

/** A customer group (guest or logged-in) with all their sessions */
interface CustomerGroup {
  customer: string;
  isGuest: boolean;
  sessions: Conversation[];
  totalTurns: number;
  latestTime: string;
}

/* ─── Helpers ─── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getDateKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function parseMessageContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'string') return parsed;
    if (parsed.type === 'text' && typeof parsed.text === 'string') return parsed.text;
    if (parsed.text && typeof parsed.text === 'string') return parsed.text;
    if (Array.isArray(parsed)) {
      const parts = parsed
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item.type === 'text' && item.text) return item.text;
          if (item.text) return item.text;
          if (item.type === 'tool-call') return `[Tool: ${item.toolName}]`;
          if (item.type === 'tool-result') return `[Result: ${item.toolName}]`;
          return '';
        })
        .filter(Boolean);
      return parts.join('\n');
    }
    if (parsed.type === 'tool-call' || parsed.type === 'tool_call') return `[Tool: ${parsed.toolName ?? 'unknown'}]`;
    if (parsed.type === 'tool-result' || parsed.type === 'tool_result') return '';
    return JSON.stringify(parsed);
  } catch {
    return content;
  }
}

/* ─── Ticket Modal ─── */
function TicketModal({
  conversationId,
  sessionLabel,
  onClose,
}: {
  conversationId: string;
  sessionLabel: string;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
          conversationId,
          ticketType: 'merchant_to_admin',
          priority,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Ticket className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Raise Ticket</h3>
              <p className="text-xs text-muted-foreground">Report issue — {sessionLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Ticket Created!</p>
            <p className="text-xs text-muted-foreground mt-1">Our team will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of the issue..."
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
                        ? p === 'high'
                          ? 'border-red-500/30 bg-red-500/10 text-red-500'
                          : p === 'medium'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                            : 'border-blue-500/30 bg-blue-500/10 text-blue-500'
                        : 'border-[var(--glass-border)] text-muted-foreground hover:bg-accent/30',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Describe the issue</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                placeholder="What went wrong with this conversation?"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !subject || !message}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selection state
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedSessionDate, setSelectedSessionDate] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Ticket
  const [showTicketModal, setShowTicketModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load conversations ──
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations?page=${page}&limit=100`);
      const data = (await res.json()) as { conversations: Conversation[]; total: number };
      setConversations(data.conversations);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  // ── Group conversations by customer ──
  const customerGroups: CustomerGroup[] = useMemo(() => {
    const grouped: Record<string, CustomerGroup> = {};

    // All non-customer conversations go under "Guest"
    const GUEST_KEY = '__guest__';

    for (const conv of conversations) {
      const key = conv.customer_id || GUEST_KEY;
      if (!grouped[key]) {
        grouped[key] = {
          customer: conv.customer_id || 'Guest',
          isGuest: !conv.customer_id,
          sessions: [],
          totalTurns: 0,
          latestTime: conv.created_at,
        };
      }
      grouped[key].sessions.push(conv);
      grouped[key].totalTurns += conv.total_turns;
      if (new Date(conv.created_at) > new Date(grouped[key].latestTime)) {
        grouped[key].latestTime = conv.created_at;
      }
    }

    // Sort sessions within each group by time desc
    for (const g of Object.values(grouped)) {
      g.sessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return Object.values(grouped).sort(
      (a, b) => new Date(b.latestTime).getTime() - new Date(a.latestTime).getTime(),
    );
  }, [conversations]);

  // ── Filter by search ──
  const filteredGroups = useMemo(() => {
    if (!search) return customerGroups;
    const q = search.toLowerCase();
    return customerGroups.filter((g) =>
      g.customer.toLowerCase().includes(q) ||
      g.sessions.some((s) => s.session_id.toLowerCase().includes(q)),
    );
  }, [customerGroups, search]);

  // ── Selected customer's sessions ──
  const selectedGroup = useMemo(
    () => customerGroups.find((g) => g.customer === selectedCustomer) ?? null,
    [customerGroups, selectedCustomer],
  );

  // ── Date options for selected customer's sessions ──
  const dateOptions = useMemo(() => {
    if (!selectedGroup) return [];
    const dateMap = new Map<string, string>();
    for (const s of selectedGroup.sessions) {
      const key = getDateKey(s.created_at);
      if (!dateMap.has(key)) dateMap.set(key, s.created_at);
    }
    return Array.from(dateMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, ts]) => ({ key, label: formatDateLabel(ts) }));
  }, [selectedGroup]);

  // ── Sessions for the selected date ──
  const sessionsForDate = useMemo(() => {
    if (!selectedGroup || !selectedSessionDate) return [];
    return selectedGroup.sessions.filter(
      (s) => getDateKey(s.created_at) === selectedSessionDate,
    );
  }, [selectedGroup, selectedSessionDate]);

  // ── Load messages when conversation selected ──
  useEffect(() => {
    if (!selectedConvId) return;
    setLoadingMessages(true);
    fetch(`/api/conversations/${selectedConvId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selectedConvId]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Handlers ──
  const handleSelectCustomer = useCallback((group: CustomerGroup) => {
    setSelectedCustomer(group.customer);
    setMobileShowDetail(true);

    // Auto-select latest date + session
    const latest = group.sessions[0];
    if (latest) {
      const dateKey = getDateKey(latest.created_at);
      setSelectedSessionDate(dateKey);
      setSelectedConvId(latest.id);
    } else {
      setSelectedSessionDate('');
      setSelectedConvId(null);
      setMessages([]);
    }
  }, []);

  const handleDateChange = useCallback((dateKey: string) => {
    setSelectedSessionDate(dateKey);
    if (!selectedGroup) return;
    const sessionsOnDate = selectedGroup.sessions.filter(
      (s) => getDateKey(s.created_at) === dateKey,
    );
    if (sessionsOnDate.length > 0) {
      setSelectedConvId(sessionsOnDate[0].id);
    } else {
      setSelectedConvId(null);
      setMessages([]);
    }
  }, [selectedGroup]);

  const handleBack = useCallback(() => {
    setSelectedCustomer(null);
    setSelectedConvId(null);
    setSelectedSessionDate('');
    setMessages([]);
    setMobileShowDetail(false);
  }, []);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const totalPages = Math.max(1, Math.ceil(total / 100));

  return (
    <div className="max-w-7xl -mt-2">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Inbox</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} conversations &middot; {customerGroups.length} customers
            </p>
          </div>
        </div>
        {selectedConvId && (
          <button
            onClick={() => setShowTicketModal(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Ticket className="w-4 h-4" />
            Raise Ticket
          </button>
        )}
      </div>

      <div
        className="glass-card overflow-hidden"
        style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
      >
        <div className="flex h-full">
          {/* ─ Customer list (left panel) ─ */}
          <div
            className={cn(
              'w-full md:w-[320px] lg:w-[360px] border-r border-[var(--glass-border)] flex flex-col flex-shrink-0',
              mobileShowDetail && 'hidden md:flex',
            )}
          >
            {/* Search */}
            <div className="p-3 border-b border-[var(--glass-border)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers or session ID..."
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Customer items */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="py-20 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">No conversations found</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--glass-border)]">
                  {filteredGroups.map((group) => (
                    <button
                      key={group.customer}
                      onClick={() => handleSelectCustomer(group)}
                      className={cn(
                        'w-full text-left px-4 py-3.5 transition-all flex items-center gap-3',
                        selectedCustomer === group.customer
                          ? 'bg-primary/5 border-l-2 border-l-primary'
                          : 'hover:bg-accent/20 border-l-2 border-l-transparent',
                      )}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {group.isGuest ? (
                          <Users className="w-4.5 h-4.5 text-primary" />
                        ) : (
                          <span className="text-sm font-bold text-primary">
                            {group.customer.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {group.isGuest ? 'Guest Chats' : group.customer}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                            {timeAgo(group.latestTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}</span>
                          <span>{group.totalTurns} turns</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* ─ Chat detail (right panel) ─ */}
          <div
            className={cn(
              'flex-1 flex-col min-w-0',
              mobileShowDetail ? 'flex' : 'hidden md:flex',
            )}
          >
            {selectedCustomer && selectedGroup ? (
              <>
                {/* Header with date/time selectors */}
                <div className="px-4 md:px-6 py-3 border-b border-[var(--glass-border)] flex items-center justify-between gap-3 flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile back */}
                    <button
                      onClick={handleBack}
                      className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {selectedGroup.isGuest ? 'Guest Chat' : selectedGroup.customer}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {messages.filter((m) => m.role !== 'tool').length} messages
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Date selector */}
                    <div className="flex items-center gap-1.5 bg-accent/30 rounded-lg px-2.5 py-1.5 border border-[var(--glass-border)]">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <select
                        value={selectedSessionDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="bg-transparent text-xs font-medium text-foreground border-none outline-none cursor-pointer"
                      >
                        {dateOptions.length === 0 && <option value="">No dates</option>}
                        {dateOptions.map((d) => (
                          <option key={d.key} value={d.key}>{d.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Time/session selector */}
                    <div className="flex items-center gap-1.5 bg-accent/30 rounded-lg px-2.5 py-1.5 border border-[var(--glass-border)]">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <select
                        value={selectedConvId ?? ''}
                        onChange={(e) => setSelectedConvId(e.target.value)}
                        disabled={sessionsForDate.length === 0}
                        className="bg-transparent text-xs font-medium text-foreground border-none outline-none cursor-pointer disabled:opacity-50"
                      >
                        {sessionsForDate.length === 0 ? (
                          <option value="">No sessions</option>
                        ) : (
                          sessionsForDate.map((s, i) => (
                            <option key={s.id} value={s.id}>
                              {formatTimeLabel(s.created_at)}{i === 0 ? ' (latest)' : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Ticket button */}
                    <button
                      onClick={() => setShowTicketModal(true)}
                      disabled={!selectedConvId}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/30 disabled:opacity-30"
                      title="Raise Ticket"
                    >
                      <Ticket className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  <div className="max-w-2xl mx-auto space-y-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">No messages in this session</p>
                      </div>
                    ) : (
                      <>
                        {/* Date header */}
                        <div className="flex items-center gap-3 py-2">
                          <div className="flex-1 h-px bg-[var(--glass-border)]" />
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(messages[0].created_at).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <div className="flex-1 h-px bg-[var(--glass-border)]" />
                        </div>

                        {messages.map((msg) => {
                          const isUser = msg.role === 'user';
                          const isTool = msg.role === 'tool';
                          const text = parseMessageContent(msg.content);

                          if (isTool || !text) return null;

                          return (
                            <div
                              key={msg.id}
                              className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
                            >
                              {!isUser && (
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                  <Bot className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <div
                                className={cn(
                                  'max-w-[75%] rounded-2xl px-4 py-3',
                                  isUser
                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                    : 'bg-accent/40 border border-[var(--glass-border)] text-foreground rounded-bl-md',
                                )}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
                                <p
                                  className={cn(
                                    'text-[10px] mt-1.5',
                                    isUser ? 'text-primary-foreground/60' : 'text-muted-foreground',
                                  )}
                                >
                                  {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                              {isUser && (
                                <div className="w-8 h-8 rounded-xl bg-chart-2/10 flex items-center justify-center flex-shrink-0 mt-1">
                                  <User className="w-4 h-4 text-chart-2" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                </div>

                {/* Footer stats */}
                {selectedConv && (
                  <div className="px-4 md:px-6 py-3 border-t border-[var(--glass-border)] bg-accent/10 flex-shrink-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground max-w-2xl mx-auto">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3" />
                          {messages.filter((m) => m.role !== 'tool').length} messages
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3 h-3" />
                          {selectedConv.session_id.slice(0, 8)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {formatDateLabel(selectedConv.created_at)} {formatTimeLabel(selectedConv.created_at)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Select a customer</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose a customer from the list to view their chat sessions
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedConvId && (
        <TicketModal
          conversationId={selectedConvId}
          sessionLabel={selectedGroup?.isGuest ? 'Guest Chat' : selectedGroup?.customer ?? ''}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </div>
  );
}
