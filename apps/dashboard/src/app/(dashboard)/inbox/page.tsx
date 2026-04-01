'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Clock,
  ChevronRight,
  Loader2,
  Filter,
  ArrowUpRight,
  Send,
  Paperclip,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  session_id: string;
  status: string;
  total_tokens_used: number;
  total_turns: number;
  created_at: string;
  updated_at: string;
}

const STATUS_FILTERS = ['all', 'active', 'resolved', 'escalated'];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" />;
    case 'escalated':
      return <AlertTriangle className="w-3 h-3 text-amber-500" />;
    case 'resolved':
      return <CheckCircle2 className="w-3 h-3 text-muted-foreground" />;
    default:
      return <Circle className="w-3 h-3 text-muted-foreground" />;
  }
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations?page=${page}&status=${status}`);
      const data = await res.json() as { conversations: Conversation[]; total: number };
      setConversations(data.conversations);
      setTotal(data.total);
      if (data.conversations.length > 0 && !selected) {
        setSelected(data.conversations[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const selectedConv = conversations.find((c) => c.id === selected);

  return (
    <div className="max-w-7xl -mt-2">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Inbox</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total conversations</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className="w-full md:w-[360px] border-r border-[var(--glass-border)] flex flex-col">
            {/* Search & filters */}
            <div className="p-3 border-b border-[var(--glass-border)] space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatus(s); setPage(1); }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all',
                      status === s
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation items */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-20 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">No conversations found</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--glass-border)]">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelected(conv.id)}
                      className={cn(
                        'w-full text-left px-4 py-3.5 transition-all',
                        selected === conv.id
                          ? 'bg-primary/5 border-l-2 border-l-primary'
                          : 'hover:bg-accent/20 border-l-2 border-l-transparent',
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <StatusIcon status={conv.status} />
                          <span className="text-sm font-medium text-foreground truncate">
                            {conv.session_id.slice(0, 14)}...
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                          {timeAgo(conv.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground ml-5">
                        <span>{conv.total_turns} turns</span>
                        <span>&middot;</span>
                        <span>{conv.total_tokens_used.toLocaleString()} tokens</span>
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

          {/* Conversation detail */}
          <div className="hidden md:flex flex-1 flex-col">
            {selectedConv ? (
              <>
                {/* Detail header */}
                <div className="px-6 py-4 border-b border-[var(--glass-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center',
                      selectedConv.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-muted text-muted-foreground',
                    )}>
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Session {selectedConv.session_id.slice(0, 14)}...</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          'text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize',
                          selectedConv.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : selectedConv.status === 'escalated'
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'bg-muted text-muted-foreground',
                        )}>
                          {selectedConv.status}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(selectedConv.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/30 transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Message area placeholder */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedConv.total_turns} turns &middot; {selectedConv.total_tokens_used.toLocaleString()} tokens
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Conversation messages will load here
                      </p>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Total Turns', value: selectedConv.total_turns },
                        { label: 'Tokens Used', value: selectedConv.total_tokens_used.toLocaleString() },
                        { label: 'Started', value: timeAgo(selectedConv.created_at) },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl bg-accent/20 border border-[var(--glass-border)] p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{stat.value}</p>
                          <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Select a conversation to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
