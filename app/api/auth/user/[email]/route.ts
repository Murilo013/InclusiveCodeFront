import { NextRequest, NextResponse } from "next/server";
import { DEV_URL } from "../../../../lib/upstream";

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

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const params = await context.params;
    const email = decodeURIComponent(params.email ?? "").trim();

    if (!email) {
      return NextResponse.json({ message: "Email do usuario e obrigatorio." }, { status: 400 });
    }

    const upstream = await fetch(`${DEV_URL}/api/Auth/user/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const raw = await upstream.text();
    const data = parseUpstreamResponse(raw);

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Falha ao buscar dados do usuario.", detail: message },
      { status: 502 }
    );
  }
}
