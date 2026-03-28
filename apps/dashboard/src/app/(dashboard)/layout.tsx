import { redirect } from 'next/navigation';
import { getMerchant } from '@/lib/merchant';
import { Sidebar, MobileNav } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { ConnectStoreForm } from '@/components/dashboard/connect-store-form';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const merchant = await getMerchant();

  // No store connected — show connection screen instead of redirecting
  if (!merchant) {
    return <ConnectStoreForm />;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <Sidebar shopDomain={merchant.shopDomain} planId={merchant.planId} />

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Mobile nav */}
        <MobileNav />

        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}