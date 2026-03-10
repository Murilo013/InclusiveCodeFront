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

  // https://inclusivecodeapi-plan-anbxdbfkaeb8dvfy.brazilsouth-01.azurewebsites.net/api/analyze
  try {
<<<<<<< HEAD
    const upstream = await fetch('https://localhost:7234/api/analyze', {
=======
    const upstream = await fetch('http://localhost:5283/api/analyze', {
>>>>>>> origin/dev
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const raw = await upstream.text();

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
