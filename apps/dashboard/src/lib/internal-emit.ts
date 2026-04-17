import crypto from 'node:crypto';

/**
 * Signs a payload with INTERNAL_HMAC_SECRET and POSTs it to the api server's
 * /internal/emit route, which re-broadcasts it over socket.io to the given
 * room. Fire-and-forget — a network blip must never fail the DB write that
 * triggered the emit.
 */
export async function emitRealtime(
  room: string,
  event: string,
  payload: unknown,
): Promise<void> {
  const secret = process.env.INTERNAL_HMAC_SECRET;
  if (!secret || secret.length < 32) {
    console.warn('[internal-emit] INTERNAL_HMAC_SECRET missing — skipping emit');
    return;
  }

  const apiBase = (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:3001'
  ).replace(/\/$/, '').replace(/\/api$/, '');

  const body = JSON.stringify({ room, event, payload });
  const sig = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64url');

  try {
    await fetch(`${apiBase}/internal/emit`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-internal-emit',
        'x-internal-signature': sig,
      },
      body,
      // Short timeout — if api is down, don't hang the dashboard response
      signal: AbortSignal.timeout(2_000),
    });
  } catch (err) {
    console.error('[internal-emit] failed:', err);
  }
}
