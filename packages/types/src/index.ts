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

// ─── Conversations & Messages ─────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'tool';

export type ConversationStatus = 'active' | 'resolved' | 'escalated';

export interface Conversation {
  id: string;
  tenantId: string;
  sessionId: string;
  status: ConversationStatus;
  totalTokensUsed: number;
  totalTurns: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: MessageContent;
  createdAt: Date;
}

// A message can contain different types of content
export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'product_carousel'; products: ProductCard[] }
  | { type: 'order_status'; order: OrderStatusCard };

export interface ProductCard {
  shopifyProductId: string;
  title: string;
  price: string;
  imageUrl: string;
}

export interface OrderStatusCard {
  orderId: string;
  orderNumber: string;
  status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  trackingNumber?: string;
  estimatedDelivery?: string;
}