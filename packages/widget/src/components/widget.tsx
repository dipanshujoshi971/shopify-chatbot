/**
 * packages/widget/src/components/Widget.tsx
 *
 * Root Preact component for the Shopbot chat widget.
 *
 * State machine:
 *   consent-pending → consent-denied → [blocked]
 *                  ↓
 *               ready → streaming → ready (loop)
 *
 * Rich UI:
 *   - Streams text deltas as they arrive (cursor animation)
 *   - Renders ProductCarousel when search_shop_catalog tool fires
 *   - Renders OrderCard when get_order_status tool fires
 */

import { h, Fragment }               from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { WidgetConfig, ChatMessage, ConsentStatus, AnnotationEvent } from '../types.js';
import { streamChat, newConversationId }             from '../api/stream.js';
import { getConsentStatus, requestConsent, onConsentChange } from '../consent/shopify.js';
import { ProductCarousel }                           from './ProductCarousel.js';
import { OrderCard }                                 from './OrderCard.js';

// ------------------------------------------------------------------ //
// Helpers
// ------------------------------------------------------------------ //

let msgCounter = 0;
function uid(): string { return `msg-${++msgCounter}-${Date.now()}`; }

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(navigator.language, {
    hour: '2-digit', minute: '2-digit',
  });
}

// ------------------------------------------------------------------ //
// Rich annotation renderer
// ------------------------------------------------------------------ //

function RichContent({ annotation }: { annotation: AnnotationEvent }) {
  if (annotation.toolName === 'search_shop_catalog') {
    return <ProductCarousel data={annotation.result} />;
  }
  if (annotation.toolName === 'get_order_status') {
    return <OrderCard data={annotation.result} />;
  }
  return null;
}

// ------------------------------------------------------------------ //
// Message bubble
// ------------------------------------------------------------------ //

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  return (
    <div class={`sb-msg sb-msg-${msg.role}`}>
      <div
        class={`sb-bubble sb-bubble-${msg.role}${msg.streaming ? ' sb-cursor' : ''}`}
      >
        {msg.content}
      </div>

      {/* Rich card below assistant bubble */}
      {!isUser && msg.annotation && (
        <RichContent annotation={msg.annotation} />
      )}

      <span class="sb-msg-time">{formatTime(msg.timestamp)}</span>
    </div>
  );
}

// ------------------------------------------------------------------ //
// Consent banner (shown when status === 'unknown')
// ------------------------------------------------------------------ //

function ConsentBanner({
  onAccept,
  onDecline,
}: {
  onAccept : () => void;
  onDecline: () => void;
}) {
  return (
    <div class="sb-consent-banner" role="region" aria-label="Cookie consent">
      <p>
        This chat assistant uses cookies to remember your conversation and
        improve your experience. Do you consent to this?
      </p>
      <div class="sb-consent-actions">
        <button class="sb-consent-accept" onClick={onAccept}>
          Accept &amp; Chat
        </button>
        <button class="sb-consent-decline" onClick={onDecline}>
          Decline
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ //
// Empty state
// ------------------------------------------------------------------ //

function EmptyState({ title }: { title: string }) {
  return (
    <div class="sb-empty-state">
      <div class="sb-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p class="sb-empty-title">Hi there! 👋</p>
      <p class="sb-empty-subtitle">
        Ask me anything about products, orders, or store policies at{' '}
        <strong>{title}</strong>.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ //
// Main Widget component
// ------------------------------------------------------------------ //

interface WidgetProps {
  config: WidgetConfig;
}

export function Widget({ config }: WidgetProps) {
  const { apiKey, shopDomain, apiBaseUrl, title = 'Our Store', position = 'right' } = config;

  // ── State ──────────────────────────────────────────────────────────
  const [open,           setOpen]           = useState(false);
  const [messages,       setMessages]       = useState<ChatMessage[]>([]);
  const [input,          setInput]          = useState('');
  const [streaming,      setStreaming]       = useState(false);
  const [consent,        setConsent]         = useState<ConsentStatus>(() => getConsentStatus());
  const [conversationId, setConversationId]  = useState(() => newConversationId());
  const [unread,         setUnread]          = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const panelRef       = useRef<HTMLDivElement>(null);
  const abortRef       = useRef<AbortController | null>(null);

  // ── Expose shop domain for ProductCarousel links ────────────────────
  useEffect(() => {
    (window as any).__shopbot_domain__ = shopDomain;
  }, [shopDomain]);

  // ── CSS accent color override ───────────────────────────────────────
  useEffect(() => {
    if (config.accentColor) {
      // The shadow host's :host won't cascade in so we set it directly
      const host = document.querySelector('shopbot-widget')?.shadowRoot?.host as HTMLElement | null;
      host?.style.setProperty('--sb-accent', config.accentColor);
    }
  }, [config.accentColor]);

  // ── Subscribe to Shopify consent changes ───────────────────────────
  useEffect(() => {
    return onConsentChange(setConsent);
  }, []);

  // ── Auto-scroll to bottom ──────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Track unread while closed ──────────────────────────────────────
  useEffect(() => {
    if (!open && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        setUnread((n) => n + 1);
      }
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  // ── Auto-resize textarea ───────────────────────────────────────────
  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`;
  }, []);

  // ── Send message ───────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id       : uid(),
      role     : 'user',
      content  : text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Placeholder assistant message (streaming)
    const assistantId = uid();
    const assistantMsg: ChatMessage = {
      id        : assistantId,
      role      : 'assistant',
      content   : '',
      timestamp : Date.now(),
      streaming : true,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setStreaming(true);

    // Abort any previous in-flight stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const gen = streamChat({
        apiBaseUrl,
        apiKey,
        shopDomain,
        conversationId,
        message: text,
      });

      // Track latest annotation for this response
      let latestAnnotation: AnnotationEvent | undefined;

      for await (const event of gen) {
        switch (event.type) {
          case 'text':
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.content }
                  : m,
              ),
            );
            break;

          case 'data':
            // Process annotations — last tool result wins for the card
            for (const annotation of event.content) {
              if (
                annotation.toolName === 'search_shop_catalog' ||
                annotation.toolName === 'get_order_status'
              ) {
                latestAnnotation = annotation;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, annotation: latestAnnotation }
                      : m,
                  ),
                );
              }
            }
            break;

          case 'error':
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: `⚠️ ${event.content}`, streaming: false }
                  : m,
              ),
            );
            break;

          case 'finish':
            // Mark streaming done
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, streaming: false } : m,
              ),
            );
            break;
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content  : '⚠️ Something went wrong. Please try again.',
                streaming: false,
              }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, apiBaseUrl, apiKey, shopDomain, conversationId]);

  // ── Keyboard handler ───────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  // ── Consent handlers ───────────────────────────────────────────────
  const handleConsentAccept = useCallback(async () => {
    const status = await requestConsent();
    setConsent(status);
  }, []);

  const handleConsentDecline = useCallback(() => {
    setConsent('denied');
    setOpen(false);
  }, []);

  // ── Toggle panel ───────────────────────────────────────────────────
  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // ── Icons (inlined SVGs, no external font icon dep) ───────────────

  const ChatIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
      <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
    </svg>
  );

  const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
  );

  const BotIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h2a4 4 0 014 4v6a4 4 0 01-4 4H9a4 4 0 01-4-4v-6a4 4 0 014-4h2V5.73A2 2 0 0112 2zm-3 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zm-3 3.5c-1.1 0-2 .67-2 1.5h4c0-.83-.9-1.5-2-1.5z"/>
    </svg>
  );

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────── */}
      {open && (
        <div
          class="sb-panel"
          ref={panelRef}
          data-position={position}
          role="dialog"
          aria-label={`Chat with ${title}`}
          aria-modal="true"
        >
          {/* Header */}
          <div class="sb-header">
            <div class="sb-header-avatar"><BotIcon /></div>
            <div class="sb-header-info">
              <p class="sb-header-title">{title}</p>
              <p class="sb-header-subtitle">
                <span class="sb-online-dot" aria-hidden="true" />
                {streaming ? 'Typing…' : 'Online · AI Assistant'}
              </p>
            </div>
            <button
              class="sb-close-btn"
              onClick={toggleOpen}
              aria-label="Close chat"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Consent banner or messages */}
          {consent === 'unknown' ? (
            <>
              <div class="sb-messages" />
              <ConsentBanner
                onAccept={handleConsentAccept}
                onDecline={handleConsentDecline}
              />
            </>
          ) : consent === 'denied' ? (
            <div class="sb-messages">
              <div class="sb-error-msg">
                Chat is disabled because cookie consent was not granted.
                You can update your cookie preferences in the footer.
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div class="sb-messages" role="log" aria-live="polite" aria-label="Chat messages">
                {messages.length === 0 ? (
                  <EmptyState title={title} />
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))
                )}

                {/* Typing indicator when streaming but no content yet */}
                {streaming && messages[messages.length - 1]?.content === '' && (
                  <div class="sb-typing" aria-label="Assistant is typing">
                    <span /><span /><span />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div class="sb-input-area">
                <textarea
                  ref={textareaRef}
                  class="sb-textarea"
                  placeholder="Ask about products, orders…"
                  value={input}
                  rows={1}
                  disabled={streaming}
                  onInput={(e) => {
                    setInput((e.target as HTMLTextAreaElement).value);
                    resizeTextarea();
                  }}
                  onKeyDown={handleKeyDown}
                  aria-label="Chat message input"
                />
                <button
                  class="sb-send-btn"
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Launcher button ──────────────────────────────────────── */}
      <button
        class="sb-launcher"
        data-position={position}
        onClick={toggleOpen}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
        {!open && unread > 0 && (
          <span class="sb-unread-badge" aria-label={`${unread} unread messages`}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  );
}