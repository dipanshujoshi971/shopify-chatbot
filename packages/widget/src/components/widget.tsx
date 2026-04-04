/**
 * packages/widget/src/components/widget.tsx
 *
 * Root Preact component for the Shopbot chat widget.
 *
 * Features:
 *   - Remote appearance config (theme, greeting, position)
 *   - Page context awareness with contextual starter questions
 *   - Support ticket submission
 *   - Product carousel, order card, cart card annotations
 *   - Starter buttons (from config + page context)
 *   - 30s safety-net timeout for hung streams
 */

import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type {
  WidgetConfig, ChatMessage, ConsentStatus,
  AnnotationEvent, RemoteConfig, PageContext,
} from '../types.js';
import { streamChat, newConversationId, getOrCreateSessionId } from '../api/stream.js';
import { fetchWidgetConfig } from '../api/config.js';
import { getConsentStatus, requestConsent, onConsentChange } from '../consent/shopify.js';
import { detectPageContext, getContextualQuestions } from '../lib/pageContext.js';
import { ProductCarousel } from './ProductCarousel.js';
import { OrderCard }       from './OrderCard.js';
import { CartCard }        from './CartCard.js';
import { TicketForm }      from './TicketForm.js';

// ── Helpers ────────────────────────────────────────────────────────

let msgCounter = 0;
function uid(): string { return `msg-${++msgCounter}-${Date.now()}`; }

// ── Session persistence helpers (survives page navigations, clears on tab close) ──

const STORAGE_KEY_MESSAGES       = 'shopbot_messages';
const STORAGE_KEY_CONVERSATION   = 'shopbot_conversation_id';
const STORAGE_KEY_WIDGET_OPEN    = 'shopbot_widget_open';

function saveToSession(key: string, value: unknown): void {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function loadFromSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

function removeFromSession(key: string): void {
  try { sessionStorage.removeItem(key); } catch {}
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(navigator.language, {
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Icons ──────────────────────────────────────────────────────────

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h2a4 4 0 014 4v6a4 4 0 01-4 4H9a4 4 0 01-4-4v-6a4 4 0 014-4h2V5.73A2 2 0 0112 2zm-3 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zm-3 3.5c-1.1 0-2 .67-2 1.5h4c0-.83-.9-1.5-2-1.5z" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

// ── Simple markdown renderer ───────────────────────────────────────

function MessageText({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) return <>{text}</>;

  // Parse simple markdown: **bold**, [link](url), ![img](url), `code`
  const parts: (string | preact.JSX.Element)[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Find the earliest match
    const patterns = [
      { regex: /\*\*(.+?)\*\*/, type: 'bold' },
      { regex: /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/, type: 'link' },
      { regex: /`([^`]+)`/, type: 'code' },
    ];

    let earliest: { index: number; length: number; type: string; match: RegExpExecArray } | null = null;

    for (const p of patterns) {
      const m = p.regex.exec(remaining);
      if (m && (earliest === null || m.index < earliest.index)) {
        earliest = { index: m.index, length: m[0].length, type: p.type, match: m };
      }
    }

    if (!earliest) {
      parts.push(remaining);
      break;
    }

    // Add text before the match
    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }

    // Render the match
    const m = earliest.match;
    switch (earliest.type) {
      case 'bold':
        parts.push(<strong key={key++}>{m[1]}</strong>);
        break;
      case 'link':
        parts.push(
          <a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer" class="sb-chat-link">
            {m[1]}
          </a>,
        );
        break;
      case 'code':
        parts.push(<code key={key++} class="sb-chat-code">{m[1]}</code>);
        break;
    }

    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return <>{parts}</>;
}

// ── Rich annotation renderer ───────────────────────────────────────

function RichContent({ annotations, onSendMessage }: { annotations: AnnotationEvent[]; onSendMessage?: (text: string) => void }) {
  return (
    <>
      {annotations.map((annotation, i) => {
        if (annotation.toolName === 'search_shop_catalog') {
          return <ProductCarousel key={i} data={annotation.result} {...(onSendMessage ? { onSendMessage } : {})} />;
        }
        if (annotation.toolName === 'get_order_status') {
          return <OrderCard key={i} data={annotation.result} />;
        }
        if (annotation.toolName === 'get_cart' || annotation.toolName === 'update_cart') {
          return <CartCard key={i} data={annotation.result} />;
        }
        return null;
      })}
    </>
  );
}

// ── Message bubble ─────────────────────────────────────────────────

function MessageBubble({ msg, onSendMessage }: { msg: ChatMessage; onSendMessage?: (text: string) => void }) {
  const isUser = msg.role === 'user';
  // Don't render empty streaming messages — typing indicator handles that
  if (msg.streaming && !msg.content && !(msg.annotations?.length)) return null;

  const hasContent = !!msg.content;
  const showCursor = msg.streaming && hasContent;

  // Hide text bubble when rich annotations (product carousel, cart card) are present
  // — the carousel/card IS the response, text would be redundant
  const hasRichAnnotations = !isUser && msg.annotations?.some(
    (a) => a.toolName === 'search_shop_catalog' || a.toolName === 'get_cart' || a.toolName === 'update_cart',
  );
  const showTextBubble = hasContent && !hasRichAnnotations;

  return (
    <div class={`sb-msg sb-msg-${msg.role}`}>
      {!isUser && (
        <div class="sb-msg-avatar">
          <BotIcon />
        </div>
      )}
      <div class="sb-msg-content">
        {showTextBubble && (
          <div class={`sb-bubble sb-bubble-${msg.role}${showCursor ? ' sb-cursor' : ''}`}>
            <MessageText text={msg.content} isUser={isUser} />
          </div>
        )}
        {!isUser && msg.annotations && msg.annotations.length > 0 && (
          <RichContent annotations={msg.annotations} {...(onSendMessage ? { onSendMessage } : {})} />
        )}
        <span class="sb-msg-time">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ── Consent banner ─────────────────────────────────────────────────

function ConsentBanner({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div class="sb-consent-banner" role="region" aria-label="Cookie consent">
      <div class="sb-consent-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <p>
        This chat uses cookies to remember your conversation. Do you consent?
      </p>
      <div class="sb-consent-actions">
        <button class="sb-consent-accept" onClick={onAccept}>Accept & Chat</button>
        <button class="sb-consent-decline" onClick={onDecline}>Decline</button>
      </div>
    </div>
  );
}

// ── Empty state with starters ──────────────────────────────────────

function EmptyState({
  greeting,
  botName,
  starters,
  onStarterClick,
}: {
  greeting: string;
  botName: string;
  starters: string[];
  onStarterClick: (text: string) => void;
}) {
  return (
    <div class="sb-empty-state">
      <div class="sb-empty-bot">
        <div class="sb-empty-bot-icon">
          <BotIcon />
        </div>
        <div class="sb-empty-pulse" />
      </div>
      <p class="sb-empty-greeting">{greeting}</p>
      <p class="sb-empty-name">I'm {botName}, your shopping assistant</p>

      {starters.length > 0 && (
        <div class="sb-starters">
          {starters.map((text, i) => (
            <button
              key={i}
              class="sb-starter-btn"
              onClick={() => onStarterClick(text)}
            >
              <span class="sb-starter-text">{text}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sb-starter-arrow">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────

interface WidgetProps {
  config: WidgetConfig;
}

export function Widget({ config }: WidgetProps) {
  const { apiKey, shopDomain, apiBaseUrl, title = 'Our Store' } = config;

  const [open,           setOpen]          = useState(() => loadFromSession(STORAGE_KEY_WIDGET_OPEN, false));
  const [messages,       setMessages]      = useState<ChatMessage[]>(() => {
    // Restore messages from sessionStorage (strip streaming flag)
    const saved = loadFromSession<ChatMessage[]>(STORAGE_KEY_MESSAGES, []);
    return saved.map((m) => ({ ...m, streaming: false }));
  });
  const [input,          setInput]         = useState('');
  const [streaming,      setStreaming]     = useState(false);
  const [consent,        setConsent]       = useState<ConsentStatus>(() => getConsentStatus());
  const [conversationId, setConversationId] = useState(() =>
    loadFromSession<string>(STORAGE_KEY_CONVERSATION, '') || newConversationId(),
  );
  const [sessionId,      setSessionId]      = useState(() => getOrCreateSessionId());
  const [unread,         setUnread]        = useState(0);
  const [showTicket,     setShowTicket]    = useState(false);
  const [remoteConfig,   setRemoteConfig]  = useState<RemoteConfig | null>(null);
  const [configLoaded,   setConfigLoaded]  = useState(false);
  const [pageCtx]        = useState<PageContext>(() => detectPageContext());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const abortRef       = useRef<AbortController | null>(null);
  const timeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived config values
  const position   = remoteConfig?.position ?? config.position ?? 'right';
  const botName    = remoteConfig?.botName ?? title;
  const greeting   = remoteConfig?.greeting ?? `Hi there! How can I help you today?`;
  const themeColor = remoteConfig?.themeColor ?? config.accentColor ?? '#059669';

  // Build starter buttons: merge remote config + contextual questions
  const starters = (() => {
    const remote = remoteConfig?.starterButtons ?? [];
    if (remote.length > 0) return remote.slice(0, 4);
    return getContextualQuestions(pageCtx).slice(0, 3);
  })();

  // Expose shop domain for ProductCarousel links
  useEffect(() => { (window as any).__shopbot_domain__ = shopDomain; }, [shopDomain]);

  // ── Persist chat state to sessionStorage (survives page navigation) ──
  useEffect(() => {
    // Only persist non-streaming messages (strip streaming state)
    if (!streaming) {
      saveToSession(STORAGE_KEY_MESSAGES, messages);
    }
  }, [messages, streaming]);

  useEffect(() => { saveToSession(STORAGE_KEY_CONVERSATION, conversationId); }, [conversationId]);
  useEffect(() => { saveToSession(STORAGE_KEY_WIDGET_OPEN, open); }, [open]);

  // Load remote config
  useEffect(() => {
    fetchWidgetConfig(apiBaseUrl, apiKey).then((cfg) => {
      setRemoteConfig(cfg);
      setConfigLoaded(true);
    }).catch(() => setConfigLoaded(true));
  }, [apiBaseUrl, apiKey]);

  // Apply theme color + dark mode class
  useEffect(() => {
    const host = document.querySelector('shopbot-widget')?.shadowRoot?.host as HTMLElement | null;
    if (host) {
      host.style.setProperty('--sb-accent', themeColor);
      host.style.setProperty('--sb-accent-hover', themeColor);
      // Toggle dark mode class based on remote config
      const isDark = remoteConfig?.mode === 'dark';
      host.classList.toggle('sb-dark', isDark);
    }
  }, [themeColor, remoteConfig?.mode]);

  // Subscribe to Shopify consent changes
  useEffect(() => onConsentChange(setConsent), []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track unread while closed
  useEffect(() => {
    if (!open && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') setUnread((n) => n + 1);
    }
  }, [messages, open]);

  useEffect(() => { if (open) setUnread(0); }, [open]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`;
  }, []);

  // Send message
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), streaming: true },
    ]);
    setStreaming(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // 30-second safety net
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.streaming
            ? { ...m, content: m.content || 'Response timed out. Please try again.', streaming: false }
            : m,
        ),
      );
      setStreaming(false);
    }, 30_000);

    // Include page context in the first message
    const contextPrefix = messages.length === 0 && pageCtx.type !== 'other' && pageCtx.type !== 'home'
      ? `[Page: ${pageCtx.type}${pageCtx.title ? ` - ${pageCtx.title}` : ''}${pageCtx.handle ? ` (${pageCtx.handle})` : ''}]\n`
      : '';

    try {
      const gen = streamChat({
        apiBaseUrl,
        apiKey,
        shopDomain,
        sessionId,
        conversationId,
        message: contextPrefix + text,
      });

      for await (const event of gen) {
        switch (event.type) {
          case 'text':
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: m.content + event.content } : m),
            );
            break;

          case 'data':
            for (const annotation of event.content) {
              if (
                annotation.toolName === 'search_shop_catalog' ||
                annotation.toolName === 'get_order_status' ||
                annotation.toolName === 'get_cart' ||
                annotation.toolName === 'update_cart'
              ) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, annotations: [...(m.annotations ?? []), annotation] }
                      : m,
                  ),
                );
              }
            }
            break;

          case 'error':
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: `${event.content}`, streaming: false } : m,
              ),
            );
            break;

          case 'finish':
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m),
            );
            break;
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Something went wrong. Please try again.', streaming: false }
            : m,
        ),
      );
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Always mark the assistant message as done streaming — handles edge cases
      // where the `finish` event never arrives (stream ends after tool calls)
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId && m.streaming ? { ...m, streaming: false } : m),
      );
      setStreaming(false);
    }
  }, [input, streaming, apiBaseUrl, apiKey, shopDomain, sessionId, conversationId, messages.length, pageCtx]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } },
    [sendMessage],
  );

  const handleStarterClick = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  const handleConsentAccept  = useCallback(async () => setConsent(await requestConsent()), []);
  const handleConsentDecline = useCallback(() => { setConsent('denied'); setOpen(false); }, []);
  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleTicketSubmitted = useCallback((msg: string) => {
    // Add a system message about the ticket
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: 'assistant', content: msg, timestamp: Date.now() },
    ]);
  }, []);

  // Clear chat and refresh session
  const handleClearChat = useCallback(() => {
    if (streaming) {
      abortRef.current?.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStreaming(false);
    }
    setMessages([]);
    setConversationId(newConversationId());
    // Clear all persisted chat state
    removeFromSession(STORAGE_KEY_MESSAGES);
    removeFromSession(STORAGE_KEY_CONVERSATION);
    try { sessionStorage.removeItem('shopbot_session_id'); } catch {}
    setSessionId(getOrCreateSessionId());
  }, [streaming]);

  // Popup hint for product pages
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    if (pageCtx.type === 'product' && !open) {
      const timer = setTimeout(() => setShowHint(true), 3000);
      return () => clearTimeout(timer);
    }
    setShowHint(false);
  }, [pageCtx.type, open]);

  // Don't render anything until config is loaded (prevents flash of defaults)
  if (!configLoaded) {
    return null;
  }

  return (
    <>
      {open && (
        <div class="sb-panel" data-position={position} role="dialog" aria-label={`Chat with ${botName}`} aria-modal="true">
          {/* Header */}
          <div class="sb-header">
            <div class="sb-header-left">
              <div class="sb-header-avatar"><BotIcon /></div>
              <div class="sb-header-info">
                <p class="sb-header-title">{botName}</p>
                <p class="sb-header-subtitle">
                  <span class="sb-online-dot" aria-hidden="true" />
                  {streaming ? 'Typing...' : 'Online'}
                </p>
              </div>
            </div>
            <div class="sb-header-actions">
              <button
                class="sb-header-btn"
                onClick={handleClearChat}
                aria-label="Clear chat"
                title="Clear chat"
              >
                <RefreshIcon />
              </button>
              <button
                class="sb-header-btn"
                onClick={() => setShowTicket(true)}
                aria-label="Submit a ticket"
                title="Submit a ticket"
              >
                <TicketIcon />
              </button>
              <button class="sb-header-btn" onClick={toggleOpen} aria-label="Close chat">
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Ticket form overlay */}
          {showTicket && (
            <TicketForm
              apiBaseUrl={apiBaseUrl}
              apiKey={apiKey}
              conversationId={conversationId}
              sessionId={sessionId}
              onClose={() => setShowTicket(false)}
              onSubmitted={handleTicketSubmitted}
            />
          )}

          {/* Consent / denied / chat */}
          {consent === 'unknown' ? (
            <>
              <div class="sb-messages" />
              <ConsentBanner onAccept={handleConsentAccept} onDecline={handleConsentDecline} />
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
              <div class="sb-messages" role="log" aria-live="polite" aria-label="Chat messages">
                {messages.length === 0 ? (
                  <EmptyState
                    greeting={greeting}
                    botName={botName}
                    starters={starters}
                    onStarterClick={handleStarterClick}
                  />
                ) : (
                  messages.map((msg) => <MessageBubble key={msg.id} msg={msg} onSendMessage={sendMessage} />)
                )}
                {streaming && (() => {
                  // Hide typing indicator once annotations (carousel/cards) have arrived
                  const lastMsg = messages[messages.length - 1];
                  const hasAnnotations = lastMsg?.role === 'assistant' && lastMsg.annotations && lastMsg.annotations.length > 0;
                  if (hasAnnotations) return null;
                  return (
                    <div class="sb-typing" aria-label="Assistant is typing">
                      <span /><span /><span />
                    </div>
                  );
                })()}
                <div ref={messagesEndRef} />
              </div>

              <div class="sb-input-area">
                <textarea
                  ref={textareaRef}
                  class="sb-textarea"
                  placeholder={`Message ${botName}...`}
                  value={input}
                  rows={1}
                  disabled={false}
                  onInput={(e) => { setInput((e.target as HTMLTextAreaElement).value); resizeTextarea(); }}
                  onKeyDown={handleKeyDown}
                  aria-label="Chat message input"
                />
                <button
                  class="sb-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>

              <div class="sb-powered-by">
                Powered by <strong>Shopbot AI</strong>
              </div>
            </>
          )}
        </div>
      )}

      {/* Product page popup hint */}
      {showHint && !open && pageCtx.type === 'product' && (
        <div class="sb-hint" data-position={position} onClick={() => { setShowHint(false); toggleOpen(); }}>
          <span>Have questions about {pageCtx.title ? `"${pageCtx.title}"` : 'this product'}?</span>
          <button class="sb-hint-close" onClick={(e) => { e.stopPropagation(); setShowHint(false); }} aria-label="Dismiss">
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Launcher */}
      <button
        class="sb-launcher"
        data-position={position}
        onClick={toggleOpen}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <div class={`sb-launcher-icon ${open ? 'sb-launcher-open' : ''}`}>
          {open ? <CloseIcon /> : <ChatIcon />}
        </div>
        {!open && unread > 0 && (
          <span class="sb-unread-badge" aria-label={`${unread} unread messages`}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  );
}
