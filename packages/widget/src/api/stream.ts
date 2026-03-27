/**
 * packages/widget/src/api/stream.ts
 *
 * Vercel AI SDK Data Stream Parser
 * -------------------------------------------------------------------
 * Consumes the HTTP streaming response from /widget/chat and yields
 * typed StreamEvent objects.
 *
 * Data stream format (one event per line):
 *   0:"text chunk"              → text delta
 *   2:[{...annotation}]        → StreamData annotation (tool results)
 *   3:"error message"          → stream error
 *   d:{finishReason, usage}    → finish event
 *
 * Full spec:
 *   https://sdk.vercel.ai/docs/api-reference/stream-data
 */

import type { StreamEvent, AnnotationEvent, ChatMessage } from '../types.js';

// ------------------------------------------------------------------ //
// Chat request parameters
// ------------------------------------------------------------------ //

export interface ChatRequestParams {
  apiBaseUrl     : string;
  apiKey         : string;
  shopDomain     : string;
  conversationId : string;
  message        : string;
  customerEmail ?: string;
}

// ------------------------------------------------------------------ //
// Core streaming generator
// ------------------------------------------------------------------ //

/**
 * streamChat
 *
 * Sends a chat message and yields StreamEvents as they arrive.
 * Caller is responsible for updating UI state on each event.
 *
 * @throws on non-2xx response (with parsed API error message)
 */
export async function* streamChat(
  params: ChatRequestParams,
): AsyncGenerator<StreamEvent> {
  const {
    apiBaseUrl,
    apiKey,
    shopDomain,
    conversationId,
    message,
    customerEmail,
  } = params;

  const response = await fetch(`${apiBaseUrl}/widget/chat`, {
    method : 'POST',
    headers: {
      'Content-Type'   : 'application/json',
      'X-Api-Key'      : apiKey,
      'X-Shop-Domain'  : shopDomain,
      'Accept'         : 'text/event-stream',
    },
    body: JSON.stringify({
      conversationId,
      message,
      ...(customerEmail && { customerEmail }),
    }),
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = await response.json() as { message?: string };
      errorMsg = json.message ?? errorMsg;
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
        // Flush any remaining buffered content
        if (buffer.trim()) {
          yield* parseLines(buffer);
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Split on newlines, keeping incomplete last line in buffer
      const newlineIdx = buffer.lastIndexOf('\n');
      if (newlineIdx === -1) continue;

      const complete  = buffer.slice(0, newlineIdx);
      buffer          = buffer.slice(newlineIdx + 1);

      yield* parseLines(complete);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

// ------------------------------------------------------------------ //
// Line parser
// ------------------------------------------------------------------ //

function* parseLines(chunk: string): Generator<StreamEvent> {
  const lines = chunk.split('\n');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const prefix = line.slice(0, colonIdx);
    const data   = line.slice(colonIdx + 1);

    try {
      switch (prefix) {
        // ── Text delta ───────────────────────────────────────────────
        case '0': {
          const text = JSON.parse(data) as string;
          yield { type: 'text', content: text };
          break;
        }

        // ── StreamData annotations (tool results, etc.) ───────────────
        case '2': {
          const annotations = JSON.parse(data) as AnnotationEvent[];
          if (Array.isArray(annotations) && annotations.length > 0) {
            yield { type: 'data', content: annotations };
          }
          break;
        }

        // ── Error ─────────────────────────────────────────────────────
        case '3': {
          const msg = JSON.parse(data) as string;
          yield { type: 'error', content: msg };
          break;
        }

        // ── Finish ────────────────────────────────────────────────────
        case 'd': {
          const finish = JSON.parse(data) as {
            finishReason: string;
            usage?: { promptTokens: number; completionTokens: number };
          };
          yield { type: 'finish', content: finish };
          break;
        }

        // Ignore unknown prefixes (tool call streaming internals, etc.)
        default: break;
      }
    } catch (e) {
      // Malformed JSON line — skip silently in production
      if (import.meta.env.DEV) {
        console.warn('[shopbot:stream] Failed to parse line:', line, e);
      }
    }
  }
}

// ------------------------------------------------------------------ //
// Utility — generate a session-scoped conversation ID
// ------------------------------------------------------------------ //

export function newConversationId(): string {
  // Compact 16-char random ID — no external dep needed
  return Math.random().toString(36).slice(2, 10) +
         Math.random().toString(36).slice(2, 10);
}

// ------------------------------------------------------------------ //
// Utility — extract the first annotation of a given tool from a message
// ------------------------------------------------------------------ //

export function getAnnotation<T extends AnnotationEvent>(
  message : ChatMessage,
  toolName: T['toolName'],
): T | undefined {
  if (!message.annotation) return undefined;
  if (message.annotation.toolName === toolName) return message.annotation as T;
  return undefined;
}