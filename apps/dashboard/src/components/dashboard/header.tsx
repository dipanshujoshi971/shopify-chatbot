'use client';

import { usePathname } from 'next/navigation';
import { Bell, Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/inbox': 'Inbox',
  '/settings': 'Settings',
  '/integration': 'Integration',
  '/integration/installation': 'Installation',
  '/integration/appearance': 'Appearance',
  '/integration/ai-playground': 'AI Playground',
  '/tickets': 'Tickets',
  '/tickets/merchant-support': 'Merchant Support',
  '/tickets/customer-escalations': 'Customer Escalations',
  '/tickets/history': 'Ticket History',
  '/analytics': 'Analytics',
  '/analytics/conversational': 'Conversational Analytics',
  '/analytics/sales': 'Sales Analytics',
  '/analytics/customer-behavior': 'Customer Behavior',
  '/analytics/ai-insights': 'AI Insights',
  '/analytics/performance': 'Performance & Response',
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let path = '';
  for (const segment of segments) {
    path += `/${segment}`;
    const label = breadcrumbMap[path];
    if (label) crumbs.push({ label, href: path });
  }

  return crumbs;
}

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const crumbs = getBreadcrumbs(pathname);

  const pageTitle = pathname === '/'
    ? 'Dashboard'
    : breadcrumbMap[pathname] ?? 'Dashboard';

  return (
    <header className="h-16 glass border-b border-[var(--glass-border)] flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex flex-col">
        {/* Breadcrumbs */}
        {crumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-default">Home</span>
            {crumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                <span className="opacity-40">/</span>
                <span className={cn(
                  'transition-colors',
                  i === crumbs.length - 1
                    ? 'text-foreground font-medium'
                    : 'hover:text-foreground cursor-default'
                )}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-base font-semibold text-foreground leading-tight">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search button */}
        <button className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_6px] shadow-primary/60" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
