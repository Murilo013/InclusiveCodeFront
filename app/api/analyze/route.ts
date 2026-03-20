import { NextRequest, NextResponse } from 'next/server';
import { UPSTREAM_BASE,DEV_URL } from '../../lib/upstream';

async function tryFetch(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  return { res, raw };
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const upstream = await fetch(`${DEV_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: 'UPSTREAM_ANALYZE_URL is not configured' },
      { status: 500 },
    );
  }

  let lastError: any = null;

  for (const url of candidates) {
    try {
      const data = JSON.parse(raw);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json({ error: 'Upstream returned non-JSON', raw }, { status: 502 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to fetch upstream', message }, { status: 502 });
  }

  return NextResponse.json({ error: 'Failed to fetch upstream', lastError, attempted: candidates }, { status: 502 });
}
