'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Store,
  Zap,
  HeadphonesIcon,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowLeft,
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

const navItems: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/merchants', label: 'Merchants', icon: Store },
  { href: '/admin/token-usage', label: 'Token Usage', icon: Zap },
  { href: '/admin/tickets', label: 'Tickets', icon: HeadphonesIcon },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const pathname = usePathname();
  const active =
    (item.href === '/admin' && pathname === '/admin') ||
    (item.href !== '/admin' && pathname.startsWith(item.href));

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
          active ? 'text-red-500' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground',
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {active && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px] shadow-red-500/60" />
          )}
        </>
      )}
    </Link>
  );
}

export function AdminSidebar({ userName, userImageUrl }: { userName?: string; userImageUrl?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '72px' : '260px',
    );
  }, [collapsed]);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col min-h-screen glass-sidebar fixed left-0 top-0 z-30 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Profile section */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border transition-all',
        collapsed ? 'flex-col gap-2 px-2 py-4' : 'gap-3 px-5 py-5',
      )}>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center ring-2 ring-sidebar-border">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-[var(--sidebar)]" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">
              Super Admin
            </p>
            <p className="text-sm font-bold text-sidebar-accent-foreground tracking-tight truncate">
              {userName || 'Admin'}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-all',
            collapsed ? 'w-8 h-8 mt-1' : 'w-7 h-7 flex-shrink-0',
          )}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
            ADMINISTRATION
          </p>
        )}
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* Back to merchant dashboard */}
        <div className="mt-4 pt-4 border-t border-sidebar-border">
          <Link
            href="/"
            title={collapsed ? 'Back to Dashboard' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50',
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
            )}
          >
            <ArrowLeft className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>Back to Dashboard</span>}
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-sidebar-border', collapsed ? 'p-2 flex justify-center' : 'p-4')}>
        {collapsed ? (
          <UserButton />
        ) : (
          <div className="flex items-center gap-3 px-2">
            <UserButton />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-sidebar-foreground truncate">Super Admin</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden flex items-center justify-between px-4 py-3 glass border-b border-glass-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground">Super Admin</span>
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-sidebar-accent-foreground">Super Admin</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="p-3">
              <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                ADMINISTRATION
              </p>
              <div className="space-y-0.5">
                {navItems.map((item) => (
                  <div key={item.href} onClick={() => setOpen(false)}>
                    <NavLink item={item} />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-sidebar-border" onClick={() => setOpen(false)}>
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-xl text-[13px] font-medium px-3 py-2.5 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                >
                  <ArrowLeft className="w-[18px] h-[18px]" />
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </nav>
            <div className="p-4 border-t border-sidebar-border mt-auto">
              <div className="flex items-center gap-3 px-2">
                <UserButton />
                <p className="text-xs text-sidebar-foreground">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
