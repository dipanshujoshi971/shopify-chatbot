/**
 * packages/widget/src/lib/pageContext.ts
 *
 * Detects the current Shopify page context using:
 *   1. Shopify's meta tags and global objects
 *   2. URL path patterns
 *   3. Page DOM structure
 *
 * Returns a PageContext object the widget uses to generate
 * contextual starter questions.
 */

import type { PageContext } from '../types.js';

declare global {
  interface Window {
    ShopifyAnalytics?: {
      meta?: {
        page?: { pageType?: string };
        product?: { id?: number; type?: string; vendor?: string };
      };
    };
    meta?: { product?: { id: number; type: string } };
  }
}

/**
 * Detect what type of page the customer is currently on.
 */
export function detectPageContext(): PageContext {
  const path = window.location.pathname;

  // ── Product page ──────────────────────────────────────────────
  if (path.match(/\/products\/[\w-]+/)) {
    const handle = path.split('/products/')[1]?.split(/[?#/]/)[0];
    const ctx: PageContext = { type: 'product' };
    const title = getProductTitle();
    const price = getProductPrice();
    const vendor = getProductVendor();
    if (handle) ctx.handle = handle;
    if (title) ctx.title = title;
    if (price) ctx.price = price;
    if (vendor) ctx.vendor = vendor;
    return ctx;
  }

  // ── Collection page ───────────────────────────────────────────
  if (path.match(/\/collections\/[\w-]+/)) {
    const handle = path.split('/collections/')[1]?.split(/[?#/]/)[0];
    const title = getCollectionTitle();
    const ctx: PageContext = { type: 'collection' };
    if (handle) ctx.handle = handle;
    if (title) { ctx.title = title; ctx.collection = title; }
    return ctx;
  }

  // ── Cart page ─────────────────────────────────────────────────
  if (path === '/cart' || path.startsWith('/cart/')) {
    return { type: 'cart' };
  }

  // ── Search page ───────────────────────────────────────────────
  if (path === '/search' || path.startsWith('/search')) {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? params.get('query') ?? '';
    return { type: 'search', searchQuery: q };
  }

  // ── Home page ─────────────────────────────────────────────────
  if (path === '/' || path === '') {
    return { type: 'home' };
  }

  return { type: 'other' };
}

/**
 * Generate contextual starter questions based on page type.
 */
export function getContextualQuestions(ctx: PageContext): string[] {
  switch (ctx.type) {
    case 'product': {
      const questions: string[] = [];
      if (ctx.title) {
        questions.push(`Tell me more about ${ctx.title}`);
        questions.push(`Is ${ctx.title} in stock?`);
        questions.push(`What are the shipping options for ${ctx.title}?`);
      } else {
        questions.push('Tell me more about this product');
        questions.push('Is this product in stock?');
        questions.push('What are the shipping options?');
      }
      return questions;
    }

    case 'collection':
      return [
        ctx.collection
          ? `What are the best sellers in ${ctx.collection}?`
          : 'What are your best sellers here?',
        'Help me find something specific',
        'What\'s on sale in this collection?',
      ];

    case 'cart':
      return [
        'Do you have any discount codes?',
        'What are the shipping options?',
        'Can I change quantities in my cart?',
      ];

    case 'search':
      return [
        ctx.searchQuery
          ? `Help me find ${ctx.searchQuery}`
          : 'Help me find what I\'m looking for',
        'Show me your best sellers',
        'What\'s new in the store?',
      ];

    case 'home':
      return [
        'What are your best sellers?',
        'Help me find a product',
        'What\'s your return policy?',
      ];

    default:
      return [
        'Help me find a product',
        'Check my order status',
        'What\'s your return policy?',
      ];
  }
}

// ── DOM helpers ──────────────────────────────────────────────────────────

function getProductTitle(): string | undefined {
  // Try structured data first
  const ld = document.querySelector('script[type="application/ld+json"]');
  if (ld) {
    try {
      const data = JSON.parse(ld.textContent ?? '');
      if (data['@type'] === 'Product' && data.name) return data.name;
    } catch { /* ignore */ }
  }

  // Try meta tag
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) return ogTitle.getAttribute('content') ?? undefined;

  // Try h1
  const h1 = document.querySelector('h1');
  if (h1?.textContent?.trim()) return h1.textContent.trim();

  return undefined;
}

function getProductPrice(): string | undefined {
  const meta = document.querySelector('meta[property="product:price:amount"]');
  if (meta) {
    const currency = document.querySelector('meta[property="product:price:currency"]');
    const amount = meta.getAttribute('content');
    const code = currency?.getAttribute('content') ?? '';
    if (amount) return code ? `${code} ${amount}` : amount;
  }
  return undefined;
}

function getProductVendor(): string | undefined {
  const vendor = window.ShopifyAnalytics?.meta?.product?.vendor;
  if (vendor) return vendor;

  const meta = document.querySelector('meta[property="product:brand"]');
  return meta?.getAttribute('content') ?? undefined;
}

function getCollectionTitle(): string | undefined {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) return ogTitle.getAttribute('content') ?? undefined;

  const h1 = document.querySelector('h1');
  return h1?.textContent?.trim() ?? undefined;
}
