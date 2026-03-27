/**
 * apps/api/src/lib/storefrontTools.ts
 *
 * Step 4 — Shopify Storefront MCP Integration
 * ────────────────────────────────────────────
 * Shopify exposes a JSON-RPC 2.0 MCP server at each store's
 *   https://{shop}.myshopify.com/api/mcp
 *
 * The endpoint is stateless HTTP POST — no persistent SSE connection is
 * required.  Each `tools/call` request is independent.  We therefore wrap
 * the four Storefront MCP tools as Vercel AI SDK tools that call the HTTP
 * endpoint directly, avoiding the SSE handshake penalty on every message.
 *
 * Tools exposed by Shopify (used here):
 *   • search_shop_catalog           — live product search
 *   • search_shop_policies_and_faqs — shipping / return policy answers
 *   • get_cart                       — retrieve cart contents + checkout URL
 *   • update_cart                    — add / update / remove cart items
 *
 * Note: some stores may restrict access to their MCP endpoint.  All execute
 * functions handle errors gracefully and return plain-text fallback messages
 * so the LLM can always respond to the customer.
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

// ─── Core HTTP helper ─────────────────────────────────────────────────────────

const MCP_TIMEOUT_MS = 8_000;

async function callShopifyMCP(
  shopDomain: string,
  toolName:   string,
  args:       Record<string, unknown>,
): Promise<string> {
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

    // Collect all text content blocks
    const text = (data.result?.content ?? [])
      .filter((c): c is MCPTextContent => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim();

    return text || 'No results returned.';
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
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
          return await callShopifyMCP(shopDomain, 'search_shop_catalog', { query, context });
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
          return await callShopifyMCP(shopDomain, 'search_shop_policies_and_faqs', args);
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
          return await callShopifyMCP(shopDomain, 'get_cart', { cart_id });
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
          return await callShopifyMCP(shopDomain, 'update_cart', args);
        } catch {
          return 'Could not update the cart right now. Please try again.';
        }
      },
    }),

  };
}