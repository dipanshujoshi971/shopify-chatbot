/**
 * apps/api/src/lib/storefrontTools.ts
 *
 * Step 4 — Shopify Storefront MCP Integration
 * ────────────────────────────────────────────
 * Shopify exposes a JSON-RPC 2.0 MCP server at each store's
 *   https://{shop}.myshopify.com/api/mcp
 *
 * The MCP returns JSON content blocks. For search_shop_catalog, we
 * intercept the raw JSON to extract structured product data for the
 * widget carousel BEFORE the LLM converts it to markdown text.
 */

import { tool } from 'ai';
import { z }    from 'zod';

// ─── MCP JSON-RPC types ───────────────────────────────────────────────────────

type MCPTextContent = { type: 'text'; text: string };
type MCPContent     = MCPTextContent | { type: string; [k: string]: unknown };

type MCPResponse = {
  jsonrpc: '2.0';
  id:      number;
  result?: {
    content:  MCPContent[];
    isError?: boolean;
  };
  error?: { code: number; message: string };
};

// ─── Core HTTP helpers ────────────────────────────────────────────────────────

const MCP_TIMEOUT_MS = 8_000;

/**
 * Call the Shopify MCP and return the raw content blocks.
 * This preserves the original JSON data before it gets flattened to text.
 */
async function callShopifyMCPRaw(
  shopDomain: string,
  toolName:   string,
  args:       Record<string, unknown>,
): Promise<MCPContent[]> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS);

  try {
    const res = await fetch(`https://${shopDomain}/api/mcp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id:      1,
        method:  'tools/call',
        params:  { name: toolName, arguments: args },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as MCPResponse;

    if (data.error) {
      throw new Error(`MCP error ${data.error.code}: ${data.error.message}`);
    }

    return data.result?.content ?? [];
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Extract text from MCP content blocks (for tools that just need text).
 */
function mcpContentToText(content: MCPContent[]): string {
  return content
    .filter((c): c is MCPTextContent => c.type === 'text')
    .map((c) => c.text)
    .join('\n')
    .trim() || 'No results returned.';
}

// ─── Product data extraction from MCP JSON text ────────────────────────────────

interface ParsedVariant {
  id: string;
  title: string;
  price?: { amount: string; currencyCode: string };
  availableForSale?: boolean;
}

interface ParsedProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  featuredImage?: { url: string; altText?: string };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  availableForSale: boolean;
  compareAtPriceRange?: { minVariantPrice: { amount: string; currencyCode: string } };
  variants?: ParsedVariant[];
}

/**
 * Try to extract structured product data from MCP text blocks.
 *
 * Shopify's MCP returns product data as JSON text blocks. We try to:
 *   1. JSON.parse each text block to find structured product data
 *   2. Look for common Shopify product JSON shapes
 *   3. Fall back to regex parsing of markdown-formatted product text
 */
function extractProducts(content: MCPContent[], shopDomain: string): ParsedProduct[] {
  const products: ParsedProduct[] = [];

  for (const block of content) {
    if (block.type !== 'text') continue;
    const text = (block as MCPTextContent).text;

    // Strategy 1: Try to JSON.parse the text block directly
    try {
      const parsed = JSON.parse(text);
      const extracted = extractFromJSON(parsed, shopDomain);
      if (extracted.length > 0) {
        products.push(...extracted);
        continue;
      }
    } catch {
      // Not JSON, try text parsing
    }

    // Strategy 2: Look for JSON embedded in the text (sometimes wrapped in markdown code blocks)
    const jsonMatches = text.match(/```(?:json)?\s*([\s\S]*?)```/g);
    if (jsonMatches) {
      for (const jsonBlock of jsonMatches) {
        const jsonStr = jsonBlock.replace(/```(?:json)?\s*/, '').replace(/```$/, '').trim();
        try {
          const parsed = JSON.parse(jsonStr);
          const extracted = extractFromJSON(parsed, shopDomain);
          products.push(...extracted);
        } catch { /* not valid JSON */ }
      }
      if (products.length > 0) continue;
    }

    // Strategy 3: Parse markdown text with URLs and prices
    const textProducts = parseProductsFromMarkdown(text, shopDomain);
    products.push(...textProducts);
  }

  // Deduplicate by handle
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p.handle)) return false;
    seen.add(p.handle);
    return true;
  });
}

/**
 * Extract products from a parsed JSON object.
 * Handles various Shopify JSON shapes: arrays of products, objects with products key, etc.
 */
function extractFromJSON(data: unknown, shopDomain: string): ParsedProduct[] {
  if (!data) return [];

  // If it's an array, check if items look like products
  if (Array.isArray(data)) {
    return data
      .map((item) => tryParseProduct(item, shopDomain))
      .filter((p): p is ParsedProduct => p !== null);
  }

  // If it's an object with a products/results/items/nodes key
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['products', 'results', 'items', 'nodes', 'edges', 'data', 'search', 'searchResults', 'collection']) {
      const target = obj[key];
      // Handle nested: e.g. { products: { nodes: [...] } }
      if (target && typeof target === 'object' && !Array.isArray(target)) {
        const nested = target as Record<string, unknown>;
        for (const nk of ['nodes', 'edges', 'items', 'products']) {
          if (Array.isArray(nested[nk])) {
            const items = nk === 'edges'
              ? (nested[nk] as any[]).map((e: any) => e.node).filter(Boolean)
              : nested[nk] as any[];
            const products = items
              .map((item: any) => tryParseProduct(item, shopDomain))
              .filter((p): p is ParsedProduct => p !== null);
            if (products.length > 0) return products;
          }
        }
      }
      if (Array.isArray(target)) {
        const items = key === 'edges'
          ? (target as any[]).map((e) => e.node).filter(Boolean)
          : target as any[];
        const products = items
          .map((item) => tryParseProduct(item, shopDomain))
          .filter((p): p is ParsedProduct => p !== null);
        if (products.length > 0) return products;
      }
    }
    // Maybe it's a single product
    const single = tryParseProduct(obj, shopDomain);
    if (single) return [single];
  }

  return [];
}

/**
 * Try to parse a single object as a Shopify product.
 */
function tryParseProduct(item: unknown, shopDomain: string): ParsedProduct | null {
  if (!item || typeof item !== 'object') return null;
  const obj = item as Record<string, any>;

  // Must have at least a title or handle
  const title = obj.title ?? obj.name ?? obj.product_title;
  const handle = obj.handle ?? obj.url_handle ??
    (typeof obj.url === 'string' ? obj.url.match(/\/products\/([\w-]+)/)?.[1] : null) ??
    (typeof obj.onlineStoreUrl === 'string' ? obj.onlineStoreUrl.match(/\/products\/([\w-]+)/)?.[1] : null);

  if (!title && !handle) return null;

  // Extract price — handle multiple formats:
  //   GraphQL: { priceRange: { minVariantPrice: { amount, currencyCode } } }
  //   MCP flat: { price_range: { min, max, currency } }
  //   Simple: { price: "1499.0" }
  let amount = '0';
  let currencyCode = 'USD';

  if (obj.priceRange?.minVariantPrice) {
    amount = String(obj.priceRange.minVariantPrice.amount ?? '0');
    currencyCode = obj.priceRange.minVariantPrice.currencyCode ?? 'USD';
  } else if (obj.price_range?.min != null) {
    // Shopify MCP flat format: { price_range: { min: "1499.0", max: "1499.0", currency: "USD" } }
    amount = String(obj.price_range.min);
    currencyCode = obj.price_range.currency ?? 'USD';
  } else if (obj.price != null) {
    amount = String(obj.price);
  } else if (obj.variants?.[0]?.price != null) {
    amount = String(obj.variants[0].price);
  }

  // Extract image — handle multiple formats:
  //   GraphQL: { featuredImage: { url, altText } }
  //   MCP flat: { image_url: "https://cdn.shopify.com/..." }
  //   Various: { image: { url }, images: [...], etc. }
  let featuredImage: { url: string; altText?: string } | undefined;
  if (typeof obj.image_url === 'string' && obj.image_url) {
    // Shopify MCP flat format
    featuredImage = { url: obj.image_url, altText: title };
  } else if (obj.featuredImage?.url) {
    featuredImage = { url: obj.featuredImage.url, altText: obj.featuredImage.altText };
  } else if (obj.featuredImage?.src) {
    featuredImage = { url: obj.featuredImage.src, altText: obj.featuredImage.altText };
  } else if (obj.image?.url) {
    featuredImage = { url: obj.image.url, altText: obj.image.altText };
  } else if (obj.image?.src) {
    featuredImage = { url: obj.image.src, altText: obj.image.alt };
  } else if (typeof obj.image === 'string' && obj.image) {
    featuredImage = { url: obj.image };
  } else if (obj.images?.[0]?.url) {
    featuredImage = { url: obj.images[0].url, altText: obj.images[0].altText };
  } else if (obj.images?.[0]?.src) {
    featuredImage = { url: obj.images[0].src, altText: obj.images[0].alt };
  } else if (typeof obj.images?.[0] === 'string' && obj.images[0]) {
    featuredImage = { url: obj.images[0] };
  } else if (obj.media?.nodes?.[0]?.image?.url) {
    featuredImage = { url: obj.media.nodes[0].image.url, altText: obj.media.nodes[0].image.altText };
  } else if (obj.media?.edges?.[0]?.node?.image?.url) {
    featuredImage = { url: obj.media.edges[0].node.image.url };
  } else if (obj.thumbnail?.url) {
    featuredImage = { url: obj.thumbnail.url };
  } else if (typeof obj.thumbnail === 'string' && obj.thumbnail) {
    featuredImage = { url: obj.thumbnail };
  }

  // Fallback: check variant image_url if product-level image missing
  if (!featuredImage && Array.isArray(obj.variants) && obj.variants[0]?.image_url) {
    featuredImage = { url: obj.variants[0].image_url, altText: title };
  }

  // Compare at price
  let compareAtPriceRange: ParsedProduct['compareAtPriceRange'] | undefined;
  if (obj.compareAtPriceRange?.minVariantPrice?.amount) {
    const cmpAmount = parseFloat(obj.compareAtPriceRange.minVariantPrice.amount);
    if (cmpAmount > parseFloat(amount)) {
      compareAtPriceRange = {
        minVariantPrice: {
          amount: String(cmpAmount),
          currencyCode: obj.compareAtPriceRange.minVariantPrice.currencyCode ?? currencyCode,
        },
      };
    }
  }

  // Extract variants (sizes, colors, etc.)
  // Handles both GraphQL format and MCP flat format:
  //   GraphQL: { id, title, price: { amount, currencyCode }, availableForSale }
  //   MCP flat: { variant_id, title, price: "1499.0", currency: "USD", available: true }
  const variants: ParsedVariant[] = [];
  if (Array.isArray(obj.variants)) {
    const variantItems = obj.variants.map((v: any) => v?.node ?? v).filter(Boolean);
    for (const v of variantItems) {
      if (!v || typeof v !== 'object') continue;
      const vTitle = v.title ?? v.name;
      const vId = v.id ?? v.variant_id ?? '';
      if (!vTitle && !vId) continue;
      const variant: ParsedVariant = {
        id: String(vId),
        title: String(vTitle ?? 'Default'),
      };
      // Extract variant price — multiple formats
      if (v.price?.amount) {
        variant.price = { amount: String(v.price.amount), currencyCode: v.price.currencyCode ?? currencyCode };
      } else if (v.priceV2?.amount) {
        variant.price = { amount: String(v.priceV2.amount), currencyCode: v.priceV2.currencyCode ?? currencyCode };
      } else if (typeof v.price === 'string' || typeof v.price === 'number') {
        // MCP flat format: price as string/number + currency as separate field
        variant.price = { amount: String(v.price), currencyCode: v.currency ?? currencyCode };
      }
      // Available — handle both formats
      if (v.availableForSale != null) {
        variant.availableForSale = Boolean(v.availableForSale);
      } else if (v.available != null) {
        variant.availableForSale = Boolean(v.available);
      }
      variants.push(variant);
    }
  } else if (Array.isArray(obj.edges)) {
    // GraphQL edges format for variants
    for (const edge of obj.edges) {
      const v = edge?.node;
      if (!v) continue;
      variants.push({
        id: String(v.id ?? ''),
        title: String(v.title ?? 'Default'),
        ...(v.price?.amount ? { price: { amount: String(v.price.amount), currencyCode: v.price.currencyCode ?? currencyCode } } : {}),
        ...(v.availableForSale != null ? { availableForSale: Boolean(v.availableForSale) } : {}),
      });
    }
  }

  const finalHandle = handle ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Determine availability — check product-level + variant-level
  let availableForSale = obj.availableForSale ?? obj.available ?? true;
  if (variants.length > 0 && availableForSale === true) {
    // If all variants are explicitly marked unavailable, product is unavailable
    const allUnavailable = variants.every((v) => v.availableForSale === false);
    if (allUnavailable) availableForSale = false;
  }

  return {
    id: obj.id ?? obj.product_id ?? `gid://shopify/Product/${finalHandle}`,
    title: title ?? finalHandle.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    handle: finalHandle,
    description: obj.description ?? obj.body_html ?? obj.descriptionHtml ?? '',
    ...(featuredImage ? { featuredImage } : {}),
    priceRange: { minVariantPrice: { amount, currencyCode } },
    availableForSale: Boolean(availableForSale),
    ...(compareAtPriceRange ? { compareAtPriceRange } : {}),
    ...(variants.length > 0 ? { variants } : {}),
  };
}

/**
 * Fallback: parse product data from markdown-formatted text.
 * Used when MCP returns pre-formatted text instead of JSON.
 */
function parseProductsFromMarkdown(text: string, shopDomain: string): ParsedProduct[] {
  const products: ParsedProduct[] = [];

  // Find product URLs
  const urlPattern = /(?:https?:\/\/[^/]+)?\/products\/([\w-]+)/g;
  const handles = new Set<string>();
  let match;
  while ((match = urlPattern.exec(text)) !== null) {
    handles.add(match[1]);
  }

  for (const handle of handles) {
    // Extract context around this handle
    const idx = text.indexOf(handle);
    const start = Math.max(0, idx - 400);
    const end = Math.min(text.length, idx + 400);
    const context = text.slice(start, end);

    // Title: look for markdown link text [Title](url) or **Title**
    const titlePattern = new RegExp(
      `\\[([^\\]]+)\\]\\([^)]*${handle}[^)]*\\)|\\*\\*([^*]+)\\*\\*`,
    );
    const titleMatch = titlePattern.exec(context);
    const title = titleMatch?.[1] || titleMatch?.[2] ||
      handle.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Price
    const priceMatch = context.match(/(?:Price|₹|\$|€|£)[:\s]*[₹$€£]?\s*([\d,]+(?:\.\d{2})?)/i);
    const amount = priceMatch?.[1]?.replace(/,/g, '') || '0';

    // Currency detection
    const currMatch = context.match(/(?:USD|INR|EUR|GBP|CAD|AUD|₹|\$|€|£)/i);
    let currencyCode = 'USD';
    if (currMatch) {
      const c = currMatch[0];
      if (c === '₹' || c.toUpperCase() === 'INR') currencyCode = 'INR';
      else if (c === '€' || c.toUpperCase() === 'EUR') currencyCode = 'EUR';
      else if (c === '£' || c.toUpperCase() === 'GBP') currencyCode = 'GBP';
    }

    // Image — match Shopify CDN and general image URLs
    const imgMatch = context.match(
      /!\[(?:[^\]]*)\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp|gif)[^)]*)\)|(https?:\/\/cdn\.shopify\.com\/[^\s"')]+)|(https?:\/\/[^\s"')]+\.(?:jpg|jpeg|png|webp|gif)[^\s"')]*)/i,
    );
    const imageUrl = imgMatch?.[1] || imgMatch?.[2] || imgMatch?.[3];

    const availableForSale = !/(?:sold\s*out|out\s*of\s*stock|unavailable)/i.test(context);

    products.push({
      id: `gid://shopify/Product/${handle}`,
      title,
      handle,
      description: '',
      ...(imageUrl ? { featuredImage: { url: imageUrl, altText: title } } : {}),
      priceRange: { minVariantPrice: { amount, currencyCode } },
      availableForSale,
    });
  }

  return products;
}

// ─── Cart data extraction from MCP JSON text ─────────────────────────────────

interface ParsedCartLine {
  title: string;
  quantity: number;
  variant?: string;
  image?: string;
  price?: { amount: string; currencyCode: string };
}

interface ParsedCartResult {
  cartId: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: ParsedCartLine[];
  cost?: {
    totalAmount: { amount: string; currencyCode: string };
  };
}

/**
 * Extract structured cart data from MCP text content blocks.
 * Shopify MCP returns cart data as JSON inside text blocks.
 */
function extractCartResult(content: MCPContent[]): ParsedCartResult | null {
  for (const block of content) {
    if (block.type !== 'text') continue;
    const text = (block as MCPTextContent).text;

    try {
      const parsed = JSON.parse(text);
      const cart = parsed?.cart ?? parsed;

      // Must have a cart ID to be a valid cart response
      const cartId = cart?.id ?? cart?.cartId;
      if (!cartId) continue;

      const checkoutUrl = cart.checkout_url ?? cart.checkoutUrl ?? '';
      const totalQuantity = cart.total_quantity ?? cart.totalQuantity ?? 0;

      // Parse line items
      const lines: ParsedCartLine[] = [];
      const rawLines = cart.lines?.edges ?? cart.lines?.nodes ?? cart.lines ?? [];
      const lineItems = Array.isArray(rawLines) ? rawLines : [];

      for (const rawLine of lineItems) {
        const line = rawLine?.node ?? rawLine;
        if (!line) continue;

        const merchandise = line.merchandise ?? {};
        const title = merchandise.product?.title ?? merchandise.title ?? line.title ?? 'Unknown';
        const variant = merchandise.title ?? line.variant ?? undefined;
        const image = merchandise.image?.url ?? merchandise.product?.featuredImage?.url ?? line.image ?? undefined;
        const quantity = line.quantity ?? 1;

        let price: { amount: string; currencyCode: string } | undefined;
        const costPerItem = line.cost?.totalAmount ?? line.cost?.amountPerQuantity ?? line.price;
        if (costPerItem?.amount) {
          price = { amount: String(costPerItem.amount), currencyCode: costPerItem.currencyCode ?? 'USD' };
        }

        lines.push({ title, quantity, ...(variant ? { variant } : {}), ...(image ? { image } : {}), ...(price ? { price } : {}) });
      }

      // Parse cost
      let cost: ParsedCartResult['cost'] | undefined;
      const totalAmount = cart.cost?.total_amount ?? cart.cost?.totalAmount;
      if (totalAmount?.amount) {
        cost = { totalAmount: { amount: String(totalAmount.amount), currencyCode: totalAmount.currency ?? totalAmount.currencyCode ?? 'USD' } };
      }

      return { cartId, checkoutUrl, totalQuantity, lines, ...(cost ? { cost } : {}) };
    } catch {
      // Not JSON, try next block
    }
  }
  return null;
}

// ─── Tool factory ─────────────────────────────────────────────────────────────

/**
 * Returns Vercel AI SDK tools that proxy Shopify's Storefront MCP server.
 *
 * @param shopDomain  e.g. "acme-shop.myshopify.com"
 */
export function createStorefrontMCPTools(shopDomain: string) {
  return {

    // ── search_shop_catalog ───────────────────────────────────────────────
    search_shop_catalog: tool({
      description:
        'Search the live Shopify store catalog for products.  ' +
        'Use whenever a customer asks what you sell, wants a recommendation, ' +
        'or describes an item they need.  Returns product names, prices, ' +
        'variant IDs, URLs, and images directly from Shopify.',
      parameters: z.object({
        query: z
          .string()
          .describe('What the customer is looking for'),
        context: z
          .string()
          .describe(
            'Extra context to tailor results, e.g. "customer prefers fair trade" ' +
            'or "customer is on the winter coats page"',
          ),
      }),
      execute: async ({ query, context }) => {
        try {
          // Get RAW MCP content blocks — preserves JSON before LLM flattens it
          const rawContent = await callShopifyMCPRaw(shopDomain, 'search_shop_catalog', { query, context });

          // Extract structured product data from the raw JSON
          const products = extractProducts(rawContent, shopDomain);

          // Also get the text for the LLM to use in its response
          const text = mcpContentToText(rawContent);

          if (products.length > 0) {
            return {
              __shopbot_products: products,
              __shopbot_query: query,
              text,
            };
          }

          return text;
        } catch (err) {
          return `Product search is temporarily unavailable. Please try again shortly. (${(err as Error).message})`;
        }
      },
    }),

    // ── search_shop_policies_and_faqs ─────────────────────────────────────
    search_shop_policies_and_faqs: tool({
      description:
        "Answer questions about this store's policies, shipping, returns, " +
        'warranty, and FAQs.  Use for any store question that is NOT about ' +
        'a specific product or order.',
      parameters: z.object({
        query: z
          .string()
          .describe('The customer question or topic to look up'),
        context: z
          .string()
          .optional()
          .describe('Current page or product context, if relevant'),
      }),
      execute: async ({ query, context }) => {
        try {
          const args: Record<string, unknown> = { query };
          if (context) args.context = context;
          const rawContent = await callShopifyMCPRaw(shopDomain, 'search_shop_policies_and_faqs', args);
          return mcpContentToText(rawContent);
        } catch {
          return 'Policy information is temporarily unavailable. Please check the store website.';
        }
      },
    }),

    // ── get_cart ──────────────────────────────────────────────────────────
    get_cart: tool({
      description:
        'Retrieve the current contents of a shopping cart, including item ' +
        'details, quantities, prices, and the checkout URL.  ' +
        'Use when a customer asks what is in their cart.',
      parameters: z.object({
        cart_id: z
          .string()
          .describe('The cart GID, e.g. "gid://shopify/Cart/abc123def456"'),
      }),
      execute: async ({ cart_id }) => {
        try {
          const rawContent = await callShopifyMCPRaw(shopDomain, 'get_cart', { cart_id });
          const cartResult = extractCartResult(rawContent);
          if (cartResult) {
            return { __shopbot_cart: cartResult, text: mcpContentToText(rawContent) };
          }
          return mcpContentToText(rawContent);
        } catch {
          return 'Could not retrieve the cart right now. Please try again.';
        }
      },
    }),

    // ── update_cart ───────────────────────────────────────────────────────
    update_cart: tool({
      description:
        'Add items to a cart, update quantities, or remove items (quantity = 0).  ' +
        'Creates a new cart if no cart_id is provided.  ' +
        'Use the merchandise_id (variant GID) from search_shop_catalog results.  ' +
        'Always confirm the correct product variant with the customer before adding.',
      parameters: z.object({
        cart_id: z
          .string()
          .optional()
          .describe('Existing cart GID — omit to create a brand-new cart'),
        add_items: z
          .array(
            z.object({
              merchandise_id: z
                .string()
                .describe('Product variant GID from catalog search results'),
              quantity: z
                .number()
                .int()
                .min(0)
                .describe('New quantity (0 removes the item from the cart)'),
              line_item_id: z
                .string()
                .optional()
                .describe('Cart line GID for updating an existing item'),
            }),
          )
          .describe('Items to add or update in the cart'),
      }),
      execute: async ({ cart_id, add_items }) => {
        try {
          const args: Record<string, unknown> = { add_items };
          if (cart_id) args.cart_id = cart_id;
          const rawContent = await callShopifyMCPRaw(shopDomain, 'update_cart', args);
          const cartResult = extractCartResult(rawContent);
          if (cartResult) {
            return { __shopbot_cart: cartResult, text: mcpContentToText(rawContent) };
          }
          return mcpContentToText(rawContent);
        } catch {
          return 'Could not update the cart right now. Please try again.';
        }
      },
    }),

  };
}
