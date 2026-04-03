'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Download,
  Paintbrush,
  Sparkles,
  Inbox,
  HeadphonesIcon,
  AlertTriangle,
  History,
  MessageSquareText,
  Users,
  Gauge,
  Settings,
  Store,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserButton } from '@clerk/nextjs';

/* ─── Types ─── */
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface Section {
  label: string;
  items: NavItem[];
}

interface RecentChat {
  id: string;
  sessionId: string;
  status: string;
  createdAt: string;
}

/* ─── Navigation config ─── */
const sections: Section[] = [
  {
    label: 'MAIN',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/inbox', label: 'Inbox', icon: Inbox },
    ],
  },
  {
    label: 'INTEGRATION',
    items: [
      { href: '/integration/installation', label: 'Installation', icon: Download },
      { href: '/integration/appearance', label: 'Appearance', icon: Paintbrush },
      { href: '/integration/ai-playground', label: 'AI Playground', icon: Sparkles },
    ],
  },
  {
    label: 'TICKETS',
    items: [
      { href: '/tickets/customer-escalations', label: 'Customer Tickets', icon: AlertTriangle },
      { href: '/tickets/merchant-support', label: 'Merchant Support', icon: HeadphonesIcon },
      { href: '/tickets/history', label: 'History', icon: History },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { href: '/analytics/conversational', label: 'Conversational', icon: MessageSquareText },
      { href: '/analytics/customer-behavior', label: 'Customer Behavior', icon: Users },
      { href: '/analytics/performance', label: 'Performance', icon: Gauge },
    ],
  },
];

/* ─── Nav Item ─── */
function NavLink({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px] shadow-sidebar-border'
          : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50',
      )}
    >
      <item.icon
        className={cn(
          'w-[18px] h-[18px] flex-shrink-0 transition-colors',
          active ? 'text-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground',
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {active && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/60" />
          )}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="min-w-5 h-5 flex items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold px-1">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

/* ─── Main Sidebar ─── */
interface SidebarProps {
  shopDomain?: string;
  planId?: string;
  userName?: string;
  userImageUrl?: string;
}

export function Sidebar({ shopDomain, planId, userName, userImageUrl }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '72px' : '260px',
    );
  }, [collapsed]);

  // Fetch recent chats for sidebar
  useEffect(() => {
    fetch('/api/conversations?limit=3')
      .then((r) => r.json())
      .then((data) => {
        if (data.conversations) setRecentChats(data.conversations.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col min-h-screen glass-sidebar fixed left-0 top-0 z-30 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* ─ Profile section ─ */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border transition-all',
        collapsed ? 'flex-col gap-2 px-2 py-4' : 'gap-3 px-5 py-5',
      )}>
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {userImageUrl ? (
            <img
              src={userImageUrl}
              alt={userName ?? 'User'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-sidebar-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center ring-2 ring-sidebar-border">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--sidebar)]" />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            {planId && (
              <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">
                {planId} plan
              </p>
            )}
            <p className="text-sm font-bold text-sidebar-accent-foreground tracking-tight truncate">
              {userName || 'ShopChat'}
            </p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-all',
            collapsed ? 'w-8 h-8 mt-1' : 'w-7 h-7 flex-shrink-0',
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* ─ Store pill ─ */}
      {shopDomain && !collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-sidebar-accent/40 border border-sidebar-border flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Store className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[11px] text-sidebar-foreground font-medium truncate">
            {shopDomain}
          </span>
        </div>
      )}

      {/* ─ Navigation ─ */}
      <nav className={cn(
        'flex-1 overflow-y-auto py-3',
        collapsed ? 'px-2' : 'px-3',
      )}>
        {sections.map((section) => (
          <div key={section.label} className="mb-1">
            {!collapsed && (
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                {section.label}
              </p>
            )}
            {collapsed && <div className="my-2 mx-2 border-t border-sidebar-border" />}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}

        {/* Settings - always at bottom of nav */}
        {!collapsed && (
          <div className="mt-1 pt-2 border-t border-sidebar-border">
            <NavLink item={{ href: '/settings', label: 'Settings', icon: Settings }} />
          </div>
        )}
        {collapsed && (
          <div className="mt-1 pt-2 border-t border-sidebar-border">
            <NavLink item={{ href: '/settings', label: 'Settings', icon: Settings }} collapsed />
          </div>
        )}
      </nav>

      {/* ─ Recent Messages ─ */}
      {!collapsed && recentChats.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
              Messages
            </p>
            <Link
              href="/inbox"
              className="w-5 h-5 rounded-md flex items-center justify-center text-sidebar-foreground/50 hover:text-primary hover:bg-sidebar-accent transition-all"
            >
              <Plus className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0.5">
            {recentChats.map((chat) => (
              <Link
                key={chat.id}
                href="/inbox"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-all"
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    chat.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-sidebar-accent text-sidebar-foreground',
                  )}
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-[12px] font-medium truncate">
                  {chat.sessionId?.slice(0, 12)}...
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─ User footer ─ */}
      <div className={cn(
        'border-t border-sidebar-border',
        collapsed ? 'p-2 flex justify-center' : 'p-4',
      )}>
        {collapsed ? (
          <UserButton />
        ) : (
          <div className="flex items-center gap-3 px-2">
            <UserButton />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-sidebar-foreground truncate">Signed in</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─── Mobile Navigation ─── */
export function MobileNav({ shopDomain }: { shopDomain?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden flex items-center justify-between px-4 py-3 glass border-b border-glass-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground">ShopChat</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-[280px] min-h-screen glass-sidebar overflow-y-auto">
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-sidebar-accent-foreground">ShopChat</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {shopDomain && (
              <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-sidebar-accent/40 border border-sidebar-border flex items-center gap-2.5">
                <Store className="w-3 h-3 text-primary" />
                <span className="text-[11px] text-sidebar-foreground font-medium truncate">{shopDomain}</span>
              </div>
            )}

            <nav className="p-3">
              {sections.map((section) => (
                <div key={section.label} className="mb-1">
                  <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <div key={item.href} onClick={() => setOpen(false)}>
                        <NavLink item={item} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-sidebar-border" onClick={() => setOpen(false)}>
                <NavLink item={{ href: '/settings', label: 'Settings', icon: Settings }} />
              </div>
            </nav>

            <div className="p-4 border-t border-sidebar-border mt-auto">
              <div className="flex items-center gap-3 px-2">
                <UserButton />
                <p className="text-xs text-sidebar-foreground">Signed in</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
