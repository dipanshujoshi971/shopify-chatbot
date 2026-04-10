import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const sn = safeName(merchant.id);

  try {
    const rows = await pgPool.unsafe(
      `SELECT id, title, file_name, r2_key, status, chunk_count, created_at
         FROM "tenant_${sn}"."knowledge_sources"
        ORDER BY created_at DESC`,
    );
    return NextResponse.json({ sources: rows });
  } catch {
    return NextResponse.json({ sources: [] });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  // Forward multipart to the Fastify API
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const formData = await req.formData();

  const res = await fetch(`${apiUrl}/dashboard/knowledge`, {
    method: 'POST',
    headers: { 'X-Clerk-User-Id': userId },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data, { status: 201 });
}
