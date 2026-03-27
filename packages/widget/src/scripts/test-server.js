#!/usr/bin/env node
/**
 * packages/widget/scripts/test-server.js
 *
 * Lightweight HTTP test server for end-to-end widget development.
 *
 * What it provides:
 *   GET  /          → mock Shopify storefront HTML with the widget embedded
 *   POST /widget/chat → mock streaming chat API (no real LLM needed)
 *
 * Usage:
 *   1. Build the widget:   pnpm --filter @shopbot/widget build
 *   2. Run this server:    node packages/widget/scripts/test-server.js
 *   3. Open:               http://localhost:4000
 *
 * Environment:
 *   TEST_PORT        default 4000
 *   MOCK_PRODUCTS    set to '1' to include mock product carousel in responses
 *   MOCK_ORDER       set to '1' to include mock order card in responses
 */

import http    from 'node:http';
import fs      from 'node:fs';
import path    from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT      = parseInt(process.env.TEST_PORT ?? '4000', 10);
const DIST_DIR  = path.resolve(__dirname, '../dist');

// ------------------------------------------------------------------ //
// Mock data
// ------------------------------------------------------------------ //

const MOCK_PRODUCTS = {
  query   : 'test products',
  products: [
    {
      id             : 'gid://shopify/Product/1',
      title          : 'Merino Wool Sweater',
      handle         : 'merino-wool-sweater',
      description    : 'Premium merino wool, extra soft.',
      featuredImage  : { url: 'https://placehold.co/300x300/059669/fff?text=Sweater', altText: 'Sweater' },
      priceRange     : { minVariantPrice: { amount: '89.99', currencyCode: 'USD' } },
      compareAtPriceRange: { minVariantPrice: { amount: '120.00', currencyCode: 'USD' } },
      availableForSale: true,
    },
    {
      id             : 'gid://shopify/Product/2',
      title          : 'Linen Trousers',
      handle         : 'linen-trousers',
      description    : 'Breathable summer trousers.',
      featuredImage  : { url: 'https://placehold.co/300x300/047857/fff?text=Trousers', altText: 'Trousers' },
      priceRange     : { minVariantPrice: { amount: '64.99', currencyCode: 'USD' } },
      availableForSale: true,
    },
    {
      id             : 'gid://shopify/Product/3',
      title          : 'Canvas Tote Bag',
      handle         : 'canvas-tote',
      description    : 'Durable cotton canvas bag.',
      featuredImage  : { url: 'https://placehold.co/300x300/065f46/fff?text=Tote', altText: 'Tote' },
      priceRange     : { minVariantPrice: { amount: '29.00', currencyCode: 'USD' } },
      availableForSale: false,
    },
  ],
};

const MOCK_ORDER = {
  orderId                 : 'gid://shopify/Order/1001',
  orderNumber             : '1001',
  displayFinancialStatus  : 'PAID',
  displayFulfillmentStatus: 'PARTIALLY_FULFILLED',
  processedAt             : new Date(Date.now() - 86_400_000 * 3).toISOString(),
  lineItems: [
    { title: 'Merino Wool Sweater', quantity: 1, variant: { title: 'Medium / Forest Green' } },
    { title: 'Canvas Tote Bag',     quantity: 2, variant: { title: 'Default Title' } },
  ],
  shippingAddress: { name: 'Jane Doe', address1: '123 Main St', city: 'Portland', province: 'OR', zip: '97201', country: 'US' },
  trackingInfo  : { number: '1Z999AA1012345678', company: 'UPS', url: 'https://www.ups.com/track?tracknum=1Z999AA1012345678' },
  totalPrice    : { amount: '148.98', currencyCode: 'USD' },
};

// ------------------------------------------------------------------ //
// Stream helpers
// ------------------------------------------------------------------ //

/**
 * Simulate the Vercel AI SDK data stream format.
 * Prefix reference:
 *   0: text delta
 *   2: StreamData annotations
 *   d: finish
 */
function encode(prefix, data) {
  return `${prefix}:${JSON.stringify(data)}\n`;
}

async function* mockStream(message) {
  const lower = message.toLowerCase();

  // ── Product carousel response ────────────────────────────────────
  if (
    lower.includes('product') ||
    lower.includes('sweater') ||
    lower.includes('show me') ||
    process.env.MOCK_PRODUCTS === '1'
  ) {
    yield encode('0', "Here are some products I found that might interest you:");

    // Simulate tool execution delay
    await delay(400);

    // Emit tool result annotation
    yield encode('2', [{
      type      : 'tool_result',
      toolName  : 'search_shop_catalog',
      toolCallId: 'tc_mock_1',
      result    : MOCK_PRODUCTS,
    }]);

    yield encode('0', " Feel free to click any product to view it on the store!");
    yield encode('d', { finishReason: 'stop', usage: { promptTokens: 80, completionTokens: 40 } });
    return;
  }

  // ── Order status response ────────────────────────────────────────
  if (
    lower.includes('order') ||
    lower.includes('track') ||
    lower.includes('delivery') ||
    process.env.MOCK_ORDER === '1'
  ) {
    yield encode('0', "I found your order. Here's the current status:");

    await delay(300);

    yield encode('2', [{
      type      : 'tool_result',
      toolName  : 'get_order_status',
      toolCallId: 'tc_mock_2',
      result    : MOCK_ORDER,
    }]);

    yield encode('0', " Your UPS tracking link is clickable in the card above.");
    yield encode('d', { finishReason: 'stop', usage: { promptTokens: 60, completionTokens: 30 } });
    return;
  }

  // ── Generic streamed text response ───────────────────────────────
  const words = [
    "Thanks", " for", " reaching", " out!", " I'm", " the", " AI",
    " assistant", " for", " this", " store.", " I", " can", " help",
    " you", " find", " products,", " check", " order", " status,",
    " and", " answer", " questions", " about", " our", " policies.",
    " What", " would", " you", " like", " to", " know?",
  ];

  for (const word of words) {
    yield encode('0', word);
    await delay(40);
  }

  yield encode('d', { finishReason: 'stop', usage: { promptTokens: 50, completionTokens: 32 } });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ------------------------------------------------------------------ //
// HTTP server
// ------------------------------------------------------------------ //

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ── CORS (dev only) ─────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, X-Shop-Domain');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── Serve widget bundle ─────────────────────────────────────────
  if (url.pathname === '/widget.iife.js') {
    const filePath = path.join(DIST_DIR, 'widget.iife.js');
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Widget not built yet. Run: pnpm --filter @shopbot/widget build');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // ── Mock chat endpoint ──────────────────────────────────────────
  if (url.pathname === '/widget/chat' && req.method === 'POST') {
    // Validate API key (mock — any pk_ key passes)
    const apiKey = req.headers['x-api-key'] ?? '';
    if (!apiKey.startsWith('pk_')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid_api_key', message: 'API key must start with pk_' }));
      return;
    }

    // Parse body
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { reject(new Error('invalid json')); }
      });
    });

    // Stream response
    res.writeHead(200, {
      'Content-Type'     : 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Conversation-Id': body.conversationId ?? 'mock-conv-1',
      'X-LLM-Provider'   : 'mock',
      'X-LLM-Model'      : 'mock-stream-v1',
      'Cache-Control'    : 'no-cache',
    });

    for await (const chunk of mockStream(body.message ?? '')) {
      res.write(chunk);
    }
    res.end();
    return;
  }

  // ── Mock storefront HTML ────────────────────────────────────────
  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mock Shopify Store — Widget Test</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      min-height: 100vh;
    }
    .store-header {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .store-logo { font-size: 20px; font-weight: 700; color: #059669; }
    .store-nav  { display: flex; gap: 24px; font-size: 14px; color: #64748b; }
    .store-hero {
      padding: 80px 24px;
      text-align: center;
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%);
    }
    .store-hero h1  { font-size: 42px; font-weight: 800; color: #065f46; margin-bottom: 12px; }
    .store-hero p   { font-size: 18px; color: #047857; margin-bottom: 32px; }
    .hero-btn {
      display: inline-block;
      padding: 14px 32px;
      background: #059669;
      color: #fff;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
    }
    .products { padding: 48px 24px; max-width: 1000px; margin: 0 auto; }
    .products h2 { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }
    .product-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      transition: box-shadow .2s;
    }
    .product-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.08); }
    .product-img { width: 100%; aspect-ratio: 1; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 48px; }
    .product-body { padding: 12px; }
    .product-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .product-price { color: #059669; font-weight: 700; font-size: 15px; }
    .test-controls {
      position: fixed;
      top: 70px;
      left: 16px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      font-size: 12px;
      color: #64748b;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
      z-index: 9999;
      max-width: 200px;
    }
    .test-controls h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin-bottom: 8px; }
    .test-hint { margin-bottom: 6px; line-height: 1.4; }
    .test-hint code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 11px; }
  </style>
</head>
<body>

  <header class="store-header">
    <div class="store-logo">🌿 Verdant Store</div>
    <nav class="store-nav">
      <span>Collections</span>
      <span>About</span>
      <span>Contact</span>
    </nav>
  </header>

  <section class="store-hero">
    <h1>Sustainable Fashion</h1>
    <p>Ethically sourced, beautifully crafted clothing</p>
    <a href="#" class="hero-btn">Shop Now</a>
  </section>

  <section class="products">
    <h2>Featured Products</h2>
    <div class="product-grid">
      <div class="product-card">
        <div class="product-img">🧥</div>
        <div class="product-body">
          <p class="product-name">Merino Wool Sweater</p>
          <p class="product-price">$89.99</p>
        </div>
      </div>
      <div class="product-card">
        <div class="product-img">👖</div>
        <div class="product-body">
          <p class="product-name">Linen Trousers</p>
          <p class="product-price">$64.99</p>
        </div>
      </div>
      <div class="product-card">
        <div class="product-img">👜</div>
        <div class="product-body">
          <p class="product-name">Canvas Tote Bag</p>
          <p class="product-price">$29.00</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Test control panel (dev only) ───────────────────────────── -->
  <div class="test-controls">
    <h4>🧪 Test Widget</h4>
    <p class="test-hint">Try saying: <code>show me products</code></p>
    <p class="test-hint">Or: <code>check my order</code></p>
    <p class="test-hint">Or: <code>hello!</code> for plain text</p>
    <p class="test-hint" style="margin-top:8px;color:#059669">API key: <code>pk_test_mock</code></p>
  </div>

  <!-- ── Widget embed (the actual production tag shape) ────────────── -->
  <script
    src="/widget.iife.js"
    data-api-key="pk_test_mock"
    data-shop-domain="verdant-store.myshopify.com"
    data-api-url="http://localhost:${PORT}"
    data-title="Verdant Store"
    data-position="right"
    async
  ></script>

</body>
</html>`);
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   Shopbot Widget Test Server                       ║
╠════════════════════════════════════════════════════╣
║   Storefront  →  http://localhost:${PORT}             ║
║   Chat API    →  POST /widget/chat                 ║
║   Widget JS   →  GET  /widget.iife.js              ║
╠════════════════════════════════════════════════════╣
║   Try asking:                                      ║
║     • "show me products"  → Product Carousel       ║
║     • "check my order"    → Order Status Card      ║
║     • "hello!"            → Streaming text         ║
╚════════════════════════════════════════════════════╝
`);
});