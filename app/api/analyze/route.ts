import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const upstream = await fetch('https://localhost:7234/api/analyze', {
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
    } catch (err) {
      return NextResponse.json({ error: 'Upstream returned non-JSON', raw }, { status: 502 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch upstream', message: err?.message ?? String(err) }, { status: 502 });
  }
}
