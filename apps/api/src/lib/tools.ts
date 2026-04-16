/**
 * apps/api/src/lib/tools.ts
 *
 * Admin-side tools that require the merchant's encrypted OAuth token.
 * These cannot go through the public Storefront MCP server.
 *
 * get_order_status — GraphQL Admin API
 * ──────────────────────────────────────
 * Uses a two-step GraphQL approach:
 *   1. Search all orders by customer email
 *   2. Match the specific order name (#1033)
 *   3. If matched, fetch full order details
 *   4. If not matched, tell the customer the order doesn't belong to them
 *
 * This is more secure and uses the proper Shopify GraphQL API.
 */

import { tool }       from 'ai';
import { z }          from 'zod';
import type postgres  from 'postgres';
import { nanoid }     from 'nanoid';
import { AzureOpenAI } from 'openai';
import { decryptToken } from './shopify.js';
import { env }        from '../env.js';

// ─── Context ─────────────────────────────────────────────────────────────────

export interface AdminToolContext {
  tenantId:              string;   // "store_acme_shop"
  shopDomain:            string;   // "acme-shop.myshopify.com"
  /** Shared pgPool from db.ts — never call .end() on this */
  sql:                   ReturnType<typeof postgres>;
  encryptedShopifyToken: string | null;
}

// ─── GraphQL helpers ─────────────────────────────────────────────────────────

const GRAPHQL_API_VERSION = '2026-04';

/**
 * Execute a GraphQL query against the Shopify Admin API.
 */
async function shopifyGraphQL(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<any> {
  const res = await fetch(
    `https://${shopDomain}/admin/api/${GRAPHQL_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!res.ok) {
    throw new Error(`Shopify GraphQL HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json() as any;

  if (json.errors?.length > 0) {
    throw new Error(`Shopify GraphQL error: ${json.errors[0].message}`);
  }

  return json.data;
}

// ─── GraphQL Queries ─────────────────────────────────────────────────────────

/**
 * Step 1: Search orders by customer email.
 * Returns a list of order names so we can verify ownership.
 */
const ORDERS_BY_EMAIL_QUERY = `
  query GetOrdersByEmail($emailFilter: String!) {
    orders(first: 50, query: $emailFilter) {
      edges {
        node {
          id
          name
          email
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

/**
 * Step 2: Get full order details by order name.
 * Only called after we verify the email owns this order.
 */
const ORDER_DETAILS_QUERY = `
  query GetOrderDetails($nameFilter: String!) {
    orders(first: 1, query: $nameFilter) {
      edges {
        node {
          id
          name
          email
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 50) {
            edges {
              node {
                name
                title
                quantity
                sku
                variant {
                  id
                  title
                }
              }
            }
          }
          shippingAddress {
            name
            address1
            city
            province
            provinceCode
            zip
            country
          }
          fulfillments {
            status
            trackingInfo {
              number
              company
              url
            }
          }
        }
      }
    }
  }
`;

// ─── Azure OpenAI singleton (for query embeddings) ──────────────────────────

const openai = new AzureOpenAI({
  apiKey: env.AZURE_API_KEY,
  endpoint: `https://${env.AZURE_RESOURCE_NAME}.openai.azure.com`,
  apiVersion: '2024-10-21',
});
const EMBED_MODEL = 'text-embedding-3-small';

// ─── Knowledge search types ──────────────────────────────────────────────────

interface KnowledgeChunk {
  content: string;
  similarity: number;
  knowledge_source_id: string;
}

// ─── Tool factory ─────────────────────────────────────────────────────────────

export function createAdminTools(ctx: AdminToolContext) {
  const safeName = ctx.tenantId.replace('store_', '').replace(/[^a-z0-9_]/g, '_');

  return {

    // ── get_order_status ──────────────────────────────────────────────────
    // Two-step GraphQL approach:
    //   1. Fetch all orders by customer email → verify ownership
    //   2. If order name matches, fetch full details
    get_order_status: tool({
      description:
        'Look up a customer order by email and order number.  ' +
        'Use when the customer asks where their order is, for tracking info, ' +
        'or about any specific order.  ' +
        'IMPORTANT: Both order_identifier and customer_email are required. ' +
        'Ask the customer for both before calling this tool.',
      parameters: z.object({
        order_identifier: z
          .string()
          .describe('Order number (e.g. #1033 or 1033)'),
        customer_email: z
          .string()
          .email()
          .describe('Customer email address for identity verification — REQUIRED'),
      }),
      execute: async ({ order_identifier, customer_email }) => {
        if (!ctx.encryptedShopifyToken) {
          console.warn(`[get_order_status] No Shopify token for tenant ${ctx.tenantId} — order lookup not configured`);
          return { found: false, message: 'Order lookup is not configured for this store.' };
        }

        try {
          const accessToken = decryptToken(ctx.encryptedShopifyToken);
          const orderNumber = order_identifier.replace(/^#/, '').trim();
          const orderName   = `#${orderNumber}`;  // Shopify stores as "#1033"

          console.log(`[get_order_status] Looking up order ${orderName} for ${customer_email} on ${ctx.shopDomain}`);

          // ── Step 1: Search all orders by customer email ──────────────────
          const emailData = await shopifyGraphQL(
            ctx.shopDomain,
            accessToken,
            ORDERS_BY_EMAIL_QUERY,
            { emailFilter: `email:${customer_email}` },
          );

          const emailOrders = emailData?.orders?.edges ?? [];
          console.log(`[get_order_status] Step 1: found ${emailOrders.length} orders for email ${customer_email}`);

          if (emailOrders.length === 0) {
            return {
              found: false,
              message: `No orders found for email ${customer_email}. Please check the email address and try again.`,
            };
          }

          // ── Step 2: Check if the requested order belongs to this email ──
          const matchingOrder = emailOrders.find(
            (edge: any) => edge.node.name === orderName,
          );

          if (!matchingOrder) {
            // The email has orders, but not this specific order number
            const orderNames = emailOrders.map((e: any) => e.node.name).join(', ');
            console.log(`[get_order_status] Step 2: order ${orderName} not found among [${orderNames}]`);
            return {
              found: false,
              message:
                `Order ${orderName} does not belong to ${customer_email}. ` +
                `The orders associated with this email are: ${orderNames}. ` +
                `Please double-check your order number.`,
            };
          }

          // ── Step 3: Fetch full order details ────────────────────────────
          const detailData = await shopifyGraphQL(
            ctx.shopDomain,
            accessToken,
            ORDER_DETAILS_QUERY,
            { nameFilter: `name:${orderName}` },
          );

          const order = detailData?.orders?.edges?.[0]?.node;

          if (!order) {
            return { found: false, message: `Could not fetch details for order ${orderName}.` };
          }

          // Build line items for OrderCard
          const lineItems = (order.lineItems?.edges ?? []).map((edge: any) => {
            const item = edge.node;
            return {
              title:    item.title ?? 'Unknown',
              quantity: item.quantity ?? 1,
              ...(item.variant?.title && item.variant.title !== 'Default Title'
                ? { variant: { title: item.variant.title } }
                : {}),
            };
          });

          // Build shipping address
          const sa = order.shippingAddress;
          const shippingAddress = sa ? {
            name:     sa.name ?? '',
            address1: sa.address1 ?? '',
            city:     sa.city ?? '',
            province: sa.province ?? '',
            zip:      sa.zip ?? '',
            country:  sa.country ?? '',
          } : undefined;

          // Build tracking info from fulfillments (plain array, not a connection)
          const fulfillments     = order.fulfillments ?? [];
          const firstFulfillment = fulfillments[0];
          const trackingInfoArr  = firstFulfillment?.trackingInfo ?? [];
          const firstTracking    = trackingInfoArr[0];
          const trackingInfo = firstTracking?.number ? {
            number:  firstTracking.number,
            company: firstTracking.company ?? 'Unknown',
            ...(firstTracking.url ? { url: firstTracking.url } : {}),
          } : undefined;

          return {
            found:                    true,
            orderId:                  order.id,
            orderNumber:              order.name?.replace(/^#/, '') ?? orderNumber,
            displayFinancialStatus:   (order.displayFinancialStatus ?? 'PENDING').toLowerCase().replace(/_/g, ' '),
            displayFulfillmentStatus: (order.displayFulfillmentStatus ?? 'UNFULFILLED').toLowerCase().replace(/_/g, ' '),
            processedAt:              order.createdAt,
            lineItems,
            ...(shippingAddress ? { shippingAddress } : {}),
            ...(trackingInfo ? { trackingInfo } : {}),
            totalPrice: {
              amount:       order.totalPriceSet?.shopMoney?.amount ?? '0',
              currencyCode: order.totalPriceSet?.shopMoney?.currencyCode ?? 'USD',
            },
          };
        } catch (err) {
          console.error(`[get_order_status] Error for ${ctx.shopDomain}:`, (err as Error)?.message ?? err);
          return { found: false, message: `Unable to look up that order right now. ${(err as Error)?.message ?? ''}` };
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

    // ── search_knowledge ─────────────────────────────────────────────────
    // Vector similarity search over merchant-uploaded documents (RAG).
    search_knowledge: tool({
      description:
        'Search the merchant\'s uploaded knowledge base (policies, FAQs, guides, ' +
        'manuals) for information relevant to the customer\'s question. ' +
        'Use when the question is about store policies, shipping details, ' +
        'return procedures, warranty info, sizing guides, or any topic ' +
        'likely covered by merchant-uploaded documents. ' +
        'Do NOT use for product search (use search_catalog) or ' +
        'order status (use get_order_status).',
      parameters: z.object({
        query: z.string().describe('The customer question to search for in the knowledge base'),
      }),
      execute: async ({ query }) => {
        try {
          // 1 — Check if knowledge_sources exist (avoid embedding call if empty)
          const sourceCheck = await ctx.sql.unsafe(
            `SELECT 1 FROM "tenant_${safeName}"."knowledge_sources"
              WHERE status = 'ready' LIMIT 1`,
          );

          if (sourceCheck.length === 0) {
            return {
              found: false,
              message: 'No knowledge base documents have been uploaded for this store yet.',
              context: '',
            };
          }

          // 2 — Generate embedding for the query
          const embeddingRes = await openai.embeddings.create({
            model: EMBED_MODEL,
            input: query,
          });
          const queryEmbedding = embeddingRes.data[0].embedding;
          const embeddingStr = `[${queryEmbedding.join(',')}]`;

          // 3 — Cosine similarity search (pgvector <=> operator)
          const chunks: KnowledgeChunk[] = await ctx.sql.unsafe(
            `SELECT content, knowledge_source_id,
                    1 - (embedding <=> $1::vector) AS similarity
               FROM "tenant_${safeName}"."knowledge_chunks"
              ORDER BY embedding <=> $1::vector
              LIMIT 5`,
            [embeddingStr],
          ) as any[];

          if (chunks.length === 0) {
            return {
              found: false,
              message: 'No relevant information found in the knowledge base.',
              context: '',
            };
          }

          // 4 — Format results as a context block for the LLM
          const contextBlock = chunks
            .map((chunk, i) => {
              const pct = (chunk.similarity * 100).toFixed(1);
              return `[Source ${i + 1} — ${pct}% match]\n${chunk.content}`;
            })
            .join('\n\n---\n\n');

          return {
            found: true,
            message: `Found ${chunks.length} relevant knowledge base excerpts.`,
            context: contextBlock,
          };
        } catch (err) {
          return {
            found: false,
            message: `Knowledge base search failed. ${(err as Error)?.message ?? ''}`,
            context: '',
          };
        }
      },
    }),

  };
}
