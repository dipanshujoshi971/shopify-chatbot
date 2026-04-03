/**
 * packages/widget/src/components/TicketForm.tsx
 *
 * Slide-in form allowing customers to raise a support ticket
 * directly from the chat widget.
 */

import { useState, useCallback } from 'preact/hooks';
import { submitTicket } from '../api/config.js';

interface TicketFormProps {
  apiBaseUrl: string;
  apiKey: string;
  conversationId?: string;
  sessionId?: string;
  onClose: () => void;
  onSubmitted: (msg: string) => void;
}

export function TicketForm({
  apiBaseUrl,
  apiKey,
  conversationId,
  sessionId,
  onClose,
  onSubmitted,
}: TicketFormProps) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: Event) => {
    e.preventDefault();
    if (!email || !subject || !message) return;

    setSubmitting(true);
    setError('');

    const result = await submitTicket(apiBaseUrl, apiKey, {
      email,
      subject,
      message,
      ...(conversationId ? { conversationId } : {}),
      ...(sessionId ? { sessionId } : {}),
    });

    setSubmitting(false);

    if (result.success) {
      onSubmitted(result.message);
      onClose();
    } else {
      setError(result.message);
    }
  }, [email, subject, message, apiBaseUrl, apiKey, conversationId, sessionId, onClose, onSubmitted]);

  return (
    <div class="sb-ticket-overlay">
      <div class="sb-ticket-form">
        <div class="sb-ticket-header">
          <div class="sb-ticket-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div>
            <p class="sb-ticket-form-title">Submit a Ticket</p>
            <p class="sb-ticket-form-desc">We'll get back to you as soon as possible</p>
          </div>
          <button class="sb-ticket-close" onClick={onClose} aria-label="Close ticket form">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} class="sb-ticket-body">
          <div class="sb-field">
            <label class="sb-label" for="sb-ticket-email">Email</label>
            <input
              id="sb-ticket-email"
              class="sb-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              required
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            />
          </div>

          <div class="sb-field">
            <label class="sb-label" for="sb-ticket-subject">Subject</label>
            <input
              id="sb-ticket-subject"
              class="sb-input"
              type="text"
              placeholder="Brief description of your issue"
              value={subject}
              required
              onInput={(e) => setSubject((e.target as HTMLInputElement).value)}
            />
          </div>

          <div class="sb-field">
            <label class="sb-label" for="sb-ticket-msg">Message</label>
            <textarea
              id="sb-ticket-msg"
              class="sb-input sb-ticket-textarea"
              placeholder="Describe your issue in detail..."
              value={message}
              required
              onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          {error && <p class="sb-ticket-error">{error}</p>}

          <button
            type="submit"
            class="sb-ticket-submit"
            disabled={submitting || !email || !subject || !message}
          >
            {submitting ? (
              <span class="sb-ticket-spinner" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
                Submit Ticket
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
