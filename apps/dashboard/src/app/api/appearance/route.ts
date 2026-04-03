import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

async function ensureWidgetConfigColumn(sn: string) {
  await pgPool.unsafe(
    `ALTER TABLE "tenant_${sn}"."agent_config"
     ADD COLUMN IF NOT EXISTS widget_config JSONB DEFAULT '{}'::jsonb`,
  );
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);

  try {
    await ensureWidgetConfigColumn(sn);

    const rows = await pgPool.unsafe(
      `SELECT bot_name, tone, use_emojis, custom_instructions,
              COALESCE(widget_config, '{}'::jsonb) AS widget_config
         FROM "tenant_${sn}"."agent_config"
        WHERE id = 'singleton'`,
    );

    if (!rows[0]) {
      return NextResponse.json({
        config: {
          botName: 'Assistant',
          tone: 'friendly',
          useEmojis: false,
          customInstructions: null,
          widgetConfig: {
            theme: 'emerald',
            mode: 'light',
            position: 'right',
            greeting: 'Hi there! How can I help you today?',
          },
        },
      });
    }

    const row = rows[0] as any;
    return NextResponse.json({
      config: {
        botName: row.bot_name,
        tone: row.tone,
        useEmojis: row.use_emojis,
        customInstructions: row.custom_instructions,
        widgetConfig: row.widget_config ?? {},
      },
    });
  } catch {
    return NextResponse.json({
      config: {
        botName: 'Assistant',
        tone: 'friendly',
        useEmojis: false,
        customInstructions: null,
        widgetConfig: {},
      },
    });
  }
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);
  const body = (await req.json()) as {
    botName?: string;
    tone?: string;
    useEmojis?: boolean;
    customInstructions?: string;
    widgetConfig?: Record<string, unknown>;
  };

  try {
    await ensureWidgetConfigColumn(sn);

    await pgPool.unsafe(
      `INSERT INTO "tenant_${sn}"."agent_config"
         (id, bot_name, tone, custom_instructions, use_emojis, widget_config, updated_at)
       VALUES ('singleton', $1, $2, $3, $4, $5::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET
         bot_name            = EXCLUDED.bot_name,
         tone                = EXCLUDED.tone,
         custom_instructions = EXCLUDED.custom_instructions,
         use_emojis          = EXCLUDED.use_emojis,
         widget_config       = EXCLUDED.widget_config,
         updated_at          = now()`,
      [
        body.botName ?? 'Assistant',
        body.tone ?? 'friendly',
        body.customInstructions ?? null,
        body.useEmojis ?? false,
        JSON.stringify(body.widgetConfig ?? {}),
      ],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save appearance' }, { status: 500 });
  }
}
