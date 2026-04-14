import { NextRequest, NextResponse } from "next/server";
import {
  clearPendingRegistration,
  verifyPendingRegistrationCode,
} from "../../../../lib/emailVerification";
import { UPSTREAM_BASE } from "../../../../lib/upstream";

export const runtime = "nodejs";

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
    const email = String(body?.email ?? "").trim();
    const code = String(body?.code ?? "").trim();

    if (!email || !code) {
      return NextResponse.json(
        { message: "Informe email e codigo para confirmar o cadastro." },
        { status: 400 }
      );
    }

    const verification = verifyPendingRegistrationCode(email, code);

    if (!verification.ok) {
      return NextResponse.json({ message: verification.message }, { status: verification.status });
    }

    const upstream = await fetch(`${UPSTREAM_BASE}/api/Auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: verification.pending.username,
        email: verification.pending.email,
        password: verification.pending.password,
        verificado: true,
        pro: false,
        analisesCount: 0,
      }),
    });

    const raw = await upstream.text();
    const data = parseUpstreamResponse(raw);

    if (upstream.ok) {
      clearPendingRegistration(verification.pending.email);
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Falha ao confirmar codigo de verificacao.", detail: message },
      { status: 500 }
    );
  }
}
