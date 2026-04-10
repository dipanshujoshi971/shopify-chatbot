// apps/dashboard/src/lib/merchant.ts
import { auth } from '@clerk/nextjs/server';
import { db, pgPool } from './db';
import { merchants, eq } from '@chatbot/db';

export type Merchant = typeof merchants.$inferSelect;

/** Returns the merchant linked to the currently signed-in Clerk user */
export async function getMerchant(): Promise<Merchant | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const rows = await db
    .select()
    .from(merchants)
    .where(eq(merchants.clerkUserId, userId))
    .limit(1);

  return rows[0] ?? null;
}

/** Look up a merchant by shop domain (used during "connect store" flow) */
export async function getMerchantByDomain(
  shopDomain: string,
): Promise<Merchant | null> {
  const rows = await db
    .select()
    .from(merchants)
    .where(eq(merchants.shopDomain, shopDomain))
    .limit(1);

  return rows[0] ?? null;
}

/** Derive the safe tenant schema name from a merchant id */
export function safeName(merchantId: string): string {
  return merchantId.replace('store_', '').replace(/[^a-z0-9_]/g, '_');
}

/** Fetch agent config from tenant schema */
export async function getAgentConfig(merchantId: string) {
  const sn = safeName(merchantId);
  const rows = await pgPool.unsafe(
    `SELECT id, bot_name, tone, custom_instructions, use_emojis, updated_at
       FROM "tenant_${sn}"."agent_config"
      WHERE id = 'singleton'`,
  ) as {
    id: string;
    bot_name: string;
    tone: string;
    custom_instructions: string | null;
    use_emojis: boolean;
    updated_at: Date;
  }[];

  return rows[0] ?? {
    id: 'singleton',
    bot_name: 'Assistant',
    tone: 'friendly',
    custom_instructions: null,
    use_emojis: false,
    updated_at: new Date(),
  };
}