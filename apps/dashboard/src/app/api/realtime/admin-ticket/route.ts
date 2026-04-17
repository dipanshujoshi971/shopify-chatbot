import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSuperAdmin } from '@/lib/admin';

const TICKET_TTL_MS = 60_000;

export async function GET() {
  const adminUserId = await getSuperAdmin();
  if (!adminUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const secret = process.env.INTERNAL_HMAC_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { error: 'Server misconfigured: INTERNAL_HMAC_SECRET missing' },
      { status: 500 },
    );
  }

  const payload = {
    adminUserId,
    kind: 'admin' as const,
    exp: Date.now() + TICKET_TTL_MS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return NextResponse.json({
    ticket: `${payloadB64}.${sigB64}`,
    apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/api\/?$/, ''),
    expiresAt: payload.exp,
  });
}
