import crypto from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant } from '@/lib/merchant';

interface PreviewConfig {
  botName?: string;
  tone?: string;
  customInstructions?: string | null;
  useEmojis?: boolean;
}

interface ChatRequestBody {
  message?: string;
  sessionId?: string;
  previewConfig?: PreviewConfig;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

const INTERNAL_CONTENT_TYPE = 'application/x-internal-playground-chat';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const secret = process.env.INTERNAL_HMAC_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: 'INTERNAL_HMAC_SECRET not configured' }, { status: 500 });
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const message = body.message?.trim();
  const sessionId = body.sessionId ?? 'playground-preview';
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

  const apiBase = (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://127.0.0.1:3001'
  ).replace(/\/$/, '').replace(/\/api$/, '');

  const payload = JSON.stringify({
    tenantId: merchant.id,
    shopDomain: merchant.shopDomain,
    message,
    sessionId,
    previewConfig: body.previewConfig,
    history: body.history,
  });

  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

  try {
    const res = await fetch(`${apiBase}/internal/playground-chat`, {
      method: 'POST',
      headers: {
        'content-type': INTERNAL_CONTENT_TYPE,
        'x-internal-signature': sig,
      },
      body: payload,
      signal: AbortSignal.timeout(50_000),
    });

    const data = await res.json().catch(() => ({ text: 'Invalid response from chat service.' }));
    if (!res.ok) {
      return NextResponse.json(
        { output: data?.text ?? 'Chat service error.', products: [], cart: null, order: null },
        { status: res.status },
      );
    }

    return NextResponse.json({
      output: data.text ?? '',
      reply: data.text ?? '',
      products: data.products ?? [],
      cart: data.cart ?? null,
      order: data.order ?? null,
    });
  } catch (err) {
    console.error('[api/chat] proxy failed:', err);
    return NextResponse.json(
      { output: 'Could not reach the chat service. Is the API server running?', products: [], cart: null, order: null },
      { status: 502 },
    );
  }
}
