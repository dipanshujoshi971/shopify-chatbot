// apps/dashboard/src/lib/admin.ts
// Super admin authentication — uses SUPER_ADMIN_CLERK_IDS env var
import { auth } from '@clerk/nextjs/server';

const SUPER_ADMIN_IDS = new Set(
  (process.env.SUPER_ADMIN_CLERK_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);

/** Returns the Clerk userId if the current user is a super admin, otherwise null */
export async function getSuperAdmin(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  if (!SUPER_ADMIN_IDS.has(userId)) return null;
  return userId;
}

/** Quick boolean check — for use in server components */
export async function isSuperAdmin(): Promise<boolean> {
  return (await getSuperAdmin()) !== null;
}
