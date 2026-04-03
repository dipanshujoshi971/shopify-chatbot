/**
 * packages/widget/src/styles.ts
 *
 * Complete widget CSS — injected into Shadow DOM for full isolation.
 *
 * Design:
 *   - Modern, rounded card aesthetic
 *   - Smooth animations and micro-interactions
 *   - Support for dynamic accent color via --sb-accent
 *   - Product carousel, order card, cart card, ticket form
 *   - Starter buttons, page context hint popup
 *   - Full WCAG AA contrast
 */

export const WIDGET_CSS = /* css */ `
  /* ── Reset ─────────────────────────────────────────────────────── */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── CSS Custom Properties ─────────────────────────────────────── */
  :host {
    --sb-accent:         #059669;
    --sb-accent-hover:   color-mix(in srgb, var(--sb-accent) 85%, #000);
    --sb-accent-light:   color-mix(in srgb, var(--sb-accent) 12%, #fff);
    --sb-accent-subtle:  color-mix(in srgb, var(--sb-accent) 6%, #fff);
    --sb-accent-fg:      #ffffff;

    --sb-bg:             #ffffff;
    --sb-bg-elevated:    #f8f9fb;
    --sb-bg-hover:       #f3f4f6;
    --sb-border:         #e8eaed;
    --sb-border-light:   #f0f1f3;
    --sb-text:           #1a1d23;
    --sb-text-secondary: #5f6368;
    --sb-text-muted:     #9aa0a6;

    --sb-radius:         16px;
    --sb-radius-md:      12px;
    --sb-radius-sm:      8px;
    --sb-shadow:         0 12px 40px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.06);
    --sb-shadow-sm:      0 2px 8px rgba(0,0,0,.08);
    --sb-shadow-btn:     0 2px 6px rgba(0,0,0,.1);

    --sb-font:           -apple-system, BlinkMacSystemFont, 'Segoe UI',
                         Roboto, Helvetica, Arial, sans-serif;
    --sb-font-size:      14px;
    --sb-transition:     180ms cubic-bezier(.4,0,.2,1);
    --sb-transition-fast: 120ms cubic-bezier(.4,0,.2,1);

    --sb-width:          380px;
    --sb-height:         560px;

    font-family: var(--sb-font);
    font-size: var(--sb-font-size);
    line-height: 1.5;
    color: var(--sb-text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Dark mode ────────────────────────────────────────────────── */
  :host(.sb-dark) {
    --sb-accent-light:   color-mix(in srgb, var(--sb-accent) 18%, #1a1d23);
    --sb-accent-subtle:  color-mix(in srgb, var(--sb-accent) 10%, #1a1d23);

    --sb-bg:             #1a1d23;
    --sb-bg-elevated:    #22262e;
    --sb-bg-hover:       #2a2f38;
    --sb-border:         #333842;
    --sb-border-light:   #2a2f38;
    --sb-text:           #e8eaed;
    --sb-text-secondary: #9aa0a6;
    --sb-text-muted:     #6b7280;

    --sb-shadow:         0 12px 40px rgba(0,0,0,.35), 0 4px 12px rgba(0,0,0,.2);
    --sb-shadow-sm:      0 2px 8px rgba(0,0,0,.25);
  }

  /* ── Launcher ──────────────────────────────────────────────────── */
  .sb-launcher {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483646;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: var(--sb-accent);
    color: var(--sb-accent-fg);
    box-shadow: 0 4px 20px color-mix(in srgb, var(--sb-accent) 40%, transparent),
                0 2px 8px rgba(0,0,0,.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--sb-transition), box-shadow var(--sb-transition);
    overflow: visible;
  }
  .sb-launcher:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 28px color-mix(in srgb, var(--sb-accent) 50%, transparent),
                0 4px 12px rgba(0,0,0,.12);
  }
  .sb-launcher:active { transform: scale(0.95); }

  .sb-launcher[data-position="left"] { right: auto; left: 24px; }

  .sb-launcher-icon {
    width: 26px;
    height: 26px;
    transition: transform var(--sb-transition);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sb-launcher-icon svg { width: 26px; height: 26px; pointer-events: none; }
  .sb-launcher-open { transform: rotate(90deg); }
  .sb-launcher-open svg { width: 22px; height: 22px; }

  /* Unread badge */
  .sb-unread-badge {
    position: absolute;
    top: -3px;
    right: -3px;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    background: #ef4444;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    border: 2.5px solid #fff;
    animation: sb-pop .25s cubic-bezier(.34,1.56,.64,1);
  }
  :host(.sb-dark) .sb-unread-badge { border-color: #1a1d23; }

  /* ── Popup hint ────────────────────────────────────────────────── */
  .sb-hint {
    position: fixed;
    bottom: 94px;
    right: 24px;
    z-index: 2147483645;
    background: var(--sb-bg);
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-md);
    box-shadow: var(--sb-shadow-sm);
    padding: 10px 14px;
    max-width: 260px;
    font-size: 13px;
    color: var(--sb-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: sb-hint-in .3s cubic-bezier(.34,1.56,.64,1);
    transition: opacity var(--sb-transition);
  }
  .sb-hint:hover { background: var(--sb-bg-hover); }
  .sb-hint[data-position="left"] { right: auto; left: 24px; }
  .sb-hint-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--sb-text-muted);
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sb-hint-close svg { width: 14px; height: 14px; }

  /* ── Panel ─────────────────────────────────────────────────────── */
  .sb-panel {
    position: fixed;
    bottom: 96px;
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
    animation: sb-panel-in .25s cubic-bezier(.34,1.56,.64,1);
  }
  .sb-panel[data-position="left"] {
    right: auto;
    left: 24px;
    transform-origin: bottom left;
  }

  @media (max-width: 420px) {
    .sb-panel {
      width: 100vw;
      height: 100vh;
      right: 0;
      bottom: 0;
      border-radius: 0;
      max-height: 100vh;
    }
    .sb-launcher { bottom: 16px; right: 16px; }
    .sb-launcher[data-position="left"] { left: 16px; }
  }

  /* ── Header ────────────────────────────────────────────────────── */
  .sb-header {
    padding: 14px 16px;
    background: var(--sb-accent);
    color: var(--sb-accent-fg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(0,0,0,.08);
  }
  .sb-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .sb-header-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sb-header-avatar svg { width: 20px; height: 20px; }
  .sb-header-info { min-width: 0; }
  .sb-header-title {
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sb-header-subtitle {
    font-size: 11.5px;
    opacity: .85;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .sb-online-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
    animation: sb-pulse 2s infinite;
    box-shadow: 0 0 0 2px rgba(74,222,128,.3);
  }
  .sb-header-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .sb-header-btn {
    background: rgba(255,255,255,.12);
    border: none;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--sb-transition-fast);
  }
  .sb-header-btn:hover { background: rgba(255,255,255,.22); }
  .sb-header-btn svg { width: 16px; height: 16px; }

  /* ── Messages area ─────────────────────────────────────────────── */
  .sb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-behavior: smooth;
    background: var(--sb-bg-elevated);
    overscroll-behavior-y: contain;
  }
  .sb-messages::-webkit-scrollbar { width: 4px; }
  .sb-messages::-webkit-scrollbar-track { background: transparent; }
  .sb-messages::-webkit-scrollbar-thumb {
    background: var(--sb-border);
    border-radius: 2px;
  }

  /* ── Message bubbles ───────────────────────────────────────────── */
  .sb-msg {
    display: flex;
    gap: 8px;
    max-width: 88%;
    animation: sb-msg-in .2s ease;
  }
  .sb-msg-user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
  .sb-msg-assistant { align-self: flex-start; }

  .sb-msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--sb-accent-light);
    color: var(--sb-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .sb-msg-avatar svg { width: 14px; height: 14px; }

  .sb-msg-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    overflow: hidden;
  }
  .sb-msg-user .sb-msg-content { align-items: flex-end; }
  .sb-msg-assistant .sb-msg-content { align-items: flex-start; }

  .sb-bubble {
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 13.5px;
    line-height: 1.55;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .sb-bubble-user {
    background: var(--sb-accent);
    color: #fff;
    border-bottom-right-radius: 6px;
  }
  .sb-bubble-assistant {
    background: var(--sb-bg);
    color: var(--sb-text);
    border: 1px solid var(--sb-border-light);
    border-bottom-left-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
  }

  .sb-cursor::after {
    content: '|';
    animation: sb-blink .6s step-end infinite;
    color: var(--sb-accent);
    margin-left: 1px;
    font-weight: 300;
  }

  /* Markdown in messages */
  .sb-bubble strong { font-weight: 600; }
  .sb-chat-link {
    color: var(--sb-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    word-break: break-all;
  }
  .sb-chat-link:hover { opacity: .8; }
  .sb-bubble-user .sb-chat-link {
    color: #fff;
    text-decoration-color: rgba(255,255,255,.6);
  }
  .sb-chat-code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 12px;
    background: rgba(0,0,0,.06);
    padding: 1px 5px;
    border-radius: 4px;
  }
  :host(.sb-dark) .sb-chat-code { background: rgba(255,255,255,.1); }

  .sb-msg-time {
    font-size: 10px;
    color: var(--sb-text-muted);
    padding: 0 4px;
  }

  /* ── Typing indicator ──────────────────────────────────────────── */
  .sb-typing {
    align-self: flex-start;
    background: var(--sb-bg);
    border: 1px solid var(--sb-border-light);
    border-radius: 18px;
    border-bottom-left-radius: 6px;
    padding: 12px 16px;
    display: flex;
    gap: 5px;
    align-items: center;
    margin-left: 36px;
  }
  .sb-typing span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--sb-text-muted);
    animation: sb-bounce .9s infinite;
  }
  .sb-typing span:nth-child(2) { animation-delay: .15s; }
  .sb-typing span:nth-child(3) { animation-delay: .3s; }

  /* ── Consent banner ────────────────────────────────────────────── */
  .sb-consent-banner {
    margin: 12px 14px;
    padding: 16px;
    background: var(--sb-bg);
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-md);
    font-size: 13px;
    color: var(--sb-text-secondary);
    line-height: 1.55;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    text-align: center;
  }
  .sb-consent-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--sb-accent-light);
    color: var(--sb-accent);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sb-consent-actions { display: flex; gap: 8px; width: 100%; }
  .sb-consent-accept {
    flex: 1;
    padding: 9px;
    background: var(--sb-accent);
    color: #fff;
    border: none;
    border-radius: var(--sb-radius-sm);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--sb-transition-fast);
  }
  .sb-consent-accept:hover { background: var(--sb-accent-hover); }
  .sb-consent-decline {
    padding: 9px 14px;
    background: transparent;
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-sm);
    font-size: 13px;
    color: var(--sb-text-secondary);
    cursor: pointer;
    transition: background var(--sb-transition-fast);
  }
  .sb-consent-decline:hover { background: var(--sb-bg-hover); }

  /* ── Empty state ───────────────────────────────────────────────── */
  .sb-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 24px 16px;
    gap: 6px;
    text-align: center;
  }
  .sb-empty-bot {
    position: relative;
    margin-bottom: 8px;
  }
  .sb-empty-bot-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: var(--sb-accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
  }
  .sb-empty-bot-icon svg { width: 26px; height: 26px; }
  .sb-empty-pulse {
    position: absolute;
    inset: -4px;
    border-radius: 20px;
    background: var(--sb-accent-light);
    animation: sb-pulse-ring 2s ease infinite;
    z-index: 0;
  }
  .sb-empty-greeting {
    font-weight: 600;
    font-size: 16px;
    color: var(--sb-text);
    margin-top: 4px;
  }
  .sb-empty-name {
    font-size: 13px;
    color: var(--sb-text-secondary);
    margin-bottom: 12px;
  }

  /* ── Starter buttons ───────────────────────────────────────────── */
  .sb-starters {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    max-width: 280px;
    margin-top: 4px;
  }
  .sb-starter-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 14px;
    background: var(--sb-bg);
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-md);
    font-size: 13px;
    color: var(--sb-text);
    cursor: pointer;
    text-align: left;
    transition: all var(--sb-transition-fast);
    font-family: var(--sb-font);
  }
  .sb-starter-btn:hover {
    background: var(--sb-accent-subtle);
    border-color: var(--sb-accent);
    color: var(--sb-accent);
  }
  .sb-starter-text { flex: 1; }
  .sb-starter-arrow {
    width: 14px;
    height: 14px;
    color: var(--sb-text-muted);
    flex-shrink: 0;
    transition: transform var(--sb-transition-fast), color var(--sb-transition-fast);
  }
  .sb-starter-btn:hover .sb-starter-arrow {
    transform: translateX(3px);
    color: var(--sb-accent);
  }

  /* ── Error ─────────────────────────────────────────────────────── */
  .sb-error-msg {
    align-self: center;
    font-size: 12.5px;
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--sb-radius-sm);
    padding: 10px 14px;
    max-width: 90%;
    text-align: center;
    line-height: 1.5;
  }
  :host(.sb-dark) .sb-error-msg {
    background: rgba(220,38,38,.12);
    border-color: rgba(220,38,38,.3);
    color: #fca5a5;
  }

  /* ── Input area ────────────────────────────────────────────────── */
  .sb-input-area {
    padding: 10px 14px;
    background: var(--sb-bg);
    border-top: 1px solid var(--sb-border-light);
    display: flex;
    gap: 8px;
    align-items: flex-end;
    flex-shrink: 0;
  }
  .sb-textarea {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--sb-border);
    border-radius: 22px;
    font-size: 13.5px;
    font-family: var(--sb-font);
    line-height: 1.45;
    resize: none;
    outline: none;
    background: var(--sb-bg-elevated);
    color: var(--sb-text);
    max-height: 100px;
    overflow-y: auto;
    transition: border-color var(--sb-transition-fast), box-shadow var(--sb-transition-fast);
  }
  .sb-textarea:focus {
    border-color: var(--sb-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--sb-accent) 12%, transparent);
    background: var(--sb-bg);
  }
  .sb-textarea::placeholder { color: var(--sb-text-muted); }
  .sb-textarea:disabled { opacity: .5; cursor: not-allowed; }

  .sb-send-btn {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    background: var(--sb-accent);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--sb-transition-fast), transform var(--sb-transition-fast),
                box-shadow var(--sb-transition-fast);
    box-shadow: 0 2px 6px color-mix(in srgb, var(--sb-accent) 30%, transparent);
  }
  .sb-send-btn:hover:not(:disabled) {
    background: var(--sb-accent-hover);
    transform: scale(1.05);
  }
  .sb-send-btn:active:not(:disabled) { transform: scale(0.93); }
  .sb-send-btn:disabled { opacity: .35; cursor: not-allowed; box-shadow: none; }
  .sb-send-btn svg { width: 17px; height: 17px; }

  /* ── Powered by ────────────────────────────────────────────────── */
  .sb-powered-by {
    text-align: center;
    font-size: 10.5px;
    color: var(--sb-text-muted);
    padding: 6px;
    background: var(--sb-bg);
    border-top: 1px solid var(--sb-border-light);
    flex-shrink: 0;
  }
  .sb-powered-by strong {
    color: var(--sb-text-secondary);
    font-weight: 600;
  }

  /* ── Product carousel ──────────────────────────────────────────── */
  .sb-carousel-wrap {
    width: 100%;
    max-width: 100%;
    margin-top: 8px;
  }
  .sb-carousel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    padding: 0 2px;
  }
  .sb-carousel-label {
    font-size: 11.5px;
    color: var(--sb-text-secondary);
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: 500;
  }
  .sb-carousel-nav {
    display: flex;
    gap: 4px;
  }
  .sb-carousel-nav-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--sb-border);
    background: var(--sb-bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sb-text-secondary);
    transition: all var(--sb-transition-fast);
    padding: 0;
  }
  .sb-carousel-nav-btn:hover {
    background: var(--sb-accent-subtle);
    border-color: var(--sb-accent);
    color: var(--sb-accent);
  }
  .sb-carousel-nav-btn svg { width: 14px; height: 14px; }

  .sb-carousel-track {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 6px;
    scrollbar-width: none;
    overscroll-behavior-x: contain;
    touch-action: pan-x;
  }
  .sb-carousel-track::-webkit-scrollbar { display: none; }
  .sb-carousel-track > * {
    scroll-snap-align: start;
    flex: 0 0 auto;
    width: 172px;
    min-width: 172px;
  }

  .sb-carousel-dots {
    display: flex;
    justify-content: center;
    gap: 4px;
    padding-top: 6px;
  }
  .sb-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--sb-border);
    transition: background var(--sb-transition-fast), transform var(--sb-transition-fast);
  }
  .sb-dot-active {
    background: var(--sb-accent);
    transform: scale(1.3);
  }

  .sb-product-card {
    width: 172px;
    min-width: 172px;
    max-width: 172px;
    border: 1px solid var(--sb-border-light);
    border-radius: var(--sb-radius-md);
    overflow: hidden;
    background: var(--sb-bg);
    transition: box-shadow var(--sb-transition), border-color var(--sb-transition), transform var(--sb-transition);
  }
  .sb-product-card:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,.1);
    border-color: var(--sb-border);
    transform: translateY(-2px);
  }

  .sb-product-img-wrap {
    position: relative;
    width: 100%;
    height: 172px;
    max-height: 172px;
    background: var(--sb-bg-elevated);
    overflow: hidden;
  }
  .sb-product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .35s ease;
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
    padding: 2px 7px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .02em;
  }
  .sb-sale-badge { background: #ef4444; color: #fff; }
  .sb-oos-badge { background: rgba(0,0,0,.65); color: #fff; backdrop-filter: blur(4px); }

  .sb-product-info { padding: 8px 10px 6px; }
  .sb-product-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sb-text);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 3px;
  }
  .sb-product-price-line {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 700;
    color: var(--sb-text);
    margin-bottom: 6px;
  }
  .sb-price-sale { color: #ef4444; }
  .sb-product-compare { font-size: 11px; color: var(--sb-text-muted); text-decoration: line-through; font-weight: 400; }

  /* ── Product action buttons ────────────────────────────────────── */
  .sb-product-actions {
    display: flex;
    gap: 4px;
  }
  .sb-product-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 5px 2px;
    border: 1px solid var(--sb-border);
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--sb-transition-fast);
    font-family: var(--sb-font);
    background: var(--sb-bg);
    color: var(--sb-text-secondary);
  }
  .sb-product-btn:hover:not(:disabled) {
    border-color: var(--sb-accent);
    color: var(--sb-accent);
    background: var(--sb-accent-subtle);
  }
  .sb-product-btn:disabled {
    opacity: .4;
    cursor: not-allowed;
  }
  .sb-btn-active {
    border-color: var(--sb-accent) !important;
    color: var(--sb-accent) !important;
    background: var(--sb-accent-subtle) !important;
  }
  .sb-product-btn svg { flex-shrink: 0; }

  /* ── Add to Cart panel ─────────────────────────────────────────── */
  .sb-atc-panel {
    padding: 8px 10px 10px;
    border-top: 1px solid var(--sb-border-light);
    animation: sb-slide-down .15s ease;
  }
  .sb-atc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .sb-atc-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--sb-text);
  }
  .sb-atc-close, .sb-detail-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--sb-text-muted);
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background var(--sb-transition-fast);
    padding: 0;
  }
  .sb-atc-close:hover, .sb-detail-close:hover { background: var(--sb-bg-hover); }

  .sb-atc-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--sb-text-muted);
    text-transform: uppercase;
    letter-spacing: .04em;
    margin-bottom: 4px;
    display: block;
  }
  .sb-atc-variants { margin-bottom: 8px; }
  .sb-atc-variant-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .sb-atc-variant-btn {
    padding: 3px 8px;
    border: 1px solid var(--sb-border);
    border-radius: 5px;
    font-size: 10px;
    font-family: var(--sb-font);
    cursor: pointer;
    background: var(--sb-bg);
    color: var(--sb-text);
    transition: all var(--sb-transition-fast);
  }
  .sb-atc-variant-btn:hover:not(:disabled) {
    border-color: var(--sb-accent);
    color: var(--sb-accent);
  }
  .sb-atc-variant-active {
    background: var(--sb-accent) !important;
    color: #fff !important;
    border-color: var(--sb-accent) !important;
  }
  .sb-atc-variant-oos {
    opacity: .35;
    text-decoration: line-through;
    cursor: not-allowed;
  }

  .sb-atc-qty-row {
    margin-bottom: 8px;
  }
  .sb-atc-qty-controls {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1px solid var(--sb-border);
    border-radius: 6px;
    overflow: hidden;
    width: fit-content;
  }
  .sb-atc-qty-btn {
    width: 28px;
    height: 26px;
    border: none;
    background: var(--sb-bg-elevated);
    color: var(--sb-text);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--sb-transition-fast);
    font-family: var(--sb-font);
  }
  .sb-atc-qty-btn:hover:not(:disabled) { background: var(--sb-bg-hover); }
  .sb-atc-qty-btn:disabled { opacity: .3; cursor: not-allowed; }
  .sb-atc-qty-value {
    width: 30px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--sb-text);
    border-left: 1px solid var(--sb-border);
    border-right: 1px solid var(--sb-border);
    line-height: 26px;
  }

  .sb-atc-submit {
    width: 100%;
    padding: 6px;
    background: var(--sb-accent);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: background var(--sb-transition-fast);
    font-family: var(--sb-font);
  }
  .sb-atc-submit:hover:not(:disabled) { background: var(--sb-accent-hover); }
  .sb-atc-submit:disabled {
    background: var(--sb-bg-elevated);
    color: var(--sb-text-muted);
    border: 1px solid var(--sb-border);
    cursor: not-allowed;
  }

  /* ── Details panel ─────────────────────────────────────────────── */
  .sb-detail-panel {
    padding: 8px 10px 10px;
    border-top: 1px solid var(--sb-border-light);
    animation: sb-slide-down .15s ease;
  }
  .sb-detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .sb-detail-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--sb-text);
  }
  .sb-detail-body { font-size: 12px; }
  .sb-detail-name {
    font-weight: 600;
    color: var(--sb-text);
    margin-bottom: 2px;
    line-height: 1.35;
  }
  .sb-detail-price {
    font-size: 13px;
    font-weight: 700;
    color: var(--sb-accent);
    margin-bottom: 6px;
  }
  .sb-detail-desc {
    color: var(--sb-text-secondary);
    line-height: 1.5;
    font-size: 11.5px;
    margin-bottom: 8px;
  }
  .sb-detail-no-desc { font-style: italic; color: var(--sb-text-muted); }
  .sb-detail-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--sb-accent);
    text-decoration: none;
    transition: opacity var(--sb-transition-fast);
  }
  .sb-detail-link:hover { opacity: .75; }

  .sb-no-results {
    font-size: 13px;
    color: var(--sb-text-secondary);
    padding: 10px 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  @keyframes sb-slide-down {
    from { opacity: 0; max-height: 0; }
    to   { opacity: 1; max-height: 300px; }
  }

  /* ── Order card ────────────────────────────────────────────────── */
  .sb-order-card {
    width: 100%;
    background: var(--sb-bg);
    border: 1px solid var(--sb-border-light);
    border-radius: var(--sb-radius-md);
    overflow: hidden;
    margin-top: 8px;
    font-size: 12.5px;
  }
  .sb-order-header {
    padding: 12px 14px;
    background: var(--sb-bg-elevated);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .sb-order-number { font-weight: 700; font-size: 13px; color: var(--sb-text); }
  .sb-order-date { font-size: 11px; color: var(--sb-text-muted); margin-top: 2px; }
  .sb-order-pills { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }

  .sb-pill {
    display: inline-block;
    padding: 2px 8px;
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

  .sb-divider { border: none; border-top: 1px solid var(--sb-border-light); }

  .sb-order-items { padding: 10px 14px; display: flex; flex-direction: column; gap: 4px; }
  .sb-order-item  { display: flex; gap: 6px; align-items: baseline; }
  .sb-item-qty    { flex-shrink: 0; color: var(--sb-text-muted); font-size: 11px; min-width: 24px; }
  .sb-item-name   { color: var(--sb-text); line-height: 1.35; }

  .sb-order-details { padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; }
  .sb-order-row     { display: flex; gap: 8px; align-items: flex-start; }
  .sb-order-row-label { flex-shrink: 0; width: 64px; color: var(--sb-text-muted); font-size: 11px; }
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

  /* ── Cart card ─────────────────────────────────────────────────── */
  .sb-cart-card {
    width: 100%;
    background: var(--sb-bg);
    border: 1px solid var(--sb-border-light);
    border-radius: var(--sb-radius-md);
    overflow: hidden;
    margin-top: 8px;
    font-size: 12.5px;
  }
  .sb-cart-header {
    padding: 10px 14px;
    background: var(--sb-bg-elevated);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sb-cart-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sb-cart-icon { width: 18px; height: 18px; color: var(--sb-text-secondary); }
  .sb-cart-title { font-weight: 600; font-size: 13px; color: var(--sb-text); }
  .sb-cart-count {
    font-size: 11px;
    color: var(--sb-text-muted);
    background: var(--sb-bg);
    padding: 2px 8px;
    border-radius: 99px;
    border: 1px solid var(--sb-border);
  }

  .sb-cart-items { padding: 8px 14px; display: flex; flex-direction: column; gap: 8px; }
  .sb-cart-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--sb-border-light);
  }
  .sb-cart-item:last-child { border-bottom: none; }
  .sb-cart-item-img {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid var(--sb-border-light);
  }
  .sb-cart-item-info { flex: 1; min-width: 0; }
  .sb-cart-item-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--sb-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sb-cart-item-variant { font-size: 10.5px; color: var(--sb-text-muted); }
  .sb-cart-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
  .sb-cart-item-qty { font-size: 11px; color: var(--sb-text-muted); }
  .sb-cart-item-price { font-size: 12px; font-weight: 600; color: var(--sb-text); }

  .sb-cart-footer {
    padding: 10px 14px;
    border-top: 1px solid var(--sb-border-light);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sb-cart-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--sb-text-secondary);
  }
  .sb-cart-total-price { font-weight: 700; color: var(--sb-text); font-size: 14px; }
  .sb-cart-checkout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px;
    background: var(--sb-accent);
    color: #fff;
    border: none;
    border-radius: var(--sb-radius-sm);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: background var(--sb-transition-fast);
  }
  .sb-cart-checkout:hover { background: var(--sb-accent-hover); }

  /* ── Ticket form ───────────────────────────────────────────────── */
  .sb-ticket-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,.3);
    backdrop-filter: blur(2px);
    z-index: 10;
    display: flex;
    align-items: flex-end;
    animation: sb-fade-in .15s ease;
  }
  .sb-ticket-form {
    background: var(--sb-bg);
    border-radius: var(--sb-radius) var(--sb-radius) 0 0;
    width: 100%;
    max-height: 90%;
    overflow-y: auto;
    animation: sb-slide-up .25s cubic-bezier(.34,1.56,.64,1);
  }
  .sb-ticket-header {
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--sb-border-light);
  }
  .sb-ticket-header-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--sb-accent-light);
    color: var(--sb-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sb-ticket-header-icon svg { width: 18px; height: 18px; }
  .sb-ticket-form-title { font-weight: 600; font-size: 14px; color: var(--sb-text); }
  .sb-ticket-form-desc { font-size: 11.5px; color: var(--sb-text-muted); }
  .sb-ticket-close {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--sb-text-muted);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: background var(--sb-transition-fast);
  }
  .sb-ticket-close:hover { background: var(--sb-bg-hover); }
  .sb-ticket-close svg { width: 16px; height: 16px; }

  .sb-ticket-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .sb-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sb-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--sb-text-secondary);
  }
  .sb-input {
    padding: 9px 12px;
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-sm);
    font-size: 13px;
    font-family: var(--sb-font);
    color: var(--sb-text);
    background: var(--sb-bg);
    outline: none;
    transition: border-color var(--sb-transition-fast), box-shadow var(--sb-transition-fast);
  }
  .sb-input:focus {
    border-color: var(--sb-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--sb-accent) 12%, transparent);
  }
  .sb-input::placeholder { color: var(--sb-text-muted); }
  .sb-ticket-textarea {
    min-height: 80px;
    resize: vertical;
    line-height: 1.5;
  }

  .sb-ticket-error {
    font-size: 12px;
    color: #dc2626;
    background: #fef2f2;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid #fecaca;
  }
  :host(.sb-dark) .sb-ticket-error {
    background: rgba(220,38,38,.12);
    border-color: rgba(220,38,38,.3);
    color: #fca5a5;
  }

  .sb-ticket-submit {
    padding: 10px;
    background: var(--sb-accent);
    color: #fff;
    border: none;
    border-radius: var(--sb-radius-sm);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background var(--sb-transition-fast);
    font-family: var(--sb-font);
  }
  .sb-ticket-submit:hover:not(:disabled) { background: var(--sb-accent-hover); }
  .sb-ticket-submit:disabled { opacity: .5; cursor: not-allowed; }
  .sb-ticket-submit svg { width: 14px; height: 14px; }

  .sb-ticket-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: sb-spin .6s linear infinite;
  }

  /* ── Animations ────────────────────────────────────────────────── */
  @keyframes sb-panel-in {
    from { opacity: 0; transform: scale(0.92) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes sb-msg-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sb-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30%           { transform: translateY(-5px); }
  }
  @keyframes sb-blink {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0; }
  }
  @keyframes sb-pop {
    from { transform: scale(0); }
    to   { transform: scale(1); }
  }
  @keyframes sb-pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: .5; }
  }
  @keyframes sb-pulse-ring {
    0%   { transform: scale(0.9); opacity: .6; }
    50%  { transform: scale(1.05); opacity: .3; }
    100% { transform: scale(0.9); opacity: .6; }
  }
  @keyframes sb-hint-in {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes sb-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sb-slide-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes sb-spin {
    to { transform: rotate(360deg); }
  }
`;
