import { redirect } from 'next/navigation';
import { getMerchant } from '@/lib/merchant';
import { isSuperAdmin } from '@/lib/admin';
import { currentUser } from '@clerk/nextjs/server';
import { Sidebar, MobileNav } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { ConnectStoreForm } from '@/components/dashboard/connect-store-form';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [merchant, user, isAdmin] = await Promise.all([getMerchant(), currentUser(), isSuperAdmin()]);

  // Super admin auto-redirect: send them straight to the admin panel
  if (isAdmin) {
    redirect('/admin');
  }

  if (!merchant) {
    return <ConnectStoreForm />;
  }

  return (
    <div className="min-h-screen mesh-gradient">
      {/* Floating orbs for depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-chart-2/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-chart-3/3 blur-[100px]" />
      </div>

      {/* Desktop sidebar */}
      <Sidebar
        shopDomain={merchant.shopDomain}
        planId={merchant.planId}
        userName={user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : undefined}
        userImageUrl={user?.imageUrl}
        isAdmin={isAdmin}
      />

      {/* Main content */}
      <DashboardContent>
        <MobileNav shopDomain={merchant.shopDomain} />
        <Header />
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </DashboardContent>
    </div>
  );
}
