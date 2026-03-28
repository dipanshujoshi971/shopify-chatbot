'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare, ChevronRight, Loader2 } from 'lucide-react';

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
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/conversations?page=${page}&status=${status}`);
      const data = await res.json() as { conversations: Conversation[]; total: number };
      setConversations(data.conversations);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              status === s
                ? 'bg-emerald-500 text-white'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
            ].join(' ')}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-400">{total} total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No conversations found</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 border-b border-zinc-100 text-xs font-medium text-zinc-400 uppercase tracking-wide">
              <span>Session</span>
              <span>Status</span>
              <span>Turns</span>
              <span>Tokens</span>
              <span>Created</span>
              <span />
            </div>

            <div className="divide-y divide-zinc-50">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-2 sm:gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-zinc-900 truncate">
                      {conv.session_id.slice(0, 20)}…
                    </p>
                    <p className="text-xs text-zinc-400 sm:hidden mt-0.5">
                      {conv.total_turns} turns · {conv.total_tokens_used} tokens · {timeAgo(conv.created_at)}
                    </p>
                  </div>
                  <span className={[
                    'hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full font-medium w-fit',
                    conv.status === 'active'     ? 'bg-emerald-100 text-emerald-700' :
                    conv.status === 'escalated'  ? 'bg-amber-100  text-amber-700'   :
                    'bg-zinc-100 text-zinc-500',
                  ].join(' ')}>
                    {conv.status}
                  </span>
                  <span className="hidden sm:block text-sm text-zinc-600">{conv.total_turns}</span>
                  <span className="hidden sm:block text-sm text-zinc-600">{conv.total_tokens_used.toLocaleString()}</span>
                  <span className="hidden sm:block text-xs text-zinc-400">{timeAgo(conv.created_at)}</span>
                  <ChevronRight className="hidden sm:block w-4 h-4 text-zinc-300" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg disabled:opacity-40 hover:bg-zinc-50"
          >
            ← Prev
          </button>
          <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg disabled:opacity-40 hover:bg-zinc-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}