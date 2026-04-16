/**
 * apps/dashboard/src/app/api/realtime/ticket/route.ts
 *
 * Mints a short-lived HMAC-signed ticket the browser uses to authenticate its
 * socket.io connection to the API server. The ticket binds the connection to
 * the signed-in merchant's tenantId so they can only listen to their own room.
 *
 * Flow:
 *   1. Browser calls GET /api/realtime/ticket (Clerk session required)
 *   2. This route resolves the merchant and signs { tenantId, exp } with
 *      INTERNAL_HMAC_SECRET (shared with the API server)
 *   3. Browser hands the ticket to socket.io as handshake auth
 *   4. API server verifies the signature and joins `tenant:{tenantId}`
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getMerchant } from '@/lib/merchant';

// Tickets are short-lived — the socket only uses them at handshake. Once the
// connection is established the ticket is no longer needed.
const TICKET_TTL_MS = 60_000; // 60 seconds

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchant = await getMerchant();
  if (!merchant) {
    return NextResponse.json({ error: 'No store connected' }, { status: 404 });
  }

  const secret = process.env.INTERNAL_HMAC_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { error: 'Server misconfigured: INTERNAL_HMAC_SECRET missing' },
      { status: 500 },
    );
  }

  const payload = {
    tenantId: merchant.id,
    exp:      Date.now() + TICKET_TTL_MS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return NextResponse.json({
    ticket:   `${payloadB64}.${sigB64}`,
    tenantId: merchant.id,
    apiUrl:   (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/api\/?$/, ''),
    expiresAt: payload.exp,
  });
}
