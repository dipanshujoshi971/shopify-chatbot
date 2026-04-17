'use client';

import { io, type Socket } from 'socket.io-client';

interface TicketResponse {
  ticket: string;
  apiUrl: string;
  expiresAt: number;
}

let socketPromise: Promise<Socket> | null = null;

async function fetchTicket(): Promise<TicketResponse> {
  const res = await fetch('/api/realtime/admin-ticket', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to mint admin realtime ticket: ${res.status}`);
  }
  return res.json();
}

async function connect(): Promise<Socket> {
  const { ticket, apiUrl } = await fetchTicket();

  const socket = io(apiUrl, {
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: { role: 'admin', ticket },
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
  });

  socket.on('reconnect_attempt', async () => {
    try {
      const { ticket: fresh } = await fetchTicket();
      socket.auth = { role: 'admin', ticket: fresh };
    } catch {
      // fail on next attempt
    }
  });

  return socket;
}

export function getAdminRealtimeSocket(): Promise<Socket> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('realtime-admin is browser-only'));
  }
  if (!socketPromise) {
    socketPromise = connect().catch((err) => {
      socketPromise = null;
      throw err;
    });
  }
  return socketPromise;
}
