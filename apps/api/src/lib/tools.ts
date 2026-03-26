// Tool definitions for the Vercel AI SDK.
// Each tool gets the tenant context via closure — no globals, no shared state.
// Follows the same sql.unsafe() + explicit schema prefix pattern as webhooks.ts.

import { tool } from 'ai';
import { z } from 'zod';
import type postgres from 'postgres';
import { nanoid } from 'nanoid';
import { decryptToken } from './shopify.js';

export interface ToolContext {
  tenantId: string;                      // "store_acme_shop"
  shopDomain: string;                    // "acme-shop.myshopify.com"
  sql: ReturnType<typeof import('postgres').default>;
  encryptedShopifyToken: string | null;  // from merchants table
}

export function createTools(ctx: ToolContext) {
  // Derives the Postgres schema name — same derivation as everywhere else
  const safeName = ctx.tenantId.replace('store_', '').replace(/[^a-z0-9_]/g, '_');

  return {

    // ─────────────────────────────────────────────────────────────────────────
    // search_products
    // Phase 2: PostgreSQL ILIKE full-text search
    // Phase 3: Replace with pgvector semantic search (Voyage-3 embeddings)
    // ─────────────────────────────────────────────────────────────────────────
    search_products: tool({
      description:
        'Search the store catalog for products matching what the customer is looking for. ' +
        'Use this whenever a customer asks what you sell, wants a recommendation, ' +
        'or describes an item they need.',
      parameters: z.object({
        query: z.string().describe('What the customer is looking for'),
        in_stock_only: z
          .boolean()
          .optional()
          .default(false)
          .describe('Set to true to exclude out-of-stock items'),
        max_price: z
          .number()
          .optional()
          .describe('Maximum price filter in the store currency'),
      }),
      execute: async ({ query, in_stock_only, max_price }) => {
        try {
          const rows = await ctx.sql.unsafe(
            `SELECT shopify_product_id, title, price, image_url, in_stock
               FROM "tenant_${safeName}"."products"
              WHERE (title ILIKE $1 OR description ILIKE $1)
                AND ($2::boolean = false OR in_stock = true)
                AND ($3::text IS NULL OR price::numeric <= $3::numeric)
              ORDER BY in_stock DESC, updated_at DESC
              LIMIT 5`,
            [`%${query}%`, in_stock_only ?? false, max_price?.toString() ?? null],
          );

          if (rows.length === 0) {
            return { found: false, message: `No products matched "${query}".` };
          }

          return {
            found: true,
            products: (rows as any[]).map((r) => ({
              id:       r.shopify_product_id,
              title:    r.title,
              price:    r.price,
              imageUrl: r.image_url,
              inStock:  r.in_stock,
            })),
          };
        } catch (err) {
          return { found: false, message: 'Product search is unavailable right now.' };
        }
      },
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // get_order_status
    // Calls the Shopify Admin REST API with the merchant's decrypted token.
    // Never exposes order details without the correct store association.
    // ─────────────────────────────────────────────────────────────────────────
    get_order_status: tool({
      description:
        'Look up the status of a customer order by order number or order ID. ' +
        'Use this when a customer asks where their order is, for tracking info, ' +
        'or anything about a specific order.',
      parameters: z.object({
        order_identifier: z
          .string()
          .describe('The order number (e.g. #1001 or 1001) or numeric order ID'),
        customer_email: z
          .string()
          .email()
          .optional()
          .describe('Customer email address for identity verification'),
      }),
      execute: async ({ order_identifier, customer_email }) => {
        if (!ctx.encryptedShopifyToken) {
          return { found: false, message: 'Order lookup is not configured for this store.' };
        }

        try {
          const accessToken = decryptToken(ctx.encryptedShopifyToken);
          const identifier  = order_identifier.replace(/^#/, '');
          const apiVersion  = '2024-10';

          // Search by order name (customer-facing number) — most common input
          const url =
            `https://${ctx.shopDomain}/admin/api/${apiVersion}/orders.json` +
            `?name=%23${encodeURIComponent(identifier)}&status=any` +
            `&fields=id,name,financial_status,fulfillment_status,created_at,email,fulfillments`;

          const res = await fetch(url, {
            headers: { 'X-Shopify-Access-Token': accessToken },
          });

          if (!res.ok) {
            return { found: false, message: 'Could not reach the order system.' };
          }

          const data   = await res.json() as { orders: any[] };
          const order  = data.orders?.[0];

          if (!order) {
            return { found: false, message: `No order found with number #${identifier}.` };
          }

          // Optional email verification — prevents exposing orders to strangers
          if (
            customer_email &&
            order.email?.toLowerCase() !== customer_email.toLowerCase()
          ) {
            return {
              found: false,
              message: 'Order found but the email address does not match our records.',
            };
          }

          const fulfillment = order.fulfillments?.[0];

          return {
            found:             true,
            orderNumber:       order.name,
            financialStatus:   order.financial_status,
            fulfillmentStatus: order.fulfillment_status ?? 'unfulfilled',
            trackingNumber:    fulfillment?.tracking_number ?? null,
            trackingUrl:       fulfillment?.tracking_url ?? null,
            estimatedDelivery: fulfillment?.estimated_delivery ?? null,
            createdAt:         order.created_at,
          };
        } catch (err) {
          return { found: false, message: 'Unable to look up that order right now.' };
        }
      },
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // search_knowledge
    // Phase 2: Searches product descriptions as a basic knowledge source.
    // Phase 3: Replace this with pgvector RAG over embedded FAQ/policy docs.
    // ─────────────────────────────────────────────────────────────────────────
    search_knowledge: tool({
      description:
        'Search store knowledge for answers to policy questions, shipping info, ' +
        'return policies, and general FAQs. Use this for store questions that are ' +
        'not about a specific product or order.',
      parameters: z.object({
        query: z.string().describe('The customer question or topic to search'),
      }),
      execute: async ({ query }) => {
        try {
          const rows = await ctx.sql.unsafe(
            `SELECT title, description
               FROM "tenant_${safeName}"."products"
              WHERE description ILIKE $1
                AND description IS NOT NULL
              LIMIT 3`,
            [`%${query}%`],
          );

          if (rows.length === 0) {
            return {
              found:   false,
              message: 'No specific information found for that question.',
            };
          }

          return {
            found:   true,
            results: (rows as any[]).map((r) => ({
              title:   r.title,
              snippet: (r.description as string).slice(0, 400),
            })),
          };
        } catch {
          return { found: false, message: 'Knowledge search is unavailable right now.' };
        }
      },
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // collect_email
    // Last-resort escalation. Creates a support ticket in the tenant DB.
    // ─────────────────────────────────────────────────────────────────────────
    collect_email: tool({
      description:
        "Collect the customer's email and create a support ticket when you cannot " +
        'resolve the issue yourself. Use this as a last resort — only when the ' +
        'customer genuinely needs a human to follow up.',
      parameters: z.object({
        email:         z.string().email().describe('Customer email address'),
        issue_summary: z.string().describe("Brief summary of the customer's issue"),
      }),
      execute: async ({ email, issue_summary }) => {
        try {
          const ticketId = nanoid();
          await ctx.sql.unsafe(
            `INSERT INTO "tenant_${safeName}"."support_tickets"
               (id, customer_email, customer_message, status, created_at, updated_at)
             VALUES ($1, $2, $3, 'open', now(), now())`,
            [ticketId, email, issue_summary],
          );

          return {
            success:  true,
            ticketId,
            message:
              `Support ticket created. Our team will contact ${email} within 24 hours.`,
          };
        } catch {
          return {
            success: false,
            message: 'Could not create a support ticket. Please contact us directly.',
          };
        }
      },
    }),

  };
}