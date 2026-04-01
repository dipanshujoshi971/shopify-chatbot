'use client';

import { useState } from 'react';
import {
  HeadphonesIcon,
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronRight,
  MessageSquare,
  User,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  category: string;
  createdAt: string;
  lastReply: string;
  replies: number;
}

const MOCK_TICKETS: Ticket[] = [
  { id: 'TK-001', subject: 'Bot not responding to product queries', description: 'The chatbot fails to return product data when customers ask about specific items.', priority: 'high', status: 'open', category: 'Bug', createdAt: '2024-01-15T10:00:00Z', lastReply: '2024-01-15T14:30:00Z', replies: 3 },
  { id: 'TK-002', subject: 'Need custom greeting for holiday sale', description: 'We want to set up a special greeting message for our upcoming holiday sale event.', priority: 'medium', status: 'in_progress', category: 'Feature Request', createdAt: '2024-01-14T09:00:00Z', lastReply: '2024-01-15T11:00:00Z', replies: 5 },
  { id: 'TK-003', subject: 'Widget loading slowly on mobile', description: 'The chatbot widget takes a long time to load on mobile devices.', priority: 'medium', status: 'waiting', category: 'Performance', createdAt: '2024-01-13T15:00:00Z', lastReply: '2024-01-14T10:00:00Z', replies: 2 },
  { id: 'TK-004', subject: 'Integration with order tracking system', description: 'Need help connecting the chatbot to our custom order tracking API.', priority: 'low', status: 'resolved', category: 'Integration', createdAt: '2024-01-10T12:00:00Z', lastReply: '2024-01-13T16:00:00Z', replies: 8 },
  { id: 'TK-005', subject: 'Chatbot sending incorrect pricing', description: 'Some products are showing outdated prices in the chat responses.', priority: 'urgent', status: 'open', category: 'Bug', createdAt: '2024-01-15T16:00:00Z', lastReply: '2024-01-15T16:30:00Z', replies: 1 },
];

const priorityColors: Record<Priority, string> = {
  low: 'bg-blue-500/10 text-blue-500',
  medium: 'bg-amber-500/10 text-amber-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-red-500/10 text-red-500',
};

const statusConfig: Record<TicketStatus, { icon: typeof Circle; color: string; label: string }> = {
  open: { icon: Circle, color: 'text-blue-500', label: 'Open' },
  in_progress: { icon: Clock, color: 'text-amber-500', label: 'In Progress' },
  waiting: { icon: AlertCircle, color: 'text-orange-500', label: 'Waiting' },
  resolved: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Resolved' },
};

export default function MerchantSupportPage() {
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filtered = MOCK_TICKETS.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: MOCK_TICKETS.length,
    open: MOCK_TICKETS.filter((t) => t.status === 'open').length,
    in_progress: MOCK_TICKETS.filter((t) => t.status === 'in_progress').length,
    waiting: MOCK_TICKETS.filter((t) => t.status === 'waiting').length,
    resolved: MOCK_TICKETS.filter((t) => t.status === 'resolved').length,
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Merchant Support</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage support tickets from your team</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {([
          { status: 'open' as TicketStatus, label: 'Open', count: counts.open },
          { status: 'in_progress' as TicketStatus, label: 'In Progress', count: counts.in_progress },
          { status: 'waiting' as TicketStatus, label: 'Waiting', count: counts.waiting },
          { status: 'resolved' as TicketStatus, label: 'Resolved', count: counts.resolved },
        ]).map((item) => {
          const config = statusConfig[item.status];
          return (
            <button
              key={item.status}
              onClick={() => setFilter(filter === item.status ? 'all' : item.status)}
              className={cn(
                'glass-card p-4 text-left transition-all',
                filter === item.status && 'ring-2 ring-primary/30',
              )}
            >
              <config.icon className={cn('w-5 h-5 mb-2', config.color)} />
              <p className="text-2xl font-bold text-foreground">{item.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="glass-card p-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Tickets list */}
      <div className="glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <HeadphonesIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--glass-border)]">
            {filtered.map((ticket) => {
              const status = statusConfig[ticket.status];
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full text-left px-5 py-4 hover:bg-accent/20 transition-all flex items-center gap-4"
                >
                  <status.icon className={cn('w-5 h-5 flex-shrink-0', status.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase', priorityColors[ticket.priority])}>
                        {ticket.priority}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground font-medium">
                        {ticket.category}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{ticket.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />
                      {ticket.replies}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
