/**
 * packages/widget/src/styles.ts
 *
 * All widget CSS as a template literal string.
 * Injected into a Shadow DOM <style> tag for full style isolation —
 * zero risk of conflicts with the merchant's storefront CSS.
 *
 * Design system:
 *   - Emerald green brand (matches dashboard globals.css)
 *   - Compact, professional — fits any store aesthetic
 *   - Smooth micro-animations
 *   - Full WCAG AA contrast
 */

export const WIDGET_CSS = /* css */ `
  /* ── Reset (scoped to shadow root) ─────────────────────────────── */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── CSS custom properties ──────────────────────────────────────── */
  :host {
    --sb-accent:         #059669;   /* emerald-600 */
    --sb-accent-hover:   #047857;   /* emerald-700 */
    --sb-accent-light:   #d1fae5;   /* emerald-100 */
    --sb-accent-fg:      #ffffff;

    --sb-bg:             #ffffff;
    --sb-bg-elevated:    #f9fafb;   /* gray-50 */
    --sb-border:         #e5e7eb;   /* gray-200 */
    --sb-text:           #111827;   /* gray-900 */
    --sb-text-muted:     #6b7280;   /* gray-500 */
    --sb-text-xs:        #9ca3af;   /* gray-400 */

    --sb-radius:         14px;
    --sb-radius-sm:      8px;
    --sb-shadow:         0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
    --sb-shadow-btn:     0 1px 3px rgba(0,0,0,.15);

    --sb-font:           -apple-system, BlinkMacSystemFont, 'Segoe UI',
                         Roboto, Helvetica, Arial, sans-serif;
    --sb-font-size:      14px;
    --sb-transition:     160ms ease;

    --sb-width:          360px;
    --sb-height:         520px;

    font-family: var(--sb-font);
    font-size: var(--sb-font-size);
    line-height: 1.5;
    color: var(--sb-text);
  }

  /* ── Launcher button ────────────────────────────────────────────── */
  .sb-launcher {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483646;

    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: var(--sb-accent);
    color: var(--sb-accent-fg);
    box-shadow: var(--sb-shadow);

    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--sb-transition), transform var(--sb-transition);
  }
  .sb-launcher:hover  { background: var(--sb-accent-hover); transform: scale(1.06); }
  .sb-launcher:active { transform: scale(0.96); }
  .sb-launcher svg    { width: 24px; height: 24px; pointer-events: none; }

  .sb-launcher[data-position="left"] {
    right: auto;
    left: 24px;
  }

  /* Unread badge */
  .sb-unread-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ef4444;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
    animation: sb-pop .2s ease;
  }

  /* ── Chat panel ─────────────────────────────────────────────────── */
  .sb-panel {
    position: fixed;
    bottom: 90px;
    right: 24px;
    z-index: 2147483647;

    width: var(--sb-width);
    height: var(--sb-height);
    max-height: calc(100vh - 120px);

    background: var(--sb-bg);
    border-radius: var(--sb-radius);
    box-shadow: var(--sb-shadow);
    border: 1px solid var(--sb-border);

    display: flex;
    flex-direction: column;
    overflow: hidden;

    transform-origin: bottom right;
    animation: sb-panel-in .2s cubic-bezier(.34,1.56,.64,1);
  }
  .sb-panel[data-position="left"] {
    right: auto;
    left: 24px;
    transform-origin: bottom left;
  }
  .sb-panel.sb-panel-out {
    animation: sb-panel-out .15s ease forwards;
  }

  @media (max-width: 400px) {
    .sb-panel {
      width: 100vw;
      right: 0;
      bottom: 0;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      max-height: 85vh;
    }
  }

  /* ── Panel header ───────────────────────────────────────────────── */
  .sb-header {
    padding: 14px 16px;
    background: var(--sb-accent);
    color: var(--sb-accent-fg);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .sb-header-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255,255,255,.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sb-header-avatar svg { width: 18px; height: 18px; }
  .sb-header-info { flex: 1; min-width: 0; }
  .sb-header-title {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sb-header-subtitle {
    font-size: 11px;
    opacity: .8;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .sb-online-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4ade80;
    animation: sb-pulse 2s infinite;
  }
  .sb-close-btn {
    background: rgba(255,255,255,.15);
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--sb-transition);
    flex-shrink: 0;
  }
  .sb-close-btn:hover { background: rgba(255,255,255,.25); }
  .sb-close-btn svg   { width: 14px; height: 14px; }

  /* ── Messages area ──────────────────────────────────────────────── */
  .sb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scroll-behavior: smooth;
  }
  .sb-messages::-webkit-scrollbar       { width: 4px; }
  .sb-messages::-webkit-scrollbar-track { background: transparent; }
  .sb-messages::-webkit-scrollbar-thumb {
    background: var(--sb-border);
    border-radius: 2px;
  }

  /* ── Consent banner ─────────────────────────────────────────────── */
  .sb-consent-banner {
    margin: 8px 12px;
    padding: 12px;
    background: var(--sb-bg-elevated);
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-sm);
    font-size: 12px;
    color: var(--sb-text-muted);
    line-height: 1.5;
  }
  .sb-consent-banner p { margin-bottom: 10px; }
  .sb-consent-actions { display: flex; gap: 8px; }
  .sb-consent-accept {
    flex: 1;
    padding: 7px;
    background: var(--sb-accent);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--sb-transition);
  }
  .sb-consent-accept:hover { background: var(--sb-accent-hover); }
  .sb-consent-decline {
    padding: 7px 12px;
    background: transparent;
    border: 1px solid var(--sb-border);
    border-radius: 6px;
    font-size: 12px;
    color: var(--sb-text-muted);
    cursor: pointer;
  }

  /* ── Message bubbles ────────────────────────────────────────────── */
  .sb-msg {
    display: flex;
    flex-direction: column;
    max-width: 84%;
    animation: sb-msg-in .18s ease;
  }
  .sb-msg-user  { align-self: flex-end; align-items: flex-end; }
  .sb-msg-assistant { align-self: flex-start; align-items: flex-start; }

  .sb-bubble {
    padding: 9px 12px;
    border-radius: 16px;
    font-size: 13.5px;
    line-height: 1.55;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .sb-bubble-user {
    background: var(--sb-accent);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .sb-bubble-assistant {
    background: var(--sb-bg-elevated);
    color: var(--sb-text);
    border: 1px solid var(--sb-border);
    border-bottom-left-radius: 4px;
  }

  /* Streaming cursor */
  .sb-cursor::after {
    content: '▍';
    animation: sb-blink .7s step-end infinite;
    color: var(--sb-accent);
    margin-left: 1px;
  }

  .sb-msg-time {
    font-size: 10px;
    color: var(--sb-text-xs);
    padding: 2px 4px;
  }

  /* ── Typing indicator ───────────────────────────────────────────── */
  .sb-typing {
    align-self: flex-start;
    background: var(--sb-bg-elevated);
    border: 1px solid var(--sb-border);
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    padding: 10px 14px;
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .sb-typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sb-text-muted);
    animation: sb-bounce .9s infinite;
  }
  .sb-typing span:nth-child(2) { animation-delay: .15s; }
  .sb-typing span:nth-child(3) { animation-delay: .3s; }

  /* ── Error message ──────────────────────────────────────────────── */
  .sb-error-msg {
    align-self: center;
    font-size: 12px;
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 8px 12px;
    max-width: 90%;
    text-align: center;
  }

  /* ── Product carousel ───────────────────────────────────────────── */
  .sb-carousel-wrap {
    width: 100%;
    max-width: 100%;
    margin-top: 6px;
  }
  .sb-carousel-label {
    font-size: 11px;
    color: var(--sb-text-muted);
    margin-bottom: 8px;
    padding-left: 2px;
  }
  .sb-carousel-viewport {
    position: relative;
  }
  .sb-carousel-track {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }
  .sb-carousel-track::-webkit-scrollbar { display: none; }
  .sb-carousel-track > * { scroll-snap-align: start; }

  .sb-carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--sb-border);
    background: var(--sb-bg);
    box-shadow: var(--sb-shadow-btn);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sb-text);
    transition: background var(--sb-transition);
  }
  .sb-carousel-arrow:hover { background: var(--sb-bg-elevated); }
  .sb-carousel-arrow svg   { width: 14px; height: 14px; }
  .sb-arrow-left  { left: -14px; }
  .sb-arrow-right { right: -14px; }

  .sb-product-card {
    flex: 0 0 148px;
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-sm);
    overflow: hidden;
    background: var(--sb-bg);
    transition: box-shadow var(--sb-transition), transform var(--sb-transition);
  }
  .sb-product-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
    transform: translateY(-1px);
  }

  .sb-product-img-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background: var(--sb-bg-elevated);
    overflow: hidden;
  }
  .sb-product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .3s ease;
  }
  .sb-product-card:hover .sb-product-img { transform: scale(1.04); }

  .sb-product-img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sb-border);
  }
  .sb-product-img-placeholder svg { width: 32px; height: 32px; }

  .sb-sale-badge, .sb-oos-badge {
    position: absolute;
    top: 6px;
    left: 6px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .02em;
  }
  .sb-sale-badge { background: #ef4444; color: #fff; }
  .sb-oos-badge  { background: rgba(0,0,0,.6); color: #fff; }

  .sb-product-info { padding: 8px 9px 10px; }
  .sb-product-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sb-text);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 4px;
  }
  .sb-product-price-row {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 8px;
  }
  .sb-product-price {
    font-size: 13px;
    font-weight: 700;
    color: var(--sb-text);
  }
  .sb-price-sale { color: #ef4444; }
  .sb-product-compare {
    font-size: 11px;
    color: var(--sb-text-xs);
    text-decoration: line-through;
  }
  .sb-product-cta {
    display: block;
    width: 100%;
    padding: 5px 0;
    background: var(--sb-accent);
    color: #fff;
    border: none;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: background var(--sb-transition);
  }
  .sb-product-cta:hover   { background: var(--sb-accent-hover); }
  .sb-cta-disabled        { background: var(--sb-border) !important; color: var(--sb-text-muted) !important; cursor: not-allowed; }
  .sb-no-results          { font-size: 13px; color: var(--sb-text-muted); padding: 8px 0; }

  /* ── Order card ─────────────────────────────────────────────────── */
  .sb-order-card {
    width: 100%;
    background: var(--sb-bg);
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-sm);
    overflow: hidden;
    margin-top: 6px;
    font-size: 12.5px;
  }
  .sb-order-header {
    padding: 10px 12px;
    background: var(--sb-bg-elevated);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .sb-order-number {
    font-weight: 700;
    font-size: 13px;
    color: var(--sb-text);
  }
  .sb-order-date { font-size: 11px; color: var(--sb-text-muted); margin-top: 1px; }
  .sb-order-pills { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }

  .sb-pill {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .02em;
    text-transform: capitalize;
  }
  .sb-pill-green { background: #dcfce7; color: #15803d; }
  .sb-pill-amber { background: #fef9c3; color: #92400e; }
  .sb-pill-red   { background: #fee2e2; color: #991b1b; }
  .sb-pill-blue  { background: #dbeafe; color: #1e40af; }
  .sb-pill-grey  { background: var(--sb-bg-elevated); color: var(--sb-text-muted); border: 1px solid var(--sb-border); }

  .sb-divider { border: none; border-top: 1px solid var(--sb-border); }

  .sb-order-items { padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; }
  .sb-order-item  { display: flex; gap: 6px; align-items: baseline; }
  .sb-item-qty    { flex-shrink: 0; color: var(--sb-text-muted); font-size: 11px; min-width: 20px; }
  .sb-item-name   { color: var(--sb-text); line-height: 1.35; }

  .sb-order-details { padding: 8px 12px; display: flex; flex-direction: column; gap: 6px; }
  .sb-order-row     { display: flex; gap: 8px; align-items: flex-start; }
  .sb-order-row-label {
    flex-shrink: 0;
    width: 64px;
    color: var(--sb-text-muted);
    font-size: 11px;
  }
  .sb-order-row-value { color: var(--sb-text); flex: 1; }

  .sb-tracking-link {
    color: var(--sb-accent);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-weight: 500;
  }
  .sb-tracking-link:hover { text-decoration: underline; }
  .sb-external-icon { width: 11px; height: 11px; flex-shrink: 0; }

  /* ── Input area ─────────────────────────────────────────────────── */
  .sb-input-area {
    padding: 10px 12px;
    background: var(--sb-bg);
    border-top: 1px solid var(--sb-border);
    display: flex;
    gap: 8px;
    align-items: flex-end;
    flex-shrink: 0;
  }
  .sb-textarea {
    flex: 1;
    padding: 9px 11px;
    border: 1px solid var(--sb-border);
    border-radius: 20px;
    font-size: 13.5px;
    font-family: var(--sb-font);
    line-height: 1.45;
    resize: none;
    outline: none;
    background: var(--sb-bg-elevated);
    color: var(--sb-text);
    max-height: 100px;
    overflow-y: auto;
    transition: border-color var(--sb-transition), box-shadow var(--sb-transition);
  }
  .sb-textarea:focus {
    border-color: var(--sb-accent);
    box-shadow: 0 0 0 3px rgba(5,150,105,.1);
  }
  .sb-textarea::placeholder { color: var(--sb-text-xs); }
  .sb-textarea:disabled { opacity: .5; cursor: not-allowed; }

  .sb-send-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--sb-accent);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--sb-transition), transform var(--sb-transition);
  }
  .sb-send-btn:hover:not(:disabled) { background: var(--sb-accent-hover); }
  .sb-send-btn:active:not(:disabled){ transform: scale(0.92); }
  .sb-send-btn:disabled { opacity: .4; cursor: not-allowed; }
  .sb-send-btn svg { width: 16px; height: 16px; }

  /* ── Empty state ────────────────────────────────────────────────── */
  .sb-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 24px;
    gap: 10px;
    color: var(--sb-text-muted);
    text-align: center;
  }
  .sb-empty-icon {
    width: 44px;
    height: 44px;
    background: var(--sb-accent-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sb-accent);
  }
  .sb-empty-icon svg { width: 22px; height: 22px; }
  .sb-empty-title    { font-weight: 600; font-size: 14px; color: var(--sb-text); }
  .sb-empty-subtitle { font-size: 12.5px; line-height: 1.5; }

  /* ── Animations ─────────────────────────────────────────────────── */
  @keyframes sb-panel-in {
    from { opacity: 0; transform: scale(0.9) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes sb-panel-out {
    to { opacity: 0; transform: scale(0.9) translateY(8px); }
  }
  @keyframes sb-msg-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sb-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30%           { transform: translateY(-5px); }
  }
  @keyframes sb-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes sb-pop {
    from { transform: scale(0); }
    to   { transform: scale(1); }
  }
  @keyframes sb-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: .5; }
  }
`;