'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Clock,
  User,
  Bot,
  ArrowUpRight,
  ShieldAlert,
  MessageSquare,
  ChevronRight,
  Flame,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Severity = 'low' | 'medium' | 'high' | 'critical';
type EscalationStatus = 'new' | 'reviewing' | 'contacted' | 'resolved';

interface Escalation {
  id: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  summary: string;
  severity: Severity;
  status: EscalationStatus;
  conversationId: string;
  escalatedAt: string;
  responseTime: string | null;
}

const MOCK_ESCALATIONS: Escalation[] = [
  { id: 'ESC-001', customerName: 'Sarah Johnson', customerEmail: 's.johnson@example.com', reason: 'Refund request not handled', summary: 'Customer asked about refund for damaged item, bot could not process the request and customer became frustrated.', severity: 'high', status: 'new', conversationId: 'conv-123', escalatedAt: '2024-01-15T16:30:00Z', responseTime: null },
  { id: 'ESC-002', customerName: 'Mike Chen', customerEmail: 'm.chen@example.com', reason: 'Wrong product information', summary: 'Bot provided incorrect sizing information for a product, leading to customer confusion about what size to order.', severity: 'medium', status: 'reviewing', conversationId: 'conv-456', escalatedAt: '2024-01-15T14:00:00Z', responseTime: '25m' },
  { id: 'ESC-003', customerName: 'Emily Davis', customerEmail: 'e.davis@example.com', reason: 'Repeated failed order lookup', summary: 'Customer tried 3 times to look up order status but bot kept returning errors. Customer requested human agent.', severity: 'critical', status: 'contacted', conversationId: 'conv-789', escalatedAt: '2024-01-15T11:00:00Z', responseTime: '8m' },
  { id: 'ESC-004', customerName: 'Alex Thompson', customerEmail: 'a.thompson@example.com', reason: 'Complaint about service quality', summary: 'Customer unhappy with automated responses and wants to speak with a real person about their ongoing order issue.', severity: 'low', status: 'resolved', conversationId: 'conv-012', escalatedAt: '2024-01-14T09:00:00Z', responseTime: '45m' },
];

const severityConfig: Record<Severity, { color: string; bg: string }> = {
  low: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10' },
};

const statusLabels: Record<EscalationStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-500/15 text-blue-500' },
  reviewing: { label: 'Reviewing', color: 'bg-amber-500/15 text-amber-500' },
  contacted: { label: 'Contacted', color: 'bg-violet-500/15 text-violet-500' },
  resolved: { label: 'Resolved', color: 'bg-emerald-500/15 text-emerald-500' },
};

export default function CustomerEscalationsPage() {
  const [filter, setFilter] = useState<EscalationStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = MOCK_ESCALATIONS.filter((e) => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (search && !e.customerName.toLowerCase().includes(search.toLowerCase()) && !e.reason.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const urgentCount = MOCK_ESCALATIONS.filter((e) => e.severity === 'critical' || e.severity === 'high').length;
  const unresolvedCount = MOCK_ESCALATIONS.filter((e) => e.status !== 'resolved').length;
  const avgResponseTime = '26m';

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Customer Escalations</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Conversations that need human attention</p>
      </div>

      {/* Alert banner for urgent items */}
      {urgentCount > 0 && (
        <div className="glass-card p-4 mb-6 border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{urgentCount} high-priority escalation{urgentCount > 1 ? 's' : ''} need attention</p>
              <p className="text-xs text-muted-foreground mt-0.5">Critical and high severity issues should be addressed within 15 minutes</p>
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
            <span className="text-xs text-muted-foreground font-medium">Avg Response</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgResponseTime}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">Resolved Today</span>
          </div>
          <p className="text-2xl font-bold text-foreground">1</p>
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
            placeholder="Search by customer or reason..."
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'new', 'reviewing', 'contacted', 'resolved'] as const).map((s) => (
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
              {s === 'all' ? 'All' : statusLabels[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Escalations list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card py-16 text-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No escalations found</p>
          </div>
        ) : (
          filtered.map((esc) => {
            const sev = severityConfig[esc.severity];
            const stat = statusLabels[esc.status];
            return (
              <div key={esc.id} className="glass-card p-5 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', sev.bg)}>
                      <AlertTriangle className={cn('w-5 h-5', sev.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{esc.id}</span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase', sev.bg, sev.color)}>
                          {esc.severity}
                        </span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', stat.color)}>
                          {stat.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{esc.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{esc.summary}</p>
                    </div>
                  </div>
                  {esc.responseTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Timer className="w-3 h-3" />
                      {esc.responseTime}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-foreground font-medium">{esc.customerName}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{esc.customerEmail}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(esc.escalatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
