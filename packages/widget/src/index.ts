/**
 * packages/widget/src/index.ts
 *
 * Widget entry point — self-initializing IIFE.
 *
 * Merchants embed exactly one tag in their Shopify theme:
 *
 *   <script
 *     src="https://cdn.yourapp.com/widget.iife.js"
 *     data-shop-domain="{{ shop.permanent_domain }}"
 *     data-title="{{ shop.name }}"
 *     data-position="right"
 *     async
 *   ></script>
 *
 * The widget:
 *   1. Reads config from the script tag's data-* attributes
 *   2. Auto-resolves the API key from the server if not provided
 *   3. Creates a <shopbot-widget> custom element with Shadow DOM
 *      (full CSS isolation — zero risk of storefront style conflicts)
 *   4. Injects styles into the shadow root
 *   5. Mounts the Preact <Widget> component
 *   6. Handles Shopify Consent API automatically
 *
 * Idempotent: calling multiple times is safe (duplicate detection).
 */

import { h, render }     from 'preact';
import { Widget }        from './components/widget.js';
import { WIDGET_CSS }    from './styles.js';
import type { WidgetConfig } from './types.js';

declare const __WIDGET_VERSION__: string;

// ------------------------------------------------------------------ //
// Duplicate-init guard
// ------------------------------------------------------------------ //

const INIT_FLAG = '__shopbot_initialized__';
if ((window as any)[INIT_FLAG]) {
  throw new Error('[shopbot] Widget already initialized. Remove duplicate script tags.');
}
(window as any)[INIT_FLAG] = true;

// ------------------------------------------------------------------ //
// Read config from <script> data-* attributes
// ------------------------------------------------------------------ //

function readConfig(): { config: WidgetConfig; needsKeyResolve: boolean } | null {
  // Find the current script tag — look for data-shop-domain (always present)
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[data-shop-domain]',
  );

  if (scripts.length === 0) {
    console.warn('[shopbot] No script tag with data-shop-domain found.');
    return null;
  }

  const script = scripts[scripts.length - 1]; // use last one if multiple

  const apiKey     = script.dataset.apiKey?.trim() || '';
  const shopDomain = script.dataset.shopDomain?.trim();

  if (!shopDomain) {
    console.error('[shopbot] data-shop-domain is required.');
    return null;
  }

  // Infer API base URL from the script src (strip filename)
  let apiBaseUrl = script.dataset.apiUrl?.trim();
  if (!apiBaseUrl) {
    try {
      const scriptUrl = new URL(script.src);
      // e.g. https://api.yourapp.com/widget.iife.js → https://api.yourapp.com
      apiBaseUrl = `${scriptUrl.protocol}//${scriptUrl.host}`;
    } catch {
      apiBaseUrl = '';
    }
  }
  const title = script.dataset.title?.trim() ?? shopDomain;
  const accentColor = script.dataset.accentColor?.trim();
  const position = script.dataset.position === 'left' ? 'left' : 'right';

  return {
    config: {
      apiKey,
      shopDomain,
      apiBaseUrl,
      title,
      ...(accentColor && { accentColor }),
      position,
    },
    needsKeyResolve: !apiKey,
  };
}

// ------------------------------------------------------------------ //
// Auto-resolve API key from server
// ------------------------------------------------------------------ //

async function resolveApiKey(apiBaseUrl: string, shopDomain: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${apiBaseUrl}/widget/resolve-key?shop=${encodeURIComponent(shopDomain)}`,
    );
    if (!res.ok) {
      console.error(`[shopbot] Failed to resolve API key: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json() as { apiKey?: string };
    return data.apiKey || null;
  } catch (err) {
    console.error('[shopbot] Failed to resolve API key:', err);
    return null;
  }
}

// ------------------------------------------------------------------ //
// Mount into Shadow DOM
// ------------------------------------------------------------------ //

function mount(config: WidgetConfig): void {
  // Create custom element (avoids collisions with host page elements)
  const host = document.createElement('shopbot-widget');
  host.setAttribute('data-version', __WIDGET_VERSION__);

  // Shadow DOM for full CSS isolation
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = WIDGET_CSS;
  shadow.appendChild(styleEl);

  // Mount container inside shadow root
  const container = document.createElement('div');
  shadow.appendChild(container);

  document.body.appendChild(host);

  // Render Preact tree
  render(h(Widget, { config }), container);

  if (import.meta.env.DEV) {
    console.log(
      `[shopbot] v${__WIDGET_VERSION__} mounted`,
      { apiKey: config.apiKey.slice(0, 12) + '...', shopDomain: config.shopDomain },
    );
  }
}

// ------------------------------------------------------------------ //
// Bootstrap — wait for DOM then initialize
// ------------------------------------------------------------------ //

async function init(): Promise<void> {
  const result = readConfig();
  if (!result) return;

  const { config, needsKeyResolve } = result;

  if (needsKeyResolve) {
    const resolvedKey = await resolveApiKey(config.apiBaseUrl, config.shopDomain);
    if (!resolvedKey) {
      console.error('[shopbot] Could not resolve API key for shop:', config.shopDomain);
      return;
    }
    config.apiKey = resolvedKey;
  }

  mount(config);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init(); }, { once: true });
} else {
  init();
}

// ------------------------------------------------------------------ //
// Public API (accessible as window.ShopbotWidget from the IIFE name)
// ------------------------------------------------------------------ //

export { __WIDGET_VERSION__ as version };
