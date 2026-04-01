'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plug2,
  Inbox,
  Ticket,
  BarChart2,
  Settings,
  ChevronRight,
  ChevronLeft,
  Download,
  Palette,
  FlaskConical,
  Headphones,
  AlertTriangle,
  History,
  MessageSquareText,
  ShoppingCart,
  Users,
  BrainCircuit,
  Gauge,
  Sun,
  Moon,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserButton } from '@clerk/nextjs';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavChild = { href: string; label: string; icon: React.ElementType };

type NavItem =
  | { type: 'link';  href: string; label: string; icon: React.ElementType }
  | { type: 'group'; label: string; icon: React.ElementType; children: NavChild[] };

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    type: 'link',
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    type: 'group',
    label: 'Integration',
    icon: Plug2,
    children: [
      { href: '/integration/installation', label: 'Installation',  icon: Download        },
      { href: '/integration/appearance',   label: 'Appearance',    icon: Palette         },
      { href: '/integration/playground',   label: 'AI Playground', icon: FlaskConical    },
    ],
  },
  {
    type: 'link',
    href: '/inbox',
    label: 'Inbox',
    icon: Inbox,
  },
  {
    type: 'group',
    label: 'Tickets',
    icon: Ticket,
    children: [
      { href: '/tickets/merchant-support',     label: 'Merchant Support',      icon: Headphones     },
      { href: '/tickets/customer-escalations', label: 'Customer Escalations',  icon: AlertTriangle  },
      { href: '/tickets/history',              label: 'Ticket History',         icon: History        },
    ],
  },
  {
    type: 'group',
    label: 'Analytics',
    icon: BarChart2,
    children: [
      { href: '/analytics/conversational', label: 'Conversational Analytics', icon: MessageSquareText },
      { href: '/analytics/sales',          label: 'Sales Analytics',          icon: ShoppingCart      },
      { href: '/analytics/customer',       label: 'Customer Behavior',        icon: Users             },
      { href: '/analytics/ai-insights',    label: 'AI Insights',              icon: BrainCircuit      },
      { href: '/analytics/performance',    label: 'Performance & Response',   icon: Gauge             },
    ],
  },
  {
    type: 'link',
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

// ─── Theme hook ───────────────────────────────────────────────────────────────

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = (localStorage.getItem('shopchat_theme') ?? 'dark') as 'dark' | 'light';
    setTheme(stored);
    document.documentElement.classList.toggle('dark', stored === 'dark');
  }, []);

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('shopchat_theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  return { theme, toggle };
}

// ─── Sub-item ─────────────────────────────────────────────────────────────────

function SubItem({
  child,
  isActive,
  collapsed,
}: {
  child: NavChild;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = child.icon;
  return (
    <Link
      href={child.href}
      title={collapsed ? child.label : undefined}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[12.5px] font-medium',
        'transition-colors duration-150',
        isActive
          ? 'text-emerald-400 bg-emerald-500/10'
          : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-200 hover:bg-white/5',
      )}
    >
      <Icon
        size={13}
        className={cn(
          'shrink-0 transition-colors duration-150',
          isActive
            ? 'text-emerald-400'
            : 'text-zinc-600 group-hover:text-zinc-300',
        )}
      />
      <span
        className={cn(
          'whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
        )}
      >
        {child.label}
      </span>
    </Link>
  );
}

// ─── Nav group ────────────────────────────────────────────────────────────────

function NavGroup({
  item,
  pathname,
  collapsed,
}: {
  item: Extract<NavItem, { type: 'group' }>;
  pathname: string;
  collapsed: boolean;
}) {
  const isChildActive = item.children.some(c => pathname.startsWith(c.href));
  const [open, setOpen] = useState(isChildActive);
  const Icon = item.icon;

  useEffect(() => { if (isChildActive) setOpen(true); }, [isChildActive]);
  useEffect(() => { if (collapsed) setOpen(false); }, [collapsed]);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => !collapsed && setOpen(o => !o)}
        title={collapsed ? item.label : undefined}
        className={cn(
          'flex items-center gap-3 rounded-xl text-[13px] font-semibold select-none',
          'px-3 py-[9px] w-full',
          'transition-colors duration-150',
          isChildActive
            ? 'text-emerald-400'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
          collapsed && 'justify-center',
        )}
      >
        <Icon
          size={16}
          className={cn(
            'shrink-0 transition-colors duration-150',
            isChildActive ? 'text-emerald-400' : 'text-zinc-500',
          )}
        />
        <span
          className={cn(
            'flex-1 text-left whitespace-nowrap overflow-hidden',
            'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
          )}
        >
          {item.label}
        </span>
        {!collapsed && (
          <ChevronRight
            size={13}
            className={cn(
              'shrink-0 text-zinc-600 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
              open && 'rotate-90',
            )}
          />
        )}
      </button>

      {/* Animated children */}
      <div
        className={cn(
          'overflow-hidden',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          open && !collapsed ? 'max-h-96 opacity-100 mt-0.5' : 'max-h-0 opacity-0',
        )}
      >
        <div className="ml-[22px] pl-3.5 border-l border-white/[0.07] flex flex-col gap-px pb-1">
          {item.children.map(child => (
            <SubItem
              key={child.href}
              child={child}
              isActive={pathname.startsWith(child.href)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: Extract<NavItem, { type: 'link' }>;
  pathname: string;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-semibold',
        'transition-colors duration-150',
        isActive
          ? 'bg-emerald-500/12 text-emerald-400'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
        collapsed && 'justify-center',
      )}
    >
      <Icon
        size={16}
        className={cn(
          'shrink-0 transition-colors duration-150',
          isActive ? 'text-emerald-400' : 'text-zinc-500',
        )}
      />
      <span
        className={cn(
          'flex-1 whitespace-nowrap overflow-hidden',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
        )}
      >
        {item.label}
      </span>
      {isActive && !collapsed && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
      )}
    </Link>
  );
}

// ─── Sidebar props ────────────────────────────────────────────────────────────

interface SidebarProps {
  shopDomain?: string;
  planId?: string;
  userName?: string;
  userRole?: string;
  /** Controlled mode: pass collapsed + onCollapsedChange from parent layout */
  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({
  shopDomain,
  planId,
  userName,
  userRole,
  collapsed: controlledCollapsed,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  // Support both controlled and uncontrolled modes
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = useCallback(
    (v: boolean) => {
      setInternalCollapsed(v);
      onCollapsedChange?.(v);
    },
    [onCollapsedChange],
  );

  return (
    <aside
      style={{ transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
      className={cn(
        // Base
        'hidden lg:flex flex-col min-h-screen fixed left-0 top-0 z-30',
        'transition-[width] duration-300',
        // Theme-aware background
        'bg-zinc-950 dark:bg-zinc-950',
        'border-r border-white/[0.06]',
        // Width
        collapsed ? 'w-[68px]' : 'w-[240px]',
      )}
    >
      {/* ── User profile ──────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center border-b border-white/[0.06]',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          collapsed ? 'px-[17px] py-5 gap-0' : 'px-4 py-5 gap-3',
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-emerald-900/40 select-none">
            {(userName ?? 'A').charAt(0).toUpperCase()}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-zinc-950 shadow" />
        </div>

        {/* Name + role */}
        <div
          className={cn(
            'min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
            collapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-[120px] opacity-100',
          )}
        >
          <p className="text-[13px] font-semibold text-white leading-none mb-[3px] truncate">
            {userName ?? 'Andrew Smith'}
          </p>
          <p className="text-[10.5px] text-zinc-500 leading-none truncate uppercase tracking-wider font-medium">
            {userRole ?? 'Product Designer'}
          </p>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-lg shrink-0',
            'text-zinc-600 hover:text-zinc-300 hover:bg-white/10',
            'transition-all duration-150',
            collapsed ? 'ml-0' : 'ml-auto',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            size={14}
            className={cn(
              'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
              collapsed && 'rotate-180',
            )}
          />
        </button>
      </div>

      {/* ── Store pill ────────────────────────────────────────────── */}
      <div
        className={cn(
          'mx-3 overflow-hidden',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          collapsed || !shopDomain ? 'h-0 mt-0 opacity-0' : 'h-9 mt-3 opacity-100',
        )}
      >
        <div className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center gap-2">
          <Store size={12} className="text-zinc-600 shrink-0" />
          <span className="text-[11px] text-zinc-500 truncate">{shopDomain}</span>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav
        className={cn(
          'flex-1 px-3 py-3 flex flex-col gap-px',
          'overflow-y-auto overflow-x-hidden',
          '[&::-webkit-scrollbar]:w-0',
        )}
      >
        {NAV_ITEMS.map((item, i) =>
          item.type === 'link' ? (
            <NavLink key={i} item={item} pathname={pathname} collapsed={collapsed} />
          ) : (
            <NavGroup key={i} item={item} pathname={pathname} collapsed={collapsed} />
          ),
        )}
      </nav>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] px-3 py-3 flex flex-col gap-1">
        {/* Dark / light toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-xl w-full',
            'text-zinc-500 hover:text-zinc-200 hover:bg-white/5',
            'transition-colors duration-150 text-[13px] font-medium',
            collapsed && 'justify-center',
          )}
        >
          {/* Animated icon swap */}
          <div className="relative shrink-0 w-4 h-4">
            <Sun
              size={16}
              className={cn(
                'absolute inset-0 transition-all duration-300',
                theme === 'dark'
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-75 rotate-90',
              )}
            />
            <Moon
              size={16}
              className={cn(
                'absolute inset-0 transition-all duration-300',
                theme === 'light'
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-75 -rotate-90',
              )}
            />
          </div>

          <span
            className={cn(
              'whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[120px] opacity-100',
            )}
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

        {/* Clerk user button + plan */}
        <div
          className={cn(
            'flex items-center gap-3 px-2 py-1.5 rounded-xl',
            'transition-all duration-150',
            collapsed && 'justify-center',
          )}
        >
          <UserButton afterSignOutUrl="/sign-in" />
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[120px] opacity-100',
            )}
          >
            <p className="text-[11px] text-zinc-500 whitespace-nowrap">
              Signed in
              {planId && (
                <>
                  {' · '}
                  <span className="capitalize text-emerald-500 font-medium">{planId}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile nav ───────────────────────────────────────────────────────────────

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-zinc-950 border-b border-white/[0.06] [&::-webkit-scrollbar]:h-0">
      {NAV_ITEMS.map((item, i) => {
        const Icon = item.icon;
        const href = item.type === 'link' ? item.href : item.children[0].href;
        const isActive =
          item.type === 'link'
            ? pathname.startsWith(item.href)
            : item.children.some(c => pathname.startsWith(c.href));

        return (
          <Link
            key={i}
            href={href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
              'transition-colors duration-150',
              isActive
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <Icon size={13} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}