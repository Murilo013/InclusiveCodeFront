import { NextRequest, NextResponse } from 'next/server';

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

  const envUrl = process.env.UPSTREAM_ANALYZE_URL;
  const candidates = [envUrl, 'https://localhost:5283/api/analyze', 'http://localhost:5283/api/analyze'].filter(Boolean) as string[];

  let lastError: any = null;

  for (const url of candidates) {
    try {
      const { res: upstream, raw } = await tryFetch(url, body);

      if (!raw) {
        return NextResponse.json({ error: 'Empty response from upstream', attempted: url }, { status: 502 });
      }

      try {
        const data = JSON.parse(raw);
        return NextResponse.json(data, { status: upstream.status });
      } catch (err) {
        return NextResponse.json({ error: 'Upstream returned non-JSON', attempted: url, raw }, { status: 502 });
      }
    } catch (err: any) {
      lastError = { attempted: url, message: err?.message ?? String(err) };
      // try next candidate
    }
  }

  return NextResponse.json({ error: 'Failed to fetch upstream', lastError, attempted: candidates }, { status: 502 });
}
