import { redirect } from 'next/navigation';
import { getMerchant } from '@/lib/merchant';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { ConnectStoreForm } from '@/components/dashboard/connect-store-form';

export default async function DashboardLayout({ children }) {
  const merchant = await getMerchant();
  if (!merchant) return <ConnectStoreForm />;
  return (
    <DashboardShell shopDomain={merchant.shopDomain} planId={merchant.planId}>
      {children}
    </DashboardShell>
  );
}