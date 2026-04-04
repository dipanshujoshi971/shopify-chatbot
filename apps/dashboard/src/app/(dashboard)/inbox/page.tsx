'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Clock,
  Loader2,
  Send,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Ticket,
  X,
  Mail,
  Hash,
  ArrowUpRight,
  ChevronLeft,
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

function parseMessageContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'string') return parsed;
    if (parsed.text) return parsed.text;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item.text) return item.text;
          if (item.type === 'tool-call') return `[Tool: ${item.toolName}]`;
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }
    return JSON.stringify(parsed);
  } catch {
    return content;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Circle className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500" />;
    case 'escalated':
      return <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />;
    case 'resolved':
      return <CheckCircle2 className="w-2.5 h-2.5 text-muted-foreground" />;
    default:
      return <Circle className="w-2.5 h-2.5 text-muted-foreground" />;
  }
}

/* ─── Ticket Modal ─── */
function TicketModal({
  conversationId,
  onClose,
}: {
  conversationId: string;
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
              <h3 className="text-sm font-semibold text-foreground">Raise Ticket to Admin</h3>
              <p className="text-xs text-muted-foreground">Report an issue with this conversation</p>
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
                placeholder="What went wrong with this conversation? What should be improved?"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-accent/20 rounded-lg px-3 py-2">
              <Hash className="w-3 h-3 flex-shrink-0" />
              <span>Conversation ID: {conversationId.slice(0, 16)}...</span>
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
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations?page=${page}&status=${status}`);
      const data = (await res.json()) as { conversations: Conversation[]; total: number };
      setConversations(data.conversations);
      setTotal(data.total);
      if (data.conversations.length > 0 && !selected) {
        setSelected(data.conversations[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selected) return;
    setLoadingMessages(true);
    fetch(`/api/conversations/${selected}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages ?? []);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selected]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const selectedConv = conversations.find((c) => c.id === selected);

  // Filter by search
  const filtered = search
    ? conversations.filter(
        (c) =>
          c.session_id.toLowerCase().includes(search.toLowerCase()) ||
          c.customer_id?.toLowerCase().includes(search.toLowerCase()),
      )
    : conversations;

  return (
    <div className="max-w-7xl -mt-2">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Inbox</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total conversations</p>
        </div>
        {selectedConv && (
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
          {/* ─ Conversation list ─ */}
          <div
            className={cn(
              'w-full md:w-[360px] border-r border-[var(--glass-border)] flex flex-col',
              mobileShowDetail && 'hidden md:flex',
            )}
          >
            {/* Search & filters */}
            <div className="p-3 border-b border-[var(--glass-border)] space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by session or customer..."
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Conversation items */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">No conversations found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Install the widget to start receiving chats
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--glass-border)]">
                  {filtered.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelected(conv.id);
                        setMobileShowDetail(true);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-3.5 transition-all',
                        selected === conv.id
                          ? 'bg-primary/5 border-l-2 border-l-primary'
                          : 'hover:bg-accent/20 border-l-2 border-l-transparent',
                      )}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <StatusIcon status={conv.status} />
                          <span className="text-sm font-medium text-foreground truncate">
                            {conv.customer_id
                              ? `Customer ${conv.customer_id.slice(0, 10)}`
                              : `Guest ${conv.session_id.slice(0, 10)}...`}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                          {timeAgo(conv.created_at)}
                        </span>
                      </div>
                      {conv.customer_id && (
                        <div className="flex items-center gap-1.5 ml-[18px] mb-1">
                          <Mail className="w-3 h-3 text-muted-foreground/50" />
                          <span className="text-[10px] text-muted-foreground truncate">
                            ID: {conv.customer_id}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground ml-[18px]">
                        <span>{conv.total_turns} turns</span>
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
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  {page}/{totalPages}
                </span>
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

          {/* ─ Conversation detail ─ */}
          <div
            className={cn(
              'flex-1 flex-col',
              mobileShowDetail ? 'flex' : 'hidden md:flex',
            )}
          >
            {selectedConv ? (
              <>
                {/* Detail header */}
                <div className="px-4 md:px-6 py-4 border-b border-[var(--glass-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Mobile back button */}
                    <button
                      onClick={() => setMobileShowDetail(false)}
                      className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center',
                        selectedConv.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedConv.customer_id
                          ? `Customer ${selectedConv.customer_id.slice(0, 12)}`
                          : `Guest ${selectedConv.session_id.slice(0, 12)}...`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className={cn(
                            'text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize',
                            selectedConv.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : selectedConv.status === 'escalated'
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {selectedConv.status}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(selectedConv.created_at)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {selectedConv.total_turns} turns
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTicketModal(true)}
                      className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/30"
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
                        <p className="text-sm text-muted-foreground">No messages in this conversation</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Messages will appear here when customers chat
                        </p>
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
                          const isAssistant = msg.role === 'assistant';
                          const isTool = msg.role === 'tool';
                          const text = parseMessageContent(msg.content);

                          if (isTool || !text) return null;

                          return (
                            <div
                              key={msg.id}
                              className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
                            >
                              {isAssistant && (
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
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
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

                {/* Stats bar at bottom */}
                <div className="px-4 md:px-6 py-3 border-t border-[var(--glass-border)] bg-accent/10">
                  <div className="flex items-center justify-between text-xs text-muted-foreground max-w-2xl mx-auto">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" />
                        {messages.length} messages
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3" />
                        {selectedConv.total_turns} turns
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Started {timeAgo(selectedConv.created_at)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Select a conversation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pick a chat from the list to view the full history
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selected && (
        <TicketModal
          conversationId={selected}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </div>
  );
}
