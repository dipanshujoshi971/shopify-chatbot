#!/usr/bin/env node
/**
 * packages/widget/scripts/test-server.js
 *
 * Lightweight HTTP test server for end-to-end widget development.
 *
 * What it provides:
 *   GET  /              → mock Shopify storefront with widget embedded
 *   POST /widget/chat   → mock JSON chat API (matches real API response shape)
 *   GET  /widget/config → mock widget config endpoint
 *   GET  /widget.iife.js → serves the built bundle from dist/
 *
 * Usage:
 *   1. Build widget:   npm run build --workspace=packages/widget
 *   2. Run server:     node packages/widget/scripts/test-server.js
 *   3. Open:           http://localhost:4000
 *
 * Test phrases:
 *   "show me products"  → Product Carousel
 *   "check my order"    → Order Status Card
 *   "add to cart"       → Cart Card
 *   "hello!"            → Plain text response
 */

import http    from 'node:http';
import fs      from 'node:fs';
import path    from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT      = parseInt(process.env.TEST_PORT ?? '4000', 10);
const DIST_DIR  = path.resolve(__dirname, '../dist');

// ── Mock data ─────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  {
    id             : 'gid://shopify/Product/1',
    title          : 'Merino Wool Sweater',
    handle         : 'merino-wool-sweater',
    description    : 'Premium merino wool, extra soft. Perfect for layering in cooler weather.',
    featuredImage  : { url: 'https://placehold.co/300x300/6366f1/fff?text=Sweater', altText: 'Sweater' },
    priceRange     : { minVariantPrice: { amount: '89.99', currencyCode: 'USD' } },
    compareAtPriceRange: { minVariantPrice: { amount: '120.00', currencyCode: 'USD' } },
    availableForSale: true,
    variants: [
      { id: 'gid://shopify/ProductVariant/101', title: 'Small', price: { amount: '89.99', currencyCode: 'USD' }, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/102', title: 'Medium', price: { amount: '89.99', currencyCode: 'USD' }, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/103', title: 'Large', price: { amount: '89.99', currencyCode: 'USD' }, availableForSale: false },
    ],
  },
  {
    id             : 'gid://shopify/Product/2',
    title          : 'Linen Trousers',
    handle         : 'linen-trousers',
    description    : 'Breathable summer trousers made from 100% organic linen.',
    featuredImage  : { url: 'https://placehold.co/300x300/4f46e5/fff?text=Trousers', altText: 'Trousers' },
    priceRange     : { minVariantPrice: { amount: '64.99', currencyCode: 'USD' } },
    availableForSale: true,
    variants: [
      { id: 'gid://shopify/ProductVariant/201', title: 'Default', price: { amount: '64.99', currencyCode: 'USD' }, availableForSale: true },
    ],
  },
  {
    id             : 'gid://shopify/Product/3',
    title          : 'Canvas Tote Bag',
    handle         : 'canvas-tote',
    description    : 'Durable cotton canvas bag, perfect for everyday carry.',
    featuredImage  : { url: 'https://placehold.co/300x300/7c3aed/fff?text=Tote', altText: 'Tote' },
    priceRange     : { minVariantPrice: { amount: '29.00', currencyCode: 'USD' } },
    availableForSale: false,
  },
];

const MOCK_ORDER = {
  orderId                 : 'gid://shopify/Order/1001',
  orderNumber             : '1001',
  displayFinancialStatus  : 'paid',
  displayFulfillmentStatus: 'partially fulfilled',
  processedAt             : new Date(Date.now() - 86_400_000 * 3).toISOString(),
  lineItems: [
    { title: 'Merino Wool Sweater', quantity: 1, variant: { title: 'Medium' } },
    { title: 'Canvas Tote Bag',     quantity: 2 },
  ],
  shippingAddress: { name: 'Jane Doe', address1: '123 Main St', city: 'Portland', province: 'OR', zip: '97201', country: 'US' },
  trackingInfo   : { number: '1Z999AA1012345678', company: 'UPS', url: 'https://www.ups.com/track?tracknum=1Z999AA1012345678' },
  totalPrice     : { amount: '148.98', currencyCode: 'USD' },
};

const MOCK_CART = {
  cartId       : 'gid://shopify/Cart/mock-cart-123',
  checkoutUrl  : 'https://verdant-store.myshopify.com/cart/c/mock-cart-123',
  totalQuantity: 2,
  lines: [
    {
      title   : 'Merino Wool Sweater',
      quantity: 1,
      variant : 'Medium',
      image   : 'https://placehold.co/100x100/6366f1/fff?text=S',
      price   : { amount: '89.99', currencyCode: 'USD' },
    },
    {
      title   : 'Linen Trousers',
      quantity: 1,
      variant : 'Default',
      image   : 'https://placehold.co/100x100/4f46e5/fff?text=T',
      price   : { amount: '64.99', currencyCode: 'USD' },
    },
  ],
  cost: { totalAmount: { amount: '154.98', currencyCode: 'USD' } },
};

const MOCK_CONFIG = {
  botName       : 'Verdant AI',
  tone          : 'friendly',
  useEmojis     : true,
  greeting      : 'Hey there! Welcome to Verdant Store!',
  themeColor    : '#6366f1',
  position      : 'right',
  mode          : 'light',
  starterButtons: [
    'Show me your best sellers',
    'What\'s your return policy?',
    'Track my order',
  ],
};

// ── Response builders ─────────────────────────────────────────────

function buildResponse(message, conversationId) {
  const lower = message.toLowerCase();

  // Product search
  if (lower.includes('product') || lower.includes('sweater') || lower.includes('show') || lower.includes('sell') || lower.includes('best')) {
    return {
      text: 'Here are some products I found for you:',
      products: MOCK_PRODUCTS,
      cart: null,
      order: null,
      conversationId,
    };
  }

  // Order tracking
  if (lower.includes('order') || lower.includes('track') || lower.includes('delivery')) {
    return {
      text: "Here's your order status:",
      products: [],
      cart: null,
      order: MOCK_ORDER,
      conversationId,
    };
  }

  // Cart operations
  if (lower.includes('cart') || lower.includes('add')) {
    return {
      text: "I've updated your cart:",
      products: [],
      cart: MOCK_CART,
      order: null,
      conversationId,
    };
  }

  // Policy / FAQ
  if (lower.includes('return') || lower.includes('policy') || lower.includes('shipping') || lower.includes('refund')) {
    return {
      text: '**Return Policy:** We accept returns within 30 days of purchase. Items must be in original condition with tags attached.\n\n**Shipping:** Free standard shipping on orders over $50. Express shipping available for $12.99.\n\n**Exchanges:** We offer free exchanges for different sizes or colors. Visit our [Returns Portal](https://verdant-store.myshopify.com/policies/refund-policy) to start a return.',
      products: [],
      cart: null,
      order: null,
      conversationId,
    };
  }

  // Default greeting
  return {
    text: "Thanks for reaching out! I'm the AI assistant for Verdant Store. I can help you find products, check order status, manage your cart, and answer questions about our policies. What would you like to know?",
    products: [],
    cart: null,
    order: null,
    conversationId,
  };
}

// ── HTTP server ────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Widget-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve widget bundle
  if (url.pathname === '/widget.iife.js') {
    const filePath = path.join(DIST_DIR, 'widget.iife.js');
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Widget not built. Run: npm run build --workspace=packages/widget');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Mock widget config endpoint
  if (url.pathname === '/widget/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(MOCK_CONFIG));
    return;
  }

  // Mock chat endpoint — returns JSON (matches real API response shape)
  if (url.pathname === '/widget/chat' && req.method === 'POST') {
    const apiKey = req.headers['x-widget-key'] ?? '';
    if (!String(apiKey).startsWith('pk_')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorised', message: 'Missing or invalid X-Widget-Key header.' }));
      return;
    }

    let body;
    try {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (c) => (data += c));
        req.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON')); }
        });
      });
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON body.' }));
      return;
    }

    if (!body.message || !body.sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Request', message: 'message and sessionId are required.' }));
      return;
    }

    const conversationId = body.conversationId || 'mock-conv-' + Date.now();

    // Simulate a small delay like a real LLM call
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));

    const response = buildResponse(body.message, conversationId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    return;
  }

  // Mock storefront HTML
  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verdant Store — Widget Test</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; }
    .store-header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; }
    .store-logo { font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em; }
    .store-nav { display: flex; gap: 28px; font-size: 14px; font-weight: 500; color: #64748b; }
    .store-hero { padding: 100px 32px; text-align: center; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%); }
    .store-hero h1 { font-size: 48px; font-weight: 800; color: #1e1b4b; margin-bottom: 16px; letter-spacing: -0.03em; }
    .store-hero p { font-size: 18px; color: #4338ca; margin-bottom: 36px; font-weight: 500; }
    .hero-btn { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border-radius: 12px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 24px rgba(99,102,241,.3); transition: all .2s; }
    .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,.4); }
    .products { padding: 60px 32px; max-width: 1000px; margin: 0 auto; }
    .products h2 { font-size: 28px; font-weight: 800; margin-bottom: 28px; letter-spacing: -0.02em; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
    .product-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; transition: all .2s; }
    .product-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,.08); transform: translateY(-4px); }
    .product-img { width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, #eef2ff, #e0e7ff); display: flex; align-items: center; justify-content: center; font-size: 56px; }
    .product-body { padding: 16px; }
    .product-name { font-weight: 700; font-size: 15px; margin-bottom: 6px; letter-spacing: -0.01em; }
    .product-price { color: #6366f1; font-weight: 800; font-size: 16px; }
    .test-controls { position: fixed; top: 76px; left: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; font-size: 12px; color: #64748b; box-shadow: 0 4px 16px rgba(0,0,0,.06); z-index: 9999; max-width: 220px; }
    .test-controls h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6366f1; margin-bottom: 10px; }
    .test-hint { margin-bottom: 8px; line-height: 1.5; }
    .test-hint code { background: #eef2ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  </style>
</head>
<body>
  <header class="store-header">
    <div class="store-logo">Verdant Store</div>
    <nav class="store-nav"><span>Collections</span><span>About</span><span>Contact</span></nav>
  </header>
  <section class="store-hero">
    <h1>Sustainable Fashion</h1>
    <p>Ethically sourced, beautifully crafted clothing</p>
    <a href="#" class="hero-btn">Shop Now</a>
  </section>
  <section class="products">
    <h2>Featured Products</h2>
    <div class="product-grid">
      <div class="product-card"><div class="product-img">🧥</div><div class="product-body"><p class="product-name">Merino Wool Sweater</p><p class="product-price">$89.99</p></div></div>
      <div class="product-card"><div class="product-img">👖</div><div class="product-body"><p class="product-name">Linen Trousers</p><p class="product-price">$64.99</p></div></div>
      <div class="product-card"><div class="product-img">👜</div><div class="product-body"><p class="product-name">Canvas Tote Bag</p><p class="product-price">$29.00</p></div></div>
    </div>
  </section>

  <div class="test-controls">
    <h4>Test Widget</h4>
    <p class="test-hint">Try: <code>show me products</code></p>
    <p class="test-hint">Try: <code>check my order</code></p>
    <p class="test-hint">Try: <code>add to cart</code></p>
    <p class="test-hint">Try: <code>return policy</code></p>
    <p class="test-hint">Try: <code>hello!</code></p>
  </div>

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

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   Shopbot Widget Test Server                     ║
╠══════════════════════════════════════════════════╣
║   Storefront → http://localhost:${PORT}              ║
║   Chat API   → POST /widget/chat  (JSON)        ║
║   Config     → GET  /widget/config               ║
║   Bundle     → GET  /widget.iife.js              ║
╠══════════════════════════════════════════════════╣
║   Test phrases:                                  ║
║     "show me products"  → Product carousel       ║
║     "check my order"    → Order card             ║
║     "add to cart"       → Cart card              ║
║     "return policy"     → Text response          ║
╚══════════════════════════════════════════════════╝
`);
});
