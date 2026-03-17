import { NextRequest, NextResponse } from "next/server";

function parseUpstreamResponse(raw: string) {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const upstream = await fetch("http://localhost:5283/api/Auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await upstream.text();
    const data = parseUpstreamResponse(raw);

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Falha ao conectar com a API de autenticacao.", detail: message },
      { status: 502 }
    );
  }
}
