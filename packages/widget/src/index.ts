/**
 * packages/widget/src/index.ts
 *
 * Widget entry point — self-initializing IIFE.
 *
 * Merchants embed exactly one tag in their Shopify theme:
 *
 *   <script
 *     src="https://cdn.yourapp.com/widget.iife.js"
 *     data-api-key="pk_live_xxx"
 *     data-shop-domain="{{ shop.permanent_domain }}"
 *     data-title="{{ shop.name }}"
 *     data-position="right"
 *     async
 *   ></script>
 *
 * The widget:
 *   1. Reads config from the script tag's data-* attributes
 *   2. Creates a <shopbot-widget> custom element with Shadow DOM
 *      (full CSS isolation — zero risk of storefront style conflicts)
 *   3. Injects styles into the shadow root
 *   4. Mounts the Preact <Widget> component
 *   5. Handles Shopify Consent API automatically
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

function readConfig(): WidgetConfig | null {
  // Find the current script tag
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[data-api-key]',
  );

  if (scripts.length === 0) {
    console.warn('[shopbot] No script tag with data-api-key found.');
    return null;
  }

  const script = scripts[scripts.length - 1]; // use last one if multiple

  const apiKey    = script.dataset.apiKey?.trim();
  const shopDomain = script.dataset.shopDomain?.trim();

  if (!apiKey) {
    console.error('[shopbot] data-api-key is required.');
    return null;
  }
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

  return {
    apiKey,
    shopDomain,
    apiBaseUrl,
    title      : script.dataset.title?.trim()    ?? shopDomain,
    accentColor: script.dataset.accentColor?.trim(),
    position   : (script.dataset.position as 'right' | 'left') ?? 'right',
  };
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

function init(): void {
  const config = readConfig();
  if (!config) return;
  mount(config);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

// ------------------------------------------------------------------ //
// Public API (accessible as window.ShopbotWidget from the IIFE name)
// ------------------------------------------------------------------ //

export { __WIDGET_VERSION__ as version };