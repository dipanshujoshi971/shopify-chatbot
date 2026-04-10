import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getSuperAdmin } from '@/lib/admin';
import { AdminSidebar, AdminMobileNav } from '@/components/admin/admin-sidebar';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminId, user] = await Promise.all([getSuperAdmin(), currentUser()]);

  if (!adminId) {
    redirect('/');
  }

  return (
    <div className="min-h-screen mesh-gradient">
      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-red-500/5 blur-[120px]" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/3 blur-[100px]" />
      </div>

      <AdminSidebar
        userName={user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : undefined}
        userImageUrl={user?.imageUrl}
      />

      <DashboardContent>
        <AdminMobileNav />
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </DashboardContent>
    </div>
  );
}
