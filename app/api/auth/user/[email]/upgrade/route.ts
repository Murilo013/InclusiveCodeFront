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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const requestBody = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const params = await context.params;
    const email = decodeURIComponent(params.email ?? "").trim();
    const providedCode = String(requestBody?.upgradeCode ?? "").trim();
    const expectedCode = (process.env.PRO_UPGRADE_CODE ?? "inclusiveprosecrect").trim();

    if (!email) {
      return NextResponse.json({ message: "Email do usuario e obrigatorio." }, { status: 400 });
    }

    if (!providedCode) {
      return NextResponse.json(
        { message: "Informe o codigo de upgrade para continuar." },
        { status: 400 }
      );
    }

    if (providedCode !== expectedCode) {
      return NextResponse.json(
        { message: "Codigo de upgrade invalido." },
        { status: 401 }
      );
    }

    const upstream = await fetch(
      `${getApiBaseUrl()}/api/auth/user/${encodeURIComponent(email)}/upgrade`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const raw = await upstream.text();
    const data = parseUpstreamResponse(raw);

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Falha ao atualizar plano Pro.", detail: message },
      { status: 502 }
    );
  }
}