/**
 * apps/dashboard/src/lib/realtime.ts
 *
 * Lazy-connecting socket.io client for the dashboard.
 *
 * Why a module-level singleton?
 * ─────────────────────────────
 * Multiple pages (inbox, sidebar, dashboard) may want to listen to the same
 * tenant room. Opening a separate connection from each component wastes
 * sockets and makes auth re-issuing clumsy. One shared connection, many
 * listeners.
 *
 * Public API: `getRealtimeSocket()` returns a connected (or connecting)
 * Socket instance. Components should attach listeners in a useEffect and
 * remove them on cleanup. Don't call `.disconnect()` from components — the
 * connection outlives page navigations on purpose.
 */
'use client';

import { io, type Socket } from 'socket.io-client';

interface TicketResponse {
  ticket:   string;
  tenantId: string;
  apiUrl:   string;
  expiresAt: number;
}

let socketPromise: Promise<Socket> | null = null;

async function fetchTicket(): Promise<TicketResponse> {
  const res = await fetch('/api/realtime/ticket', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to mint realtime ticket: ${res.status}`);
  }
  return res.json();
}

async function connect(): Promise<Socket> {
  const { ticket, apiUrl } = await fetchTicket();

  const socket = io(apiUrl, {
    path:        '/socket.io/',
    transports:  ['websocket', 'polling'],
    withCredentials: true,
    auth:        { role: 'dashboard', ticket },
    // If the server kicks us (e.g. ticket expired mid-reconnect), refresh
    // the ticket before retrying.
    reconnectionAttempts: Infinity,
    reconnectionDelay:    1_000,
    reconnectionDelayMax: 10_000,
  });

  // Re-mint a fresh ticket before socket.io attempts to reconnect. Tickets
  // are short-lived (60s) and the stored one goes stale as soon as the
  // socket stays up longer than that.
  socket.on('reconnect_attempt', async () => {
    try {
      const { ticket: fresh } = await fetchTicket();
      socket.auth = { role: 'dashboard', ticket: fresh };
    } catch {
      // If we can't get a ticket (e.g. logged out), let socket.io fail the
      // next attempt; the caller will see a `connect_error`.
    }
  });

  return socket;
}

/**
 * Returns the shared socket.io client instance, initiating the connection
 * on first call. Subsequent calls return the same instance.
 *
 * Always gated behind `typeof window !== 'undefined'` — this module must
 * only run in the browser.
 */
export function getRealtimeSocket(): Promise<Socket> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('realtime client is browser-only'));
  }
  if (!socketPromise) {
    socketPromise = connect().catch((err) => {
      // Reset so the next caller can retry.
      socketPromise = null;
      throw err;
    });
  }
  return socketPromise;
}

/* ─── Event payload shapes (keep in sync with apps/api emits) ──────────── */

export interface MessageNewEvent {
  tenantId:       string;
  conversationId: string;
  sessionId:      string;
  message: {
    id:         string;
    role:       'user' | 'assistant' | 'tool';
    content:    string;
    created_at: string;
  };
  conversationUpdate?: {
    total_turns:       number;
    total_tokens_used: number;
    updated_at:        string;
  };
}

export interface ConversationNewEvent {
  tenantId:       string;
  conversationId: string;
  sessionId:      string;
  createdAt:      string;
}
