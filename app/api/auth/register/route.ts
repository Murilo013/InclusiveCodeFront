import { NextRequest, NextResponse } from "next/server";

function getApiBaseUrl(): string {
  const value = process.env.API_BASE_URL?.trim();

  if (!value) {
    throw new Error("API_BASE_URL is not configured.");
  }

  return value;
}

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
    const payload = {
      ...body,
      pro: typeof body?.pro === "boolean" ? body.pro : false,
      analisesCount:
        typeof body?.analisesCount === "number" && Number.isFinite(body.analisesCount)
          ? body.analisesCount
          : 0,
    };

    const upstream = await fetch(`${getApiBaseUrl()}/api/Auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await upstream.text();
    const data = parseUpstreamResponse(raw);

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Falha ao conectar com a API de cadastro.", detail: message },
      { status: 502 }
    );
  }
}