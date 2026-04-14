import { NextRequest, NextResponse } from 'next/server';
import { DEV_URL } from '../../lib/upstream';

const HIGH_DEMAND_MESSAGE = 'Modelo com alta demanda, aguarde e tente novamente.';

function extractMessage(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const source = data as Record<string, unknown>;
  const candidate = source.message ?? source.error ?? source.detail;
  return typeof candidate === 'string' ? candidate : '';
}

function isHighDemandError(status: number, message: string): boolean {
  if ([429, 503, 504].includes(status)) {
    return true;
  }

  const normalized = message.toLowerCase();
  const hints = [
    'rate limit',
    'too many requests',
    'model overloaded',
    'overloaded',
    'service unavailable',
    'temporarily unavailable',
    'high demand',
    'alta demanda',
    'resource exhausted',
    'quota',
    'timeout',
    'timed out',
    'gateway timeout',
    'busy',
  ];

  return hints.some((hint) => normalized.includes(hint));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;

  const headerUserId = req.headers.get('x-user-id');
  const bodyUserId = body.userId ?? body.id;

  const normalizedHeaderUserId =
    headerUserId && headerUserId.trim().length > 0 ? headerUserId.trim() : null;
  const normalizedBodyUserId =
    (typeof bodyUserId === 'string' && bodyUserId.trim().length > 0) || typeof bodyUserId === 'number'
      ? bodyUserId
      : null;

  const upstreamBody: Record<string, unknown> = { ...body };

  if (normalizedHeaderUserId || normalizedBodyUserId !== null) {
    const resolvedUserId = normalizedHeaderUserId ?? normalizedBodyUserId;
    upstreamBody.userId = resolvedUserId;
    upstreamBody.id = resolvedUserId;
  } else {
    delete upstreamBody.userId;
    delete upstreamBody.id;
  }

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

      if (!upstream.ok) {
        const message = extractMessage(data) || raw;
        if (isHighDemandError(upstream.status, message)) {
          return NextResponse.json({ message: HIGH_DEMAND_MESSAGE }, { status: upstream.status });
        }
      }

      return NextResponse.json(data, { status: upstream.status });
    } catch {
      if (!upstream.ok && isHighDemandError(upstream.status, raw)) {
        return NextResponse.json({ message: HIGH_DEMAND_MESSAGE }, { status: upstream.status });
      }

      return NextResponse.json({ message: raw }, { status: upstream.status });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (isHighDemandError(502, message)) {
      return NextResponse.json({ message: HIGH_DEMAND_MESSAGE }, { status: 503 });
    }

    return NextResponse.json({ message: 'Failed to connect to upstream', detail: message }, { status: 502 });
  }
}