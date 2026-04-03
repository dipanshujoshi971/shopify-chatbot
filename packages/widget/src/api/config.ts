/**
 * packages/widget/src/api/config.ts
 *
 * Fetches the widget appearance configuration from GET /widget/config.
 * Also handles the ticket submission POST /widget/ticket.
 */

import type { RemoteConfig } from '../types.js';

const DEFAULT_CONFIG: RemoteConfig = {
  botName: 'Assistant',
  tone: 'friendly',
  useEmojis: false,
  greeting: 'Hi there! How can I help you today?',
  themeColor: '#059669',
  position: 'right',
  mode: 'light',
  starterButtons: [],
};

/**
 * Load widget appearance config from the API.
 * Falls back to defaults on error.
 */
export async function fetchWidgetConfig(
  apiBaseUrl: string,
  apiKey: string,
): Promise<RemoteConfig> {
  try {
    const res = await fetch(`${apiBaseUrl}/widget/config`, {
      headers: { 'X-Widget-Key': apiKey },
    });
    if (!res.ok) return DEFAULT_CONFIG;
    const data = await res.json() as RemoteConfig;
    return { ...DEFAULT_CONFIG, ...data };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Submit a customer support ticket.
 */
export async function submitTicket(
  apiBaseUrl: string,
  apiKey: string,
  ticket: {
    email: string;
    subject: string;
    message: string;
    conversationId?: string;
    sessionId?: string;
  },
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${apiBaseUrl}/widget/ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Widget-Key': apiKey,
      },
      body: JSON.stringify(ticket),
    });
    const data = await res.json() as { success: boolean; message: string };
    return data;
  } catch {
    return { success: false, message: 'Network error. Please try again.' };
  }
}
