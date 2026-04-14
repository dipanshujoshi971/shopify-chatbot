/**
 * packages/widget/src/types.ts
 *
 * All shared types for the Shopbot widget.
 * No runtime cost — TypeScript only.
 */

// ------------------------------------------------------------------ //
// Widget Config (read from <script> data-attributes + API config)
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

/** Remote config loaded from GET /widget/config */
export interface RemoteConfig {
  botName         : string;
  tone            : string;
  useEmojis       : boolean;
  greeting        : string;
  themeColor      : string;
  position        : 'right' | 'left';
  mode            : 'light' | 'dark';
  starterButtons  : string[];
  customInstructions?: string | null;
}

// ------------------------------------------------------------------ //
// Page Context (for context-aware suggestions)
// ------------------------------------------------------------------ //

export interface PageContext {
  type: 'product' | 'collection' | 'cart' | 'home' | 'search' | 'other';
  title?: string;
  handle?: string;
  price?: string;
  vendor?: string;
  collection?: string;
  searchQuery?: string;
}

// ------------------------------------------------------------------ //
// Chat API Response (consistent JSON from POST /widget/chat)
// ------------------------------------------------------------------ //

/**
 * Every response from the chat endpoint has this exact shape.
 * - text: LLM's text response (may be empty if products/cart are the response)
 * - products: array of products from search (empty array if none)
 * - cart: cart data if a cart operation was performed (null if none)
 * - order: order status data if an order lookup was performed (null if none)
 * - conversationId: the conversation ID to use for follow-up messages
 */
export interface ChatApiResponse {
  text           : string;
  products       : ShopifyProduct[];
  cart           : CartResult | null;
  order          : OrderStatusResult | null;
  conversationId : string;
}

// Keep legacy types for backward compatibility with annotations
export type AnnotationEvent =
  | ProductResultAnnotation
  | OrderResultAnnotation
  | CartResultAnnotation;

export interface ProductResultAnnotation {
  type      : 'tool_result';
  toolName  : 'search_catalog';
  toolCallId: string;
  result    : ProductSearchResult;
}

export interface OrderResultAnnotation {
  type      : 'tool_result';
  toolName  : 'get_order_status';
  toolCallId: string;
  result    : OrderStatusResult;
}

export interface CartResultAnnotation {
  type      : 'tool_result';
  toolName  : 'get_cart' | 'update_cart';
  toolCallId: string;
  result    : CartResult;
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
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id    : string;
  title : string;
  price?: { amount: string; currencyCode: string };
  availableForSale?: boolean;
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

export interface CartResult {
  cartId       : string;
  checkoutUrl  : string;
  totalQuantity: number;
  lines        : CartLine[];
  cost?: {
    totalAmount: { amount: string; currencyCode: string };
  };
}

export interface CartLine {
  title   : string;
  quantity: number;
  variant ?: string;
  image   ?: string;
  price   ?: { amount: string; currencyCode: string };
}

// ------------------------------------------------------------------ //
// Chat Message (internal state)
// ------------------------------------------------------------------ //

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id        : string;
  role      : MessageRole;
  content   : string;
  /** Products from search_catalog (empty array if none) */
  products  ?: ShopifyProduct[] | undefined;
  /** Cart data from get_cart / update_cart */
  cart      ?: CartResult | null | undefined;
  /** Order data from get_order_status */
  order     ?: OrderStatusResult | null | undefined;
  timestamp : number;
  /** True while waiting for the API response */
  loading   ?: boolean;
  /** If true, user message is hidden (used for internal actions like add-to-cart) */
  hidden    ?: boolean;
  /** Friendly label shown during loading instead of content (e.g. "Adding to cart...") */
  loadingLabel ?: string;
}

// ------------------------------------------------------------------ //
// Consent
// ------------------------------------------------------------------ //

export type ConsentStatus = 'granted' | 'denied' | 'unknown';
