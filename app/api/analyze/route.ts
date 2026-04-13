import { NextRequest, NextResponse } from 'next/server';
import { UPSTREAM_BASE,DEV_URL } from '../../lib/upstream';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;

  const headerUserId = req.headers.get('x-user-id');
  const bodyUserId = body.id;

  const normalizedHeaderUserId =
    headerUserId && headerUserId.trim().length > 0 ? headerUserId.trim() : null;
  const normalizedBodyUserId =
    (typeof bodyUserId === 'string' && bodyUserId.trim().length > 0) || typeof bodyUserId === 'number'
      ? bodyUserId
      : null;

  const upstreamBody: Record<string, unknown> = { ...body };

  if (normalizedHeaderUserId || normalizedBodyUserId !== null) {
    upstreamBody.id = normalizedHeaderUserId ?? normalizedBodyUserId;
  } else {
    delete upstreamBody.id;
  }

  try {
    const upstream = await fetch(`${UPSTREAM_BASE}/api/analyze`, {
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