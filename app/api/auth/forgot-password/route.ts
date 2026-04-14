import { NextRequest, NextResponse } from "next/server";
import { UPSTREAM_BASE } from "../../../lib/upstream";

function parseUpstreamResponse(raw: string) {
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const upstream = await fetch(`${UPSTREAM_BASE}/api/Auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await upstream.text();
    const data = parseUpstreamResponse(raw);

    // Pass through upstream status and body so frontend can react accordingly
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Falha ao conectar com a API de autenticação.", detail: message },
      { status: 502 }
    );
  }
}
