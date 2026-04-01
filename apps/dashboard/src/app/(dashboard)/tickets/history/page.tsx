'use client';

import { useState } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Download,
  Calendar,
  MessageSquare,
  User,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoricalTicket {
  id: string;
  subject: string;
  type: 'merchant' | 'escalation';
  priority: string;
  resolution: 'resolved' | 'closed' | 'declined';
  createdAt: string;
  closedAt: string;
  responseTime: string;
  replies: number;
  assignee: string;
}

const MOCK_HISTORY: HistoricalTicket[] = [
  { id: 'TK-004', subject: 'Integration with order tracking system', type: 'merchant', priority: 'low', resolution: 'resolved', createdAt: '2024-01-10', closedAt: '2024-01-13', responseTime: '2h 15m', replies: 8, assignee: 'Support Bot' },
  { id: 'ESC-004', subject: 'Complaint about service quality', type: 'escalation', priority: 'low', resolution: 'resolved', createdAt: '2024-01-14', closedAt: '2024-01-14', responseTime: '45m', replies: 4, assignee: 'Alex M.' },
  { id: 'TK-098', subject: 'Widget custom CSS not applying', type: 'merchant', priority: 'medium', resolution: 'resolved', createdAt: '2024-01-08', closedAt: '2024-01-09', responseTime: '1h 30m', replies: 6, assignee: 'Support Bot' },
  { id: 'ESC-012', subject: 'Customer billing dispute', type: 'escalation', priority: 'high', resolution: 'resolved', createdAt: '2024-01-05', closedAt: '2024-01-07', responseTime: '12m', replies: 11, assignee: 'Sarah K.' },
  { id: 'TK-087', subject: 'Bot language not matching store locale', type: 'merchant', priority: 'medium', resolution: 'closed', createdAt: '2024-01-03', closedAt: '2024-01-04', responseTime: '3h 45m', replies: 3, assignee: 'Support Bot' },
  { id: 'ESC-008', subject: 'Order never delivered', type: 'escalation', priority: 'critical', resolution: 'resolved', createdAt: '2024-01-02', closedAt: '2024-01-03', responseTime: '5m', replies: 15, assignee: 'Mike T.' },
  { id: 'TK-072', subject: 'Analytics data not loading', type: 'merchant', priority: 'high', resolution: 'declined', createdAt: '2023-12-28', closedAt: '2023-12-30', responseTime: '45m', replies: 2, assignee: 'Support Bot' },
];

const resolutionConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  resolved: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10', label: 'Resolved' },
  closed: { icon: XCircle, color: 'text-muted-foreground bg-muted', label: 'Closed' },
  declined: { icon: XCircle, color: 'text-red-400 bg-red-500/10', label: 'Declined' },
};

export default function TicketHistoryPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'merchant' | 'escalation'>('all');

  const filtered = MOCK_HISTORY.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalResolved = MOCK_HISTORY.filter((t) => t.resolution === 'resolved').length;
  const avgResponseTime = '1h 23m';

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Ticket History</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All resolved and closed tickets</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Total Archived</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{MOCK_HISTORY.length}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalResolved}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{Math.round((totalResolved / MOCK_HISTORY.length) * 100)}% resolution rate</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-chart-2" />
            <span className="text-xs text-muted-foreground font-medium">Avg Response</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgResponseTime}</p>
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
            placeholder="Search by ticket ID or subject..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'merchant', 'escalation'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all',
                typeFilter === t
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30',
              )}
            >
              {t === 'all' ? 'All Types' : t}
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
          <span>Resolution</span>
          <span>Response</span>
          <span>Replies</span>
          <span>Closed</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <History className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No matching tickets</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--glass-border)]">
            {filtered.map((ticket) => {
              const res = resolutionConfig[ticket.resolution];
              return (
                <div
                  key={ticket.id}
                  className="grid grid-cols-1 lg:grid-cols-[80px_1fr_100px_90px_90px_80px_100px] gap-2 lg:gap-4 px-5 py-4 hover:bg-accent/20 transition-all items-center cursor-pointer"
                >
                  <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground lg:hidden mt-0.5">
                      {ticket.type} &middot; {ticket.resolution} &middot; {ticket.responseTime}
                    </p>
                  </div>
                  <span className={cn(
                    'hidden lg:inline-flex text-[11px] px-2 py-0.5 rounded-full font-medium w-fit capitalize',
                    ticket.type === 'merchant' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500',
                  )}>
                    {ticket.type}
                  </span>
                  <span className={cn('hidden lg:inline-flex text-[11px] px-2 py-0.5 rounded-full font-semibold w-fit', res.color)}>
                    {res.label}
                  </span>
                  <span className="hidden lg:block text-xs text-muted-foreground">{ticket.responseTime}</span>
                  <span className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3" />
                    {ticket.replies}
                  </span>
                  <span className="hidden lg:block text-xs text-muted-foreground">{ticket.closedAt}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
