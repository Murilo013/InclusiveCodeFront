import { NextRequest, NextResponse } from 'next/server';
import { DEV_URL } from '../../../lib/upstream';

function parseUpstreamResponse(raw: string): Record<string, unknown> | unknown[] {
  if (!raw) {
    return [];
  }

  try {
    const data = JSON.parse(raw) as unknown;
    return data && typeof data === 'object' ? (data as Record<string, unknown> | unknown[]) : [];
  } catch {
    return { message: raw };
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')?.trim();

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${DEV_URL}/api/analyze/history/me?userId=${encodeURIComponent(userId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }
    );

    const raw = await upstream.text();
    return NextResponse.json(parseUpstreamResponse(raw), { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Failed to fetch history', detail: message }, { status: 502 });
  }
}

