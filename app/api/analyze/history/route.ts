import { NextRequest, NextResponse } from 'next/server';
import { DEV_URL } from '../../../lib/upstream';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${DEV_URL}/api/analyze/history/me?userId=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const raw = await upstream.text();

    if (!raw) {
      return NextResponse.json([], { status: 200 });
    }

    try {
      const data = JSON.parse(raw);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json({ message: raw }, { status: upstream.status });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Failed to fetch history', detail: message }, { status: 502 });
  }
}
