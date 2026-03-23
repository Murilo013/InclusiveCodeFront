import { NextRequest, NextResponse } from 'next/server';
import { DEV_URL } from '../../lib/upstream';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Extract userId from header or body
  const userId = req.headers.get('x-user-id') || body.id;

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Add id to body if not present
  const upstreamBody = { ...body, id: userId };

  try {
    const upstream = await fetch(`${DEV_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(upstreamBody),
    });

    const raw = await upstream.text();

    if (!raw) {
      return NextResponse.json({ error: 'Empty response from upstream' }, { status: 502 });
    }

    try {
      const data = JSON.parse(raw);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json({ message: raw }, { status: upstream.status });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Failed to connect to upstream', detail: message }, { status: 502 });
  }
}