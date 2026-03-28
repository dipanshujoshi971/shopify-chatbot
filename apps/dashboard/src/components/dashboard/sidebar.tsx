'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Code2,
  Settings,
  Zap,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserButton } from '@clerk/nextjs';

const navItems = [
  { href: '/overview',       label: 'Overview',       icon: LayoutDashboard },
  { href: '/conversations',  label: 'Conversations',  icon: MessageSquare },
  { href: '/agent',          label: 'Agent Config',   icon: Bot },
  { href: '/widget',         label: 'Widget Setup',   icon: Code2 },
  { href: '/settings',       label: 'Settings',       icon: Settings },
];

interface SidebarProps {
  shopDomain?: string;
  planId?: string;
}

export function Sidebar({ shopDomain, planId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-zinc-950 border-r border-zinc-800 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm flex-shrink-0">
          💬
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">ShopChat</p>
          {planId && (
            <p className="text-[10px] text-emerald-400 font-medium capitalize">{planId} plan</p>
          )}
        </div>
      </div>

      {/* Store pill */}
      {shopDomain && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-2">
          <Store className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
          <span className="text-xs text-zinc-400 truncate">{shopDomain}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-zinc-800 flex items-center gap-3">
        <UserButton afterSignOutUrl="/sign-in" />
        <div className="min-w-0">
          <p className="text-xs text-zinc-400 truncate">Signed in</p>
        </div>
      </div>
    </aside>
  );
}

// Mobile nav (shown at top on small screens)
export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-zinc-950 border-b border-zinc-800">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              active
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}