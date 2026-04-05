/**
 * packages/widget/src/api/stream.ts
 *
 * Chat API Client
 * ──────────────────────────────────────────────────────────────────
 * Sends messages to POST /widget/chat and returns a consistent
 * ChatApiResponse JSON object.
 *
 * No more stream parsing — the backend returns a single JSON response
 * with a predictable shape every time.
 */

import type { ChatApiResponse } from '../types.js';

// ── Chat request parameters ────────────────────────────────────────

export interface ChatRequestParams {
  apiBaseUrl     : string;
  apiKey         : string;
  shopDomain     : string;
  sessionId      : string;
  conversationId?: string;
  message        : string;
  cartId        ?: string;
}

// ── Core API call ──────────────────────────────────────────────────

/**
 * sendChatMessage
 *
 * Sends a chat message to POST /widget/chat and returns the consistent
 * JSON response: { text, products, cart, order, conversationId }
 */
export async function sendChatMessage(
  params: ChatRequestParams,
): Promise<ChatApiResponse> {
  const {
    apiBaseUrl,
    apiKey,
    sessionId,
    conversationId,
    message,
    cartId,
  } = params;

  const response = await fetch(`${apiBaseUrl}/widget/chat`, {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'X-Widget-Key' : apiKey,
    },
    body: JSON.stringify({
      sessionId,
      message,
      ...(conversationId ? { conversationId } : {}),
      ...(cartId && { cartId }),
    }),
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = await response.json() as { message?: string; error?: string; text?: string };
      // The error response also follows the consistent shape
      if (json.text) {
        return json as ChatApiResponse;
      }
      errorMsg = json.message ?? json.error ?? errorMsg;
    } catch { /* ignore parse error */ }
    throw new Error(errorMsg);
  }

  const data = await response.json() as ChatApiResponse;

  // Ensure the response always has the expected shape even if backend
  // returns partial data (defensive parsing)
  return {
    text:           data.text ?? '',
    products:       Array.isArray(data.products) ? data.products : [],
    cart:           data.cart ?? null,
    order:          data.order ?? null,
    conversationId: data.conversationId ?? conversationId ?? '',
  };
}

// ── Utilities ──────────────────────────────────────────────────────

/**
 * newConversationId
 * Compact 16-char random ID. No external dependency.
 */
export function newConversationId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

/**
 * newSessionId
 * Stable for the lifetime of the browser tab.
 * Stored in sessionStorage so it survives page navigations but resets
 * when the tab closes (GDPR-friendly: no persistent cross-session ID).
 */
export function getOrCreateSessionId(): string {
  const KEY = 'shopbot_session_id';
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id =
      Math.random().toString(36).slice(2, 10) +
      Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 18);
  }
}
