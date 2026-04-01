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
      <Sidebar shopDomain={merchant.shopDomain} planId={merchant.planId} />

      {/* Main content */}
      <div className="lg:pl-[260px] relative z-10">
        {/* Mobile nav */}
        <MobileNav />

        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
