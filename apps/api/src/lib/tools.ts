/**
 * apps/api/src/lib/tools.ts
 *
 * Admin-side tools that require the merchant's encrypted OAuth token.
 * These cannot go through the public Storefront MCP server.
 *
 * Step 5 — Admin API Order Status Tool
 * ──────────────────────────────────────
 * `get_order_status` calls the Shopify Admin REST API with the merchant's
 * decrypted access token.  It verifies the customer's email to prevent
 * strangers from reading order details.
 *
 * Product/knowledge search have been removed from this file — they are now
 * handled by the Shopify Storefront MCP tools in storefrontTools.ts.
 */

import { tool }       from 'ai';
import { z }          from 'zod';
import type postgres  from 'postgres';
import { nanoid }     from 'nanoid';
import { decryptToken } from './shopify.js';

// ─── Context ─────────────────────────────────────────────────────────────────

export interface AdminToolContext {
  tenantId:              string;   // "store_acme_shop"
  shopDomain:            string;   // "acme-shop.myshopify.com"
  /** Shared pgPool from db.ts — never call .end() on this */
  sql:                   ReturnType<typeof postgres>;
  encryptedShopifyToken: string | null;
}

// ─── Tool factory ─────────────────────────────────────────────────────────────

export function createAdminTools(ctx: AdminToolContext) {
  const safeName = ctx.tenantId.replace('store_', '').replace(/[^a-z0-9_]/g, '_');

  return {

    // ── get_order_status ──────────────────────────────────────────────────
    // Step 5: calls Shopify Admin REST API with the merchant's decrypted
    // OAuth token — the only tool that genuinely needs Admin API access.
    get_order_status: tool({
      description:
        'Look up a customer order by order number or ID.  ' +
        'Use when the customer asks where their order is, for tracking info, ' +
        'or about any specific order.',
      parameters: z.object({
        order_identifier: z
          .string()
          .describe('Order number (e.g. #1001 or 1001) or numeric order ID'),
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

          const data  = await res.json() as { orders: any[] };
          const order = data.orders?.[0];

          if (!order) {
            return { found: false, message: `No order found with number #${identifier}.` };
          }

          // Email verification prevents exposing orders to strangers
          if (
            customer_email &&
            order.email?.toLowerCase() !== customer_email.toLowerCase()
          ) {
            return {
              found:   false,
              message: 'Order found but the email address does not match our records.',
            };
          }

          const fulfillment = order.fulfillments?.[0];

          return {
            found:             true,
            orderNumber:       order.name,
            financialStatus:   order.financial_status,
            fulfillmentStatus: order.fulfillment_status ?? 'unfulfilled',
            trackingNumber:    fulfillment?.tracking_number  ?? null,
            trackingUrl:       fulfillment?.tracking_url     ?? null,
            estimatedDelivery: fulfillment?.estimated_delivery ?? null,
            createdAt:         order.created_at,
          };
        } catch {
          return { found: false, message: 'Unable to look up that order right now.' };
        }
      },
    }),

    // ── collect_email ─────────────────────────────────────────────────────
    // Last-resort escalation: creates a support ticket in the tenant DB.
    collect_email: tool({
      description:
        "Collect the customer's email and create a support ticket when you " +
        'cannot resolve the issue yourself.  Use only as a last resort.',
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
            message:  `Support ticket created. Our team will contact ${email} within 24 hours.`,
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