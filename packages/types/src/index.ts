// ─── Tenant / Merchant ────────────────────────────────────────────────────────

export type TenantStatus = 'active' | 'frozen' | 'deleted';

export type PlanId = 'starter' | 'growth' | 'pro' | 'enterprise';

export interface Tenant {
  id: string;                    // store_{shopify_store_id}
  shopDomain: string;            // e.g. my-store.myshopify.com
  status: TenantStatus;
  planId: PlanId;
  clerkOrgId: string;
  stripeCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface PlanFeatures {
  planId: PlanId;
  conversationLimit: number;     // -1 = unlimited
  knowledgeSourceLimit: number;  // -1 = unlimited
  hasProactiveMessages: boolean;
  hasPlayground: boolean;
  hasAnalytics: boolean;
}