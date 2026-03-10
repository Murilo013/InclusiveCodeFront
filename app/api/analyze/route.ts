import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // https://inclusivecodeapi-plan-anbxdbfkaeb8dvfy.brazilsouth-01.azurewebsites.net/api/analyze
  try {
    const upstream = await fetch('https://inclusivecodeapi-plan-anbxdbfkaeb8dvfy.brazilsouth-01.azurewebsites.net/api/analyze', {
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
