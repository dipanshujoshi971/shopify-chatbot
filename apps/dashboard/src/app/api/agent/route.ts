import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant, getAgentConfig, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const config = await getAgentConfig(merchant.id);
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const body = (await req.json()) as {
    botName?: string;
    tone?: string;
    customInstructions?: string;
    useEmojis?: boolean;
  };

  const sn = safeName(merchant.id);

  await pgPool.unsafe(
    `INSERT INTO "tenant_${sn}"."agent_config"
       (id, bot_name, tone, custom_instructions, use_emojis, updated_at)
     VALUES ('singleton', $1, $2, $3, $4, now())
     ON CONFLICT (id) DO UPDATE SET
       bot_name             = EXCLUDED.bot_name,
       tone                 = EXCLUDED.tone,
       custom_instructions  = EXCLUDED.custom_instructions,
       use_emojis           = EXCLUDED.use_emojis,
       updated_at           = now()`,
    [
      body.botName             ?? 'Assistant',
      body.tone                ?? 'friendly',
      body.customInstructions  ?? null,
      body.useEmojis           ?? false,
    ],
  );

  return NextResponse.json({ success: true });
}