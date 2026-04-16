import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getMerchant, getMerchantByDomain } from '@/lib/merchant';
import { isSuperAdmin } from '@/lib/admin';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Sidebar, MobileNav } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { ConnectStoreForm } from '@/components/dashboard/connect-store-form';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { db } from '@/lib/db';
import { merchants, eq } from '@chatbot/db';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let [merchant, user, isAdmin] = await Promise.all([getMerchant(), currentUser(), isSuperAdmin()]);

  // Super admin auto-redirect: send them straight to the admin panel
  if (isAdmin) {
    redirect('/admin');
  }

  // Auto-connect: if the merchant installed via Shopify OAuth, a pending_shop
  // cookie was set. Link their Clerk account to the merchant record automatically.
  // The cookie has a 10-minute TTL and is only read (not deleted) here because
  // Next.js doesn't allow cookie mutations inside Server Component layouts.
  if (!merchant) {
    const cookieStore = await cookies();
    const pendingShop = cookieStore.get('pending_shop')?.value;

    if (pendingShop) {
      const { userId } = await auth();
      if (userId) {
        const storeMerchant = await getMerchantByDomain(pendingShop);
        if (storeMerchant && (!storeMerchant.clerkUserId || storeMerchant.clerkUserId === userId)) {
          await db
            .update(merchants)
            .set({ clerkUserId: userId, updatedAt: new Date() })
            .where(eq(merchants.id, storeMerchant.id));

          // Redirect so the layout re-runs with the linked merchant
          redirect('/dashboard');
        }
      }
    }

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
