import {
  Activity,
  MessageSquare,
  Users,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  Clock,
  ShoppingCart,
  DollarSign,
  Sparkles,
  Inbox,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';
import Link from 'next/link';

async function getOverviewData(merchantId: string) {
  const sn = safeName(merchantId);
  try {
    const [convToday, convWeek, msgWeek, tokenWeek, active, recentConvs, convPrevWeek, msgPrevWeek, ticketCount] =
      await Promise.all([
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '1 day'`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."messages" WHERE created_at >= NOW() - INTERVAL '7 days'`),
        pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE status='active' AND updated_at >= NOW() - INTERVAL '1 hour'`),
        pgPool.unsafe(`SELECT id, session_id, customer_id, status, total_turns, total_tokens_used, created_at FROM "tenant_${sn}"."conversations" ORDER BY created_at DESC LIMIT 6`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."messages" WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."support_tickets" WHERE status != 'resolved'`).catch(() => [{ c: 0 }]),
      ]);
    return {
      convToday:    (convToday[0] as any)?.c    ?? 0,
      convWeek:     (convWeek[0] as any)?.c     ?? 0,
      msgWeek:      (msgWeek[0] as any)?.c      ?? 0,
      tokenWeek:    (tokenWeek[0] as any)?.c    ?? 0,
      active:       (active[0] as any)?.c       ?? 0,
      recentConvs:  recentConvs as any[],
      convPrevWeek: (convPrevWeek[0] as any)?.c ?? 0,
      msgPrevWeek:  (msgPrevWeek[0] as any)?.c  ?? 0,
      openTickets:  (ticketCount[0] as any)?.c  ?? 0,
    };
  } catch {
    return { convToday: 0, convWeek: 0, msgWeek: 0, tokenWeek: 0, active: 0, recentConvs: [], convPrevWeek: 0, msgPrevWeek: 0, openTickets: 0 };
  }
}

function calcTrend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function DashboardPage() {
  const merchant = await getMerchant();
  if (!merchant) return null;

  const data = await getOverviewData(merchant.id);
  const convTrend = calcTrend(data.convWeek, data.convPrevWeek);
  const msgTrend = calcTrend(data.msgWeek, data.msgPrevWeek);

  const stats = [
    {
      label: 'Active Sessions',
      value: data.active,
      icon: Activity,
      trend: null,
      accent: true,
    },
    {
      label: 'Conversations',
      sublabel: '7 days',
      value: data.convWeek,
      icon: MessageSquare,
      trend: convTrend,
      accent: false,
    },
    {
      label: 'Messages',
      sublabel: '7 days',
      value: data.msgWeek,
      icon: Users,
      trend: msgTrend,
      accent: false,
    },
    {
      label: 'Tokens Used',
      sublabel: '7 days',
      value: data.tokenWeek.toLocaleString(),
      icon: Zap,
      trend: null,
      accent: false,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your chatbot today
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground glass-card px-4 py-2">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={
              s.accent
                ? 'relative rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 overflow-hidden'
                : 'glass-card p-5'
            }
          >
            {s.accent && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            )}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col">
                <span
                  className={
                    s.accent
                      ? 'text-xs text-white/70 font-medium'
                      : 'text-xs text-muted-foreground font-medium'
                  }
                >
                  {s.label}
                </span>
                {s.sublabel && (
                  <span className="text-[10px] text-muted-foreground/60 mt-0.5">{s.sublabel}</span>
                )}
              </div>
              <div
                className={
                  s.accent
                    ? 'w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center'
                    : 'w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center'
                }
              >
                <s.icon className={s.accent ? 'w-5 h-5 text-white' : 'w-5 h-5 text-primary'} />
              </div>
            </div>
            <p
              className={`text-3xl font-bold mt-3 relative z-10 ${s.accent ? 'text-white' : 'text-foreground'}`}
            >
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </p>
            {s.trend !== null && (
              <div className="flex items-center gap-1 mt-2 relative z-10">
                {s.trend >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                )}
                <span
                  className={`text-xs font-semibold ${s.trend >= 0 ? 'text-emerald-500' : 'text-red-400'}`}
                >
                  {Math.abs(s.trend)}%
                </span>
                <span className="text-xs text-muted-foreground ml-0.5">vs last week</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent conversations */}
        <div className="lg:col-span-3 glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Conversations</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest chatbot interactions</p>
            </div>
            <Link
              href="/inbox"
              className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {data.recentConvs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Share your widget to start chatting!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {data.recentConvs.map((conv: any) => (
                <Link
                  key={conv.id}
                  href="/inbox"
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-accent/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        conv.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conv.customer_id
                          ? `Customer ${conv.customer_id.slice(0, 10)}`
                          : `Guest ${conv.session_id.slice(0, 10)}...`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {conv.total_turns} turns &middot; {timeAgo(conv.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                      conv.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : conv.status === 'escalated'
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {conv.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions + snapshot */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                {
                  href: '/integration/ai-playground',
                  icon: Bot,
                  title: 'AI Playground',
                  desc: 'Test and tune your bot',
                  color: 'text-emerald-500 bg-emerald-500/10',
                },
                {
                  href: '/integration/installation',
                  icon: ShoppingCart,
                  title: 'Install Widget',
                  desc: 'Add chatbot to your store',
                  color: 'text-blue-500 bg-blue-500/10',
                },
                {
                  href: '/analytics/conversational',
                  icon: BarChart3,
                  title: 'View Analytics',
                  desc: 'Conversation insights',
                  color: 'text-violet-500 bg-violet-500/10',
                },
                {
                  href: '/tickets/merchant-support',
                  icon: AlertTriangle,
                  title: 'Support Tickets',
                  desc: data.openTickets > 0 ? `${data.openTickets} open` : 'Manage escalations',
                  color: 'text-amber-500 bg-amber-500/10',
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[var(--glass-border)] hover:bg-accent/30 transition-all group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          {/* Today snapshot */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Today&apos;s Snapshot</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{data.convToday}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Conversations</p>
              </div>
              <div className="rounded-xl bg-chart-2/5 border border-chart-2/10 p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{data.active}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Live Now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
