'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar, MobileNav } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

interface DashboardShellProps {
  children: React.ReactNode;
  shopDomain?: string;
  planId?: string;
  userName?: string;
  userRole?: string;
}

/**
 * DashboardShell
 *
 * Wraps the dashboard layout, hoisting sidebar collapsed state so the
 * main content margin tracks the sidebar width with a smooth transition.
 *
 * Drop-in for your existing (dashboard)/layout.tsx:
 *
 *   // apps/dashboard/src/app/(dashboard)/layout.tsx
 *   import { DashboardShell } from '@/components/dashboard/dashboard-shell';
 *
 *   export default async function DashboardLayout({ children }) {
 *     const merchant = await getMerchant();
 *     if (!merchant) return <ConnectStoreForm />;
 *     return (
 *       <DashboardShell
 *         shopDomain={merchant.shopDomain}
 *         planId={merchant.planId}
 *       >
 *         {children}
 *       </DashboardShell>
 *     );
 *   }
 */
export function DashboardShell({
  children,
  shopDomain,
  planId,
  userName,
  userRole,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0e0e10] transition-colors duration-300">
      <Sidebar
        shopDomain={shopDomain}
        planId={planId}
        userName={userName}
        userRole={userRole}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />

      {/* Shifts right as sidebar width changes */}
      <div
        style={{ transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
        className={cn(
          'transition-[padding-left] duration-300',
          'lg:pl-[240px]',
          collapsed && 'lg:pl-[68px]',
        )}
      >
        <MobileNav />
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}