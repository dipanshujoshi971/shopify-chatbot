/**
 * packages/widget/src/types.ts
 *
 * All shared types for the Shopbot widget.
 * No runtime cost — TypeScript only.
 */

// ------------------------------------------------------------------ //
// Widget Config (read from <script> data-attributes)
// ------------------------------------------------------------------ //

export interface WidgetConfig {
  /** Publishable API key — pk_live_xxx or pk_test_xxx */
  apiKey      : string;
  /** Full Shopify domain e.g. mystore.myshopify.com */
  shopDomain  : string;
  /** Base URL of the Fastify API (default: inferred from script src) */
  apiBaseUrl  : string;
  /** Override widget title */
  title       ?: string;
  /** Override brand accent color (CSS color value) */
  accentColor ?: string;
  /** Override launcher position: 'right' | 'left' */
  position    ?: 'right' | 'left';
}

// ------------------------------------------------------------------ //
// Stream Events (parsed from Vercel AI SDK data stream)
// ------------------------------------------------------------------ //

export type StreamEvent =
  | { type: 'text';        content: string }
  | { type: 'data';        content: AnnotationEvent[] }
  | { type: 'error';       content: string }
  | { type: 'finish';      content: { finishReason: string; usage?: TokenUsage } };

export interface TokenUsage {
  promptTokens    : number;
  completionTokens: number;
}

// ------------------------------------------------------------------ //
// StreamData Annotations (sent via `2:` lines)
// ------------------------------------------------------------------ //

export type AnnotationEvent =
  | ProductResultAnnotation
  | OrderResultAnnotation;

export interface ProductResultAnnotation {
  type      : 'tool_result';
  toolName  : 'search_shop_catalog';
  toolCallId: string;
  result    : ProductSearchResult;
}

export interface OrderResultAnnotation {
  type      : 'tool_result';
  toolName  : 'get_order_status';
  toolCallId: string;
  result    : OrderStatusResult;
}

// ------------------------------------------------------------------ //
// Rich UI Data Shapes (from Shopify APIs via MCP)
// ------------------------------------------------------------------ //

export interface ProductSearchResult {
  products: ShopifyProduct[];
  query   : string;
}

export interface ShopifyProduct {
  id          : string;
  title       : string;
  handle      : string;
  description : string;
  featuredImage?: { url: string; altText?: string };
  priceRange  : {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  availableForSale: boolean;
  compareAtPriceRange?: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
}

export interface OrderStatusResult {
  orderId         : string;
  orderNumber     : string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  processedAt     : string;
  lineItems       : OrderLineItem[];
  shippingAddress?: ShippingAddress;
  trackingInfo?   : TrackingInfo;
  totalPrice      : { amount: string; currencyCode: string };
}

export interface OrderLineItem {
  title   : string;
  quantity: number;
  variant ?: { title: string };
}

export interface ShippingAddress {
  name    : string;
  address1: string;
  city    : string;
  province: string;
  zip     : string;
  country : string;
}

export interface TrackingInfo {
  number : string;
  company: string;
  url    ?: string;
}

// ------------------------------------------------------------------ //
// Chat Message (internal state)
// ------------------------------------------------------------------ //

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id        : string;
  role      : MessageRole;
  content   : string;
  /** Rich UI data attached to this message (product carousel / order card) */
  annotation?: AnnotationEvent;
  timestamp : number;
  streaming ?: boolean;
}

// ------------------------------------------------------------------ //
// Consent
// ------------------------------------------------------------------ //

export type ConsentStatus = 'granted' | 'denied' | 'unknown';