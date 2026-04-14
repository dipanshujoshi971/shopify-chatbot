/**
 * packages/widget/src/styles.ts
 *
 * Complete widget CSS — injected into Shadow DOM for full isolation.
 *
 * Design:
 *   - Modern glassmorphic aesthetic with smooth gradients
 *   - Fluid animations and micro-interactions
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
    --sb-accent:         #6366f1;
    --sb-accent-hover:   #4f46e5;
    --sb-accent-light:   rgba(99,102,241,.1);
    --sb-accent-subtle:  rgba(99,102,241,.05);
    --sb-accent-fg:      #ffffff;

    --sb-bg:             #ffffff;
    --sb-bg-elevated:    #f8fafc;
    --sb-bg-hover:       #f1f5f9;
    --sb-border:         #e2e8f0;
    --sb-border-light:   #f1f5f9;
    --sb-text:           #0f172a;
    --sb-text-secondary: #475569;
    --sb-text-muted:     #94a3b8;

    --sb-radius:         20px;
    --sb-radius-md:      14px;
    --sb-radius-sm:      10px;
    --sb-shadow:         0 25px 50px -12px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.03);
    --sb-shadow-sm:      0 4px 12px rgba(0,0,0,.06);
    --sb-shadow-btn:     0 2px 8px rgba(0,0,0,.08);

    --sb-font:           'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
                         Roboto, Helvetica, Arial, sans-serif;
    --sb-font-size:      14px;
    --sb-transition:     200ms cubic-bezier(.4,0,.2,1);
    --sb-transition-fast: 150ms cubic-bezier(.4,0,.2,1);
    --sb-transition-spring: 400ms cubic-bezier(.34,1.56,.64,1);

    --sb-width:          400px;
    --sb-height:         600px;

    font-family: var(--sb-font);
    font-size: var(--sb-font-size);
    line-height: 1.5;
    color: var(--sb-text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Dark mode ────────────────────────────────────────────────── */
  :host(.sb-dark) {
    --sb-accent-light:   rgba(99,102,241,.15);
    --sb-accent-subtle:  rgba(99,102,241,.08);

    --sb-bg:             #0f172a;
    --sb-bg-elevated:    #1e293b;
    --sb-bg-hover:       #334155;
    --sb-border:         #334155;
    --sb-border-light:   #1e293b;
    --sb-text:           #f1f5f9;
    --sb-text-secondary: #94a3b8;
    --sb-text-muted:     #64748b;

    --sb-shadow:         0 25px 50px -12px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05);
    --sb-shadow-sm:      0 4px 12px rgba(0,0,0,.3);
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
    background: linear-gradient(135deg, var(--sb-accent) 0%, var(--sb-accent-hover) 100%);
    color: var(--sb-accent-fg);
    box-shadow: 0 8px 32px rgba(99,102,241,.35),
                0 2px 8px rgba(0,0,0,.08);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--sb-transition), box-shadow var(--sb-transition);
    overflow: visible;
  }
  .sb-launcher:hover {
    transform: scale(1.08);
    box-shadow: 0 12px 40px rgba(99,102,241,.45),
                0 4px 12px rgba(0,0,0,.1);
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
    top: -4px;
    right: -4px;
    min-width: 22px;
    height: 22px;
    border-radius: 11px;
    background: #ef4444;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    border: 3px solid var(--sb-bg);
    animation: sb-pop .3s var(--sb-transition-spring);
  }

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
    padding: 12px 16px;
    max-width: 280px;
    font-size: 13px;
    color: var(--sb-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: sb-hint-in .3s var(--sb-transition-spring);
    transition: all var(--sb-transition);
  }
  .sb-hint:hover {
    background: var(--sb-bg-hover);
    transform: translateY(-2px);
    box-shadow: var(--sb-shadow);
  }
  .sb-hint[data-position="left"] { right: auto; left: 24px; }
  .sb-hint-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--sb-text-muted);
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background var(--sb-transition-fast);
  }
  .sb-hint-close:hover { background: var(--sb-bg-hover); }
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
    animation: sb-panel-in .3s cubic-bezier(.34,1.56,.64,1);
  }
  .sb-panel[data-position="left"] {
    right: auto;
    left: 24px;
    transform-origin: bottom left;
  }

  @media (max-width: 420px) {
    .sb-panel {
      width: 100vw;
      height: 100dvh;
      right: 0;
      bottom: 0;
      border-radius: 0;
      max-height: 100dvh;
    }
    .sb-launcher { bottom: 16px; right: 16px; }
    .sb-launcher[data-position="left"] { left: 16px; }
  }

  /* ── Header ────────────────────────────────────────────────────── */
  .sb-header {
    padding: 16px 18px;
    background: linear-gradient(135deg, var(--sb-accent) 0%, var(--sb-accent-hover) 100%);
    color: var(--sb-accent-fg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }
  .sb-header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255,255,255,.1) 0%, transparent 70%);
    pointer-events: none;
  }
  .sb-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    position: relative;
    z-index: 1;
  }
  .sb-header-avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255,255,255,.2);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sb-header-avatar svg { width: 22px; height: 22px; }
  .sb-header-info { min-width: 0; }
  .sb-header-title {
    font-weight: 700;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }
  .sb-header-subtitle {
    font-size: 12px;
    opacity: .85;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }
  .sb-online-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    animation: sb-pulse 2s infinite;
    box-shadow: 0 0 0 3px rgba(74,222,128,.25);
  }
  .sb-header-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }
  .sb-header-btn {
    background: rgba(255,255,255,.12);
    border: none;
    border-radius: 10px;
    width: 34px;
    height: 34px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--sb-transition-fast);
    backdrop-filter: blur(4px);
  }
  .sb-header-btn:hover {
    background: rgba(255,255,255,.25);
    transform: scale(1.05);
  }
  .sb-header-btn svg { width: 16px; height: 16px; }

  /* ── Messages area ─────────────────────────────────────────────── */
  .sb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
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
    gap: 10px;
    max-width: 88%;
    animation: sb-msg-in .25s ease;
  }
  .sb-msg-user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
  .sb-msg-assistant { align-self: flex-start; }
  /* Rich content messages (carousels, cards) need full width */
  .sb-msg-assistant:has(.sb-carousel-wrap),
  .sb-msg-assistant:has(.sb-cart-card),
  .sb-msg-assistant:has(.sb-order-card) {
    max-width: 100%;
  }

  .sb-msg-avatar {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--sb-accent-light);
    color: var(--sb-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .sb-msg-avatar svg { width: 16px; height: 16px; }

  .sb-msg-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    overflow: visible;
    max-width: 100%;
  }
  .sb-msg-user .sb-msg-content { align-items: flex-end; }
  .sb-msg-assistant .sb-msg-content { align-items: flex-start; }

  .sb-bubble {
    padding: 12px 16px;
    border-radius: 20px;
    font-size: 13.5px;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .sb-bubble-user {
    background: linear-gradient(135deg, var(--sb-accent) 0%, var(--sb-accent-hover) 100%);
    color: #fff;
    border-bottom-right-radius: 6px;
    box-shadow: 0 2px 8px rgba(99,102,241,.2);
  }
  .sb-bubble-assistant {
    background: var(--sb-bg);
    color: var(--sb-text);
    border: 1px solid var(--sb-border-light);
    border-bottom-left-radius: 6px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
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
    text-decoration-thickness: 1px;
    cursor: pointer;
    word-break: break-all;
    transition: opacity var(--sb-transition-fast);
  }
  .sb-chat-link:hover { opacity: .75; }
  .sb-bubble-user .sb-chat-link {
    color: #fff;
    text-decoration-color: rgba(255,255,255,.5);
  }
  .sb-chat-code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 12px;
    background: rgba(0,0,0,.05);
    padding: 2px 6px;
    border-radius: 6px;
  }
  :host(.sb-dark) .sb-chat-code { background: rgba(255,255,255,.08); }

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
    border-radius: 20px;
    border-bottom-left-radius: 6px;
    padding: 14px 18px;
    display: flex;
    gap: 5px;
    align-items: center;
    margin-left: 42px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
  }
  .sb-typing span:not(.sb-typing-label) {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--sb-accent);
    opacity: .5;
    animation: sb-bounce .9s infinite;
  }
  .sb-typing span:not(.sb-typing-label):nth-last-child(2) { animation-delay: .15s; }
  .sb-typing span:not(.sb-typing-label):last-child { animation-delay: .3s; }
  .sb-typing-label {
    font-size: 12px;
    color: var(--sb-text-muted);
    font-weight: 500;
    margin-right: 2px;
    white-space: nowrap;
  }

  /* ── Consent banner ────────────────────────────────────────────── */
  .sb-consent-banner {
    margin: 16px;
    padding: 20px;
    background: var(--sb-bg);
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-md);
    font-size: 13px;
    color: var(--sb-text-secondary);
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: center;
    text-align: center;
  }
  .sb-consent-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--sb-accent-light);
    color: var(--sb-accent);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sb-consent-actions { display: flex; gap: 8px; width: 100%; }
  .sb-consent-accept {
    flex: 1;
    padding: 10px;
    background: linear-gradient(135deg, var(--sb-accent), var(--sb-accent-hover));
    color: #fff;
    border: none;
    border-radius: var(--sb-radius-sm);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--sb-transition-fast);
    box-shadow: 0 2px 8px rgba(99,102,241,.2);
  }
  .sb-consent-accept:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,.3);
  }
  .sb-consent-decline {
    padding: 10px 16px;
    background: transparent;
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-sm);
    font-size: 13px;
    color: var(--sb-text-secondary);
    cursor: pointer;
    transition: all var(--sb-transition-fast);
  }
  .sb-consent-decline:hover { background: var(--sb-bg-hover); }

  /* ── Empty state ───────────────────────────────────────────────── */
  .sb-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 32px 20px;
    gap: 8px;
    text-align: center;
  }
  .sb-empty-bot {
    position: relative;
    margin-bottom: 12px;
  }
  .sb-empty-bot-icon {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--sb-accent), var(--sb-accent-hover));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    box-shadow: 0 8px 24px rgba(99,102,241,.25);
  }
  .sb-empty-bot-icon svg { width: 28px; height: 28px; }
  .sb-empty-pulse {
    position: absolute;
    inset: -6px;
    border-radius: 22px;
    background: var(--sb-accent-light);
    animation: sb-pulse-ring 2.5s ease infinite;
    z-index: 0;
  }
  .sb-empty-greeting {
    font-weight: 700;
    font-size: 17px;
    color: var(--sb-text);
    margin-top: 4px;
    letter-spacing: -0.02em;
  }
  .sb-empty-name {
    font-size: 13px;
    color: var(--sb-text-secondary);
    margin-bottom: 16px;
  }

  /* ── Starter buttons ───────────────────────────────────────────── */
  .sb-starters {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 300px;
    margin-top: 4px;
  }
  .sb-starter-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px;
    background: var(--sb-bg);
    border: 1px solid var(--sb-border);
    border-radius: var(--sb-radius-md);
    font-size: 13px;
    color: var(--sb-text);
    cursor: pointer;
    text-align: left;
    transition: all var(--sb-transition);
    font-family: var(--sb-font);
    font-weight: 500;
  }
  .sb-starter-btn:hover {
    background: var(--sb-accent-subtle);
    border-color: var(--sb-accent);
    color: var(--sb-accent);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,.1);
  }
  .sb-starter-text { flex: 1; }
  .sb-starter-arrow {
    width: 16px;
    height: 16px;
    color: var(--sb-text-muted);
    flex-shrink: 0;
    transition: transform var(--sb-transition), color var(--sb-transition);
  }
  .sb-starter-btn:hover .sb-starter-arrow {
    transform: translateX(4px);
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
    padding: 12px 16px;
    max-width: 90%;
    text-align: center;
    line-height: 1.5;
  }
  :host(.sb-dark) .sb-error-msg {
    background: rgba(220,38,38,.1);
    border-color: rgba(220,38,38,.25);
    color: #fca5a5;
  }

  /* ── Input area ────────────────────────────────────────────────── */
  .sb-input-area {
    padding: 12px 16px;
    background: var(--sb-bg);
    border-top: 1px solid var(--sb-border-light);
    display: flex;
    gap: 10px;
    align-items: flex-end;
    flex-shrink: 0;
  }
  .sb-textarea {
    flex: 1;
    padding: 10px 16px;
    border: 1.5px solid var(--sb-border);
    border-radius: 24px;
    font-size: 13.5px;
    font-family: var(--sb-font);
    line-height: 1.45;
    resize: none;
    outline: none;
    background: var(--sb-bg-elevated);
    color: var(--sb-text);
    max-height: 100px;
    overflow-y: auto;
    transition: border-color var(--sb-transition-fast), box-shadow var(--sb-transition-fast),
                background var(--sb-transition-fast);
  }
  .sb-textarea:focus {
    border-color: var(--sb-accent);
    box-shadow: 0 0 0 4px rgba(99,102,241,.1);
    background: var(--sb-bg);
  }
  .sb-textarea::placeholder { color: var(--sb-text-muted); }
  .sb-textarea:disabled { opacity: .5; cursor: not-allowed; }

  .sb-send-btn {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, var(--sb-accent), var(--sb-accent-hover));
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--sb-transition-fast);
    box-shadow: 0 4px 12px rgba(99,102,241,.25);
  }
  .sb-send-btn:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow: 0 6px 16px rgba(99,102,241,.35);
  }
  .sb-send-btn:active:not(:disabled) { transform: scale(0.93); }
  .sb-send-btn:disabled { opacity: .3; cursor: not-allowed; box-shadow: none; }
  .sb-send-btn svg { width: 17px; height: 17px; }

  /* ── Powered by ────────────────────────────────────────────────── */
  .sb-powered-by {
    text-align: center;
    font-size: 10.5px;
    color: var(--sb-text-muted);
    padding: 8px;
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
    margin-bottom: 10px;
    padding: 0 2px;
  }
  .sb-carousel-label {
    font-size: 12px;
    color: var(--sb-text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  .sb-carousel-nav {
    display: flex;
    gap: 4px;
  }
  .sb-carousel-nav-btn {
    width: 28px;
    height: 28px;
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
    transform: scale(1.05);
  }
  .sb-carousel-nav-btn svg { width: 14px; height: 14px; }

  .sb-carousel-track {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
    scrollbar-width: none;
    overscroll-behavior-x: contain;
    touch-action: pan-x;
  }
  .sb-carousel-track::-webkit-scrollbar { display: none; }
  .sb-carousel-track > * {
    scroll-snap-align: start;
    flex: 0 0 auto;
    width: 176px;
    min-width: 176px;
  }

  .sb-carousel-dots {
    display: flex;
    justify-content: center;
    gap: 5px;
    padding-top: 8px;
  }
  .sb-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sb-border);
    transition: all var(--sb-transition-fast);
  }
  .sb-dot-active {
    background: var(--sb-accent);
    transform: scale(1.4);
  }

  .sb-product-card {
    width: 176px;
    min-width: 176px;
    max-width: 176px;
    border: 1px solid var(--sb-border-light);
    border-radius: var(--sb-radius-md);
    overflow: hidden;
    background: var(--sb-bg);
    transition: all var(--sb-transition);
  }
  .sb-product-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,.08);
    border-color: var(--sb-border);
    transform: translateY(-3px);
  }

  .sb-product-img-wrap {
    position: relative;
    width: 100%;
    height: 176px;
    max-height: 176px;
    background: var(--sb-bg-elevated);
    overflow: hidden;
  }
  .sb-product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform .4s ease;
  }
  .sb-product-card:hover .sb-product-img { transform: scale(1.06); }

  .sb-product-img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sb-border);
  }
  .sb-product-img-placeholder svg { width: 36px; height: 36px; }

  .sb-sale-badge, .sb-oos-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 3px 8px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .03em;
  }
  .sb-sale-badge {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: #fff;
    box-shadow: 0 2px 6px rgba(239,68,68,.3);
  }
  .sb-oos-badge {
    background: rgba(0,0,0,.7);
    color: #fff;
    backdrop-filter: blur(4px);
  }

  .sb-product-info { padding: 10px 12px 8px; }
  .sb-product-title {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--sb-text);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }
  .sb-product-price-line {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--sb-text);
    margin-bottom: 8px;
  }
  .sb-price-sale { color: #ef4444; }
  .sb-product-compare {
    font-size: 11px;
    color: var(--sb-text-muted);
    text-decoration: line-through;
    font-weight: 400;
  }

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
    gap: 4px;
    padding: 6px 4px;
    border: 1px solid var(--sb-border);
    border-radius: 8px;
    font-size: 10.5px;
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
    padding: 10px 12px 12px;
    border-top: 1px solid var(--sb-border-light);
    animation: sb-slide-down .2s ease;
  }
  .sb-atc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .sb-atc-title {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--sb-text);
  }
  .sb-atc-close, .sb-detail-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--sb-text-muted);
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all var(--sb-transition-fast);
    padding: 0;
  }
  .sb-atc-close:hover, .sb-detail-close:hover {
    background: var(--sb-bg-hover);
    color: var(--sb-text);
  }

  .sb-atc-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--sb-text-muted);
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 5px;
    display: block;
  }
  .sb-atc-variants { margin-bottom: 8px; }
  .sb-atc-variant-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .sb-atc-variant-btn {
    padding: 4px 10px;
    border: 1.5px solid var(--sb-border);
    border-radius: 7px;
    font-size: 10.5px;
    font-family: var(--sb-font);
    font-weight: 500;
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
    background: linear-gradient(135deg, var(--sb-accent), var(--sb-accent-hover)) !important;
    color: #fff !important;
    border-color: var(--sb-accent) !important;
    box-shadow: 0 2px 6px rgba(99,102,241,.25);
  }
  .sb-atc-variant-oos {
    opacity: .3;
    text-decoration: line-through;
    cursor: not-allowed;
  }

  .sb-atc-qty-row {
    margin-bottom: 10px;
  }
  .sb-atc-qty-controls {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1.5px solid var(--sb-border);
    border-radius: 8px;
    overflow: hidden;
    width: fit-content;
  }
  .sb-atc-qty-btn {
    width: 30px;
    height: 28px;
    border: none;
    background: var(--sb-bg-elevated);
    color: var(--sb-text);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--sb-transition-fast);
    font-family: var(--sb-font);
  }
  .sb-atc-qty-btn:hover:not(:disabled) {
    background: var(--sb-bg-hover);
    color: var(--sb-accent);
  }
  .sb-atc-qty-btn:disabled { opacity: .3; cursor: not-allowed; }
  .sb-atc-qty-value {
    width: 32px;
    text-align: center;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--sb-text);
    border-left: 1.5px solid var(--sb-border);
    border-right: 1.5px solid var(--sb-border);
    line-height: 28px;
  }

  .sb-atc-submit {
    width: 100%;
    padding: 8px;
    background: linear-gradient(135deg, var(--sb-accent), var(--sb-accent-hover));
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: all var(--sb-transition-fast);
    font-family: var(--sb-font);
    box-shadow: 0 2px 8px rgba(99,102,241,.2);
  }
  .sb-atc-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,.3);
  }
  .sb-atc-submit:disabled {
    background: var(--sb-bg-elevated);
    color: var(--sb-text-muted);
    border: 1px solid var(--sb-border);
    cursor: not-allowed;
    box-shadow: none;
  }

  /* ── Details panel ─────────────────────────────────────────────── */
  .sb-detail-panel {
    padding: 10px 12px 12px;
    border-top: 1px solid var(--sb-border-light);
    animation: sb-slide-down .2s ease;
  }
  .sb-detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .sb-detail-title {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--sb-text);
  }
  .sb-detail-body { font-size: 12px; }
  .sb-detail-name {
    font-weight: 600;
    color: var(--sb-text);
    margin-bottom: 3px;
    line-height: 1.35;
  }
  .sb-detail-price {
    font-size: 14px;
    font-weight: 700;
    color: var(--sb-accent);
    margin-bottom: 8px;
  }
  .sb-detail-desc {
    color: var(--sb-text-secondary);
    line-height: 1.55;
    font-size: 11.5px;
    margin-bottom: 10px;
  }
  .sb-detail-no-desc { font-style: italic; color: var(--sb-text-muted); }
  .sb-detail-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--sb-accent);
    text-decoration: none;
    transition: opacity var(--sb-transition-fast);
  }
  .sb-detail-link:hover { opacity: .75; }

  .sb-no-results {
    font-size: 13px;
    color: var(--sb-text-secondary);
    padding: 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;
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
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
  }
  .sb-order-header {
    padding: 14px 16px;
    background: var(--sb-bg-elevated);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .sb-order-number {
    font-weight: 700;
    font-size: 14px;
    color: var(--sb-text);
    letter-spacing: -0.01em;
  }
  .sb-order-date { font-size: 11px; color: var(--sb-text-muted); margin-top: 3px; }
  .sb-order-pills { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }

  .sb-pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .03em;
    text-transform: capitalize;
  }
  .sb-pill-green { background: #dcfce7; color: #15803d; }
  .sb-pill-amber { background: #fef9c3; color: #92400e; }
  .sb-pill-red   { background: #fee2e2; color: #991b1b; }
  .sb-pill-blue  { background: #dbeafe; color: #1e40af; }
  .sb-pill-grey  { background: var(--sb-bg-elevated); color: var(--sb-text-muted); border: 1px solid var(--sb-border); }

  :host(.sb-dark) .sb-pill-green { background: rgba(22,163,74,.15); color: #4ade80; }
  :host(.sb-dark) .sb-pill-amber { background: rgba(234,179,8,.15); color: #fbbf24; }
  :host(.sb-dark) .sb-pill-red   { background: rgba(220,38,38,.15); color: #fca5a5; }
  :host(.sb-dark) .sb-pill-blue  { background: rgba(59,130,246,.15); color: #93c5fd; }

  .sb-divider { border: none; border-top: 1px solid var(--sb-border-light); }

  .sb-order-items { padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
  .sb-order-item  { display: flex; gap: 8px; align-items: baseline; }
  .sb-item-qty    { flex-shrink: 0; color: var(--sb-text-muted); font-size: 11px; min-width: 24px; font-weight: 600; }
  .sb-item-name   { color: var(--sb-text); line-height: 1.4; }

  .sb-order-details { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
  .sb-order-row     { display: flex; gap: 10px; align-items: flex-start; }
  .sb-order-row-label { flex-shrink: 0; width: 64px; color: var(--sb-text-muted); font-size: 11px; font-weight: 600; }
  .sb-order-row-value { color: var(--sb-text); flex: 1; }

  .sb-tracking-link {
    color: var(--sb-accent);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    transition: opacity var(--sb-transition-fast);
  }
  .sb-tracking-link:hover { opacity: .75; }
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
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
  }
  .sb-cart-header {
    padding: 12px 16px;
    background: var(--sb-bg-elevated);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sb-cart-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sb-cart-icon { width: 18px; height: 18px; color: var(--sb-text-secondary); }
  .sb-cart-title { font-weight: 700; font-size: 13px; color: var(--sb-text); }
  .sb-cart-count {
    font-size: 11px;
    font-weight: 600;
    color: var(--sb-accent);
    background: var(--sb-accent-light);
    padding: 3px 10px;
    border-radius: 99px;
  }

  .sb-cart-items { padding: 10px 16px; display: flex; flex-direction: column; gap: 8px; }
  .sb-cart-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--sb-border-light);
  }
  .sb-cart-item:last-child { border-bottom: none; }
  .sb-cart-item-img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid var(--sb-border-light);
  }
  .sb-cart-item-info { flex: 1; min-width: 0; }
  .sb-cart-item-title {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--sb-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sb-cart-item-variant { font-size: 11px; color: var(--sb-text-muted); margin-top: 1px; }
  .sb-cart-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .sb-cart-item-qty { font-size: 11px; color: var(--sb-text-muted); font-weight: 600; }
  .sb-cart-item-price { font-size: 12.5px; font-weight: 700; color: var(--sb-text); }

  .sb-cart-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--sb-border-light);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sb-cart-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--sb-text-secondary);
    font-weight: 500;
  }
  .sb-cart-total-price { font-weight: 800; color: var(--sb-text); font-size: 15px; }
  .sb-cart-checkout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background: linear-gradient(135deg, var(--sb-accent), var(--sb-accent-hover));
    color: #fff;
    border: none;
    border-radius: var(--sb-radius-sm);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: all var(--sb-transition-fast);
    box-shadow: 0 2px 8px rgba(99,102,241,.2);
  }
  .sb-cart-checkout:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99,102,241,.3);
  }

  /* ── Ticket form ───────────────────────────────────────────────── */
  .sb-ticket-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,.4);
    backdrop-filter: blur(4px);
    z-index: 10;
    display: flex;
    align-items: flex-end;
    animation: sb-fade-in .2s ease;
  }
  .sb-ticket-form {
    background: var(--sb-bg);
    border-radius: var(--sb-radius) var(--sb-radius) 0 0;
    width: 100%;
    max-height: 90%;
    overflow-y: auto;
    animation: sb-slide-up .3s cubic-bezier(.34,1.56,.64,1);
  }
  .sb-ticket-header {
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--sb-border-light);
  }
  .sb-ticket-header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--sb-accent-light);
    color: var(--sb-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sb-ticket-header-icon svg { width: 20px; height: 20px; }
  .sb-ticket-form-title { font-weight: 700; font-size: 15px; color: var(--sb-text); }
  .sb-ticket-form-desc { font-size: 12px; color: var(--sb-text-muted); margin-top: 1px; }
  .sb-ticket-close {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--sb-text-muted);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all var(--sb-transition-fast);
  }
  .sb-ticket-close:hover {
    background: var(--sb-bg-hover);
    color: var(--sb-text);
  }
  .sb-ticket-close svg { width: 16px; height: 16px; }

  .sb-ticket-body {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .sb-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .sb-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--sb-text-secondary);
  }
  .sb-input {
    padding: 10px 14px;
    border: 1.5px solid var(--sb-border);
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
    box-shadow: 0 0 0 4px rgba(99,102,241,.1);
  }
  .sb-input::placeholder { color: var(--sb-text-muted); }
  .sb-ticket-textarea {
    min-height: 88px;
    resize: vertical;
    line-height: 1.55;
  }

  .sb-ticket-error {
    font-size: 12px;
    color: #dc2626;
    background: #fef2f2;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #fecaca;
  }
  :host(.sb-dark) .sb-ticket-error {
    background: rgba(220,38,38,.1);
    border-color: rgba(220,38,38,.25);
    color: #fca5a5;
  }

  .sb-ticket-submit {
    padding: 11px;
    background: linear-gradient(135deg, var(--sb-accent), var(--sb-accent-hover));
    color: #fff;
    border: none;
    border-radius: var(--sb-radius-sm);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all var(--sb-transition-fast);
    font-family: var(--sb-font);
    box-shadow: 0 2px 8px rgba(99,102,241,.2);
  }
  .sb-ticket-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,.3);
  }
  .sb-ticket-submit:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
  .sb-ticket-submit svg { width: 15px; height: 15px; }

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
    from { opacity: 0; transform: scale(0.92) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes sb-msg-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sb-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: .4; }
    30%           { transform: translateY(-6px); opacity: 1; }
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
    50%      { opacity: .4; }
  }
  @keyframes sb-pulse-ring {
    0%   { transform: scale(0.9); opacity: .5; }
    50%  { transform: scale(1.08); opacity: .2; }
    100% { transform: scale(0.9); opacity: .5; }
  }
  @keyframes sb-hint-in {
    from { opacity: 0; transform: translateY(10px) scale(0.95); }
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
