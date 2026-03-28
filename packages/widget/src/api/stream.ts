/**
 * packages/widget/src/api/stream.ts
 *
 * Vercel AI SDK Data Stream Parser
 * ──────────────────────────────────────────────────────────────────
 * Consumes the HTTP streaming response from /widget/chat and yields
 * typed StreamEvent objects.
 *
 * Fixes from previous version:
 *   1. Header was `X-Api-Key` — widgetAuth.ts reads `X-Widget-Key` → 401
 *   2. Body was missing `sessionId` — chat.ts schema requires it → 400
 *
 * Data stream format (one event per line):
 *   0:"text chunk"         → text delta
 *   2:[{...annotation}]   → StreamData annotation (tool results)
 *   3:"error message"      → stream error
 *   d:{finishReason,usage} → finish event
 */

import type { StreamEvent, AnnotationEvent, ChatMessage } from '../types.js';

// ── Chat request parameters ────────────────────────────────────────

export interface ChatRequestParams {
  apiBaseUrl     : string;
  apiKey         : string;
  shopDomain     : string;
  /** Groups conversations from the same browser session. Required by chat.ts */
  sessionId      : string;
  conversationId : string;
  message        : string;
  /** Shopify cart GID — forwarded so AI can operate on the existing cart */
  cartId        ?: string;
}

// ── Core streaming generator ───────────────────────────────────────

/**
 * streamChat
 *
 * Sends a chat message to POST /widget/chat and yields StreamEvents.
 * The async generator pattern lets the caller update UI state on each
 * individual event without buffering the full response.
 */
export async function* streamChat(
  params: ChatRequestParams,
): AsyncGenerator<StreamEvent> {
  const {
    apiBaseUrl,
    apiKey,
    sessionId,
    conversationId,
    message,
    cartId,
  } = params;

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/widget/chat`, {
      method : 'POST',
      headers: {
        'Content-Type'   : 'application/json',
        // FIX 1: widgetAuth.ts reads 'x-widget-key', NOT 'x-api-key'
        'X-Widget-Key'   : apiKey,
        // Origin is sent automatically by the browser — needed for widgetAuth
        // domain-lock check. No need to set manually.
      },
      body: JSON.stringify({
        // FIX 2: sessionId is required by the chat route JSON schema
        sessionId,
        conversationId,
        message,
        ...(cartId && { cartId }),
      }),
    });
  } catch (err) {
    yield { type: 'error', content: `Network error: ${(err as Error).message}` };
    return;
  }

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = await response.json() as { message?: string; error?: string };
      errorMsg = json.message ?? json.error ?? errorMsg;
    } catch { /* ignore parse error */ }
    yield { type: 'error', content: errorMsg };
    return;
  }

  if (!response.body) {
    yield { type: 'error', content: 'Response body is null' };
    return;
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer    = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) yield* parseLines(buffer);
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Only process complete lines — keep the incomplete last line in buffer
      const newlineIdx = buffer.lastIndexOf('\n');
      if (newlineIdx === -1) continue;

      const complete = buffer.slice(0, newlineIdx);
      buffer         = buffer.slice(newlineIdx + 1);

      yield* parseLines(complete);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

// ── Line parser ────────────────────────────────────────────────────

function* parseLines(chunk: string): Generator<StreamEvent> {
  for (const raw of chunk.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const prefix = line.slice(0, colonIdx);
    const data   = line.slice(colonIdx + 1);

    try {
      switch (prefix) {
        case '0': {
          // Text delta
          yield { type: 'text', content: JSON.parse(data) as string };
          break;
        }
        case '2': {
          // StreamData annotations — tool results piped from onStepFinish
          const annotations = JSON.parse(data) as AnnotationEvent[];
          if (Array.isArray(annotations) && annotations.length > 0) {
            yield { type: 'data', content: annotations };
          }
          break;
        }
        case '3': {
          // Stream error
          yield { type: 'error', content: JSON.parse(data) as string };
          break;
        }
        case 'd': {
          // Finish event
          const finish = JSON.parse(data) as {
            finishReason: string;
            usage?: { promptTokens: number; completionTokens: number };
          };
          yield { type: 'finish', content: finish };
          break;
        }
        default:
          // Unknown prefix (tool call streaming internals) — skip silently
          break;
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[shopbot:stream] Failed to parse line:', line, e);
      }
    }
  }
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
    // sessionStorage unavailable (e.g. iframe sandbox) — generate ephemeral ID
    return Math.random().toString(36).slice(2, 18);
  }
}

/**
 * getAnnotation
 * Extracts the first annotation of a given toolName from a message.
 */
export function getAnnotation<T extends AnnotationEvent>(
  message : ChatMessage,
  toolName: T['toolName'],
): T | undefined {
  if (!message.annotation) return undefined;
  if (message.annotation.toolName === toolName) return message.annotation as T;
  return undefined;
}