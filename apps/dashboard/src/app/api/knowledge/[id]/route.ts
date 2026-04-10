import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchant();
  if (!merchant) return NextResponse.json({ error: 'No store connected' }, { status: 404 });

  const { id } = await params;

  // Forward delete to the Fastify API (handles R2 cleanup + DB delete)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const res = await fetch(`${apiUrl}/dashboard/knowledge/${id}`, {
    method: 'DELETE',
    headers: { 'X-Clerk-User-Id': userId },
  });

  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({ error: 'Delete failed' }));
    return NextResponse.json(data, { status: res.status });
  }

  return new NextResponse(null, { status: 204 });
}
