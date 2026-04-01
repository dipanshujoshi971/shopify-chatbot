'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Puzzle,
  Download,
  Paintbrush,
  Sparkles,
  Inbox,
  Ticket,
  HeadphonesIcon,
  AlertTriangle,
  History,
  BarChart3,
  MessageSquareText,
  DollarSign,
  Users,
  Brain,
  Gauge,
  Settings,
  ChevronDown,
  Store,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserButton } from '@clerk/nextjs';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

const navigation: NavEntry[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Integration',
    icon: Puzzle,
    items: [
      { href: '/integration/installation', label: 'Installation', icon: Download },
      { href: '/integration/appearance', label: 'Appearance', icon: Paintbrush },
      { href: '/integration/ai-playground', label: 'AI Playground', icon: Sparkles },
    ],
  },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  {
    label: 'Tickets',
    icon: Ticket,
    items: [
      { href: '/tickets/merchant-support', label: 'Merchant Support', icon: HeadphonesIcon },
      { href: '/tickets/customer-escalations', label: 'Customer Escalations', icon: AlertTriangle },
      { href: '/tickets/history', label: 'Ticket History', icon: History },
    ],
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    items: [
      { href: '/analytics/conversational', label: 'Conversational', icon: MessageSquareText },
      { href: '/analytics/sales', label: 'Sales Analytics', icon: DollarSign },
      { href: '/analytics/customer-behavior', label: 'Customer Behavior', icon: Users },
      { href: '/analytics/ai-insights', label: 'AI Insights', icon: Brain },
      { href: '/analytics/performance', label: 'Performance & Response', icon: Gauge },
    ],
  },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  shopDomain?: string;
  planId?: string;
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200',
        active
          ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px] shadow-primary/20'
          : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent',
      )}
    >
      <item.icon className={cn(
        'w-[18px] h-[18px] flex-shrink-0 transition-colors',
        active ? 'text-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground',
      )} />
      {!collapsed && <span>{item.label}</span>}
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/60" />
      )}
    </Link>
  );
}

function NavSection({ group }: { group: NavGroup }) {
  const pathname = usePathname();
  const isActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href)
  );
  const [open, setOpen] = useState(isActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200',
          isActive
            ? 'text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent',
        )}
      >
        <group.icon className={cn(
          'w-[18px] h-[18px] flex-shrink-0 transition-colors',
          isActive ? 'text-primary' : '',
        )} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-300 opacity-50',
            open && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5 py-1">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ shopDomain, planId }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen glass-sidebar fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
          <Sparkles className="w-4.5 h-4.5 text-white" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground tracking-tight">ShopChat</p>
          {planId && (
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">{planId} plan</p>
          )}
        </div>
      </div>

      {/* Store pill */}
      {shopDomain && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/50 border border-sidebar-border flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Store className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs text-sidebar-foreground font-medium truncate">{shopDomain}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((entry) =>
          isGroup(entry) ? (
            <NavSection key={entry.label} group={entry} />
          ) : (
            <NavLink key={entry.href} item={entry} />
          )
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <UserButton />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-sidebar-foreground truncate">Signed in</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header bar */}
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

      {/* Mobile nav drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-[280px] min-h-screen glass-sidebar overflow-y-auto">
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-foreground">ShopChat</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-sidebar-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navigation.map((entry) =>
                isGroup(entry) ? (
                  <NavSection key={entry.label} group={entry} />
                ) : (
                  <div key={entry.href} onClick={() => setOpen(false)}>
                    <NavLink item={entry} />
                  </div>
                )
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
