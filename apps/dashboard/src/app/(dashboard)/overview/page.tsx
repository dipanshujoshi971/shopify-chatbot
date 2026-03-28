import {
  MessageSquare,
  Zap,
  Activity,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';
import Link from 'next/link';

async function getOverviewData(merchantId: string) {
  const sn = safeName(merchantId);
  try {
    const [convToday, convWeek, msgWeek, tokenWeek, active, recentConvs] =
      await Promise.all([
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '1 day'`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."messages" WHERE created_at >= NOW() - INTERVAL '7 days'`),
        pgPool.unsafe(`SELECT COALESCE(SUM(total_tokens_used),0)::int AS c FROM "tenant_${sn}"."conversations" WHERE created_at >= NOW() - INTERVAL '7 days'`),
        pgPool.unsafe(`SELECT COUNT(*)::int AS c FROM "tenant_${sn}"."conversations" WHERE status='active' AND updated_at >= NOW() - INTERVAL '1 hour'`),
        pgPool.unsafe(`SELECT id, session_id, status, total_turns, total_tokens_used, created_at FROM "tenant_${sn}"."conversations" ORDER BY created_at DESC LIMIT 5`),
      ]);
    return {
      convToday:   (convToday[0] as any)?.c   ?? 0,
      convWeek:    (convWeek[0] as any)?.c    ?? 0,
      msgWeek:     (msgWeek[0] as any)?.c     ?? 0,
      tokenWeek:   (tokenWeek[0] as any)?.c   ?? 0,
      active:      (active[0] as any)?.c      ?? 0,
      recentConvs: recentConvs as any[],
    };
  } catch {
    return { convToday: 0, convWeek: 0, msgWeek: 0, tokenWeek: 0, active: 0, recentConvs: [] };
  }
}

export default async function OverviewPage() {
  const merchant = await getMerchant();
  if (!merchant) return null;

  const data = await getOverviewData(merchant.id);

  const stats = [
    { label: 'Active Sessions',      value: data.active,    icon: Activity,      accent: true },
    { label: 'Conversations (7d)',    value: data.convWeek,  icon: MessageSquare, accent: false },
    { label: 'Messages (7d)',         value: data.msgWeek,   icon: Users,         accent: false },
    { label: 'Tokens Used (7d)',      value: data.tokenWeek.toLocaleString(), icon: Zap, accent: false },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatsCard key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent conversations */}
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Recent Conversations</h2>
            <Link href="/conversations" className="text-xs text-emerald-600 font-medium hover:text-emerald-700">
              View all →
            </Link>
          </div>
          {data.recentConvs.length === 0 ? (
            <div className="px-5 py-10 text-center text-zinc-400 text-sm">
              No conversations yet. Share your widget to start chatting!
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {data.recentConvs.map((conv: any) => (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      Session {conv.session_id.slice(0, 12)}…
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {conv.total_turns} turns · {conv.total_tokens_used} tokens
                    </p>
                  </div>
                  <span className={[
                    'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                    conv.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-zinc-100 text-zinc-500',
                  ].join(' ')}>
                    {conv.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { href: '/agent',  icon: '🤖', title: 'Customize your bot',    desc: 'Change name, tone, and instructions' },
              { href: '/widget', icon: '🔧', title: 'Get embed code',        desc: 'Add the widget to your store theme' },
              { href: '/conversations', icon: '💬', title: 'View all chats', desc: 'Browse and replay conversations' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all"
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                  <p className="text-xs text-zinc-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}