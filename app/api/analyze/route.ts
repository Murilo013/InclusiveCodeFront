import { NextRequest, NextResponse } from 'next/server';
import { UPSTREAM_BASE,DEV_URL } from '../../lib/upstream';

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const upstream = await fetch(`${DEV_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const raw = await upstream.text();

    if (!raw) {
      return NextResponse.json({ error: 'Empty response from upstream' }, { status: 502 });
    }

    try {
      const data = JSON.parse(raw);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      // Upstream returned non-JSON, forward raw message with upstream status
      return NextResponse.json({ message: raw }, { status: upstream.status });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: 'Failed to connect to upstream', detail: message }, { status: 502 });
  }
}