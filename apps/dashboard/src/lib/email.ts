/**
 * apps/dashboard/src/lib/email.ts
 *
 * Email sending utility for ticket reply notifications.
 * Uses Resend if RESEND_API_KEY is set, otherwise logs to console.
 *
 * In production, set RESEND_API_KEY and RESEND_FROM_EMAIL in .env.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'support@shopbot.ai';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(
      `[email] RESEND_API_KEY not set — skipping email to ${params.to}`,
      `Subject: ${params.subject}`,
    );
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.text ? { text: params.text } : {}),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[email] Resend error:', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[email] Send failed:', err);
    return false;
  }
}

/**
 * Send a ticket reply notification to a customer.
 */
export async function sendTicketReplyEmail(params: {
  customerEmail: string;
  storeName: string;
  ticketSubject: string;
  replyMessage: string;
  ticketId: string;
}): Promise<boolean> {
  const { customerEmail, storeName, ticketSubject, replyMessage, ticketId } = params;

  return sendEmail({
    to: customerEmail,
    subject: `Re: ${ticketSubject} — ${storeName} Support`,
    text: `${storeName} Support replied to your ticket:\n\n${replyMessage}\n\nTicket ID: ${ticketId}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
        <div style="background:#059669;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0;">
          <h2 style="margin:0;font-size:16px;">${storeName} Support</h2>
        </div>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Reply to: <strong>${ticketSubject}</strong></p>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin:12px 0;font-size:14px;line-height:1.6;color:#1a1d23;">
            ${replyMessage.replace(/\n/g, '<br>')}
          </div>
          <p style="font-size:12px;color:#9ca3af;margin:12px 0 0;">Ticket ID: ${ticketId}</p>
        </div>
        <p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:16px;">
          Powered by Shopbot AI
        </p>
      </div>
    `,
  });
}
