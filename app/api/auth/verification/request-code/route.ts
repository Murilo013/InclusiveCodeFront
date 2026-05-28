import { NextRequest, NextResponse } from "next/server";
import { createVerificationCode, savePendingRegistration } from "../../../../lib/emailVerification";
import { sendVerificationEmail } from "../../../../lib/smtp";

export const runtime = "nodejs";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const username = String(body?.username ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Informe usuario, email e senha para continuar." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Email invalido." }, { status: 400 });
    }

    const code = createVerificationCode();

    savePendingRegistration({
      username,
      email,
      password,
      code,
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({
      message: "Codigo enviado para o email informado.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[InclusiveCode] Falha ao enviar codigo de verificacao:", err);

    return NextResponse.json(
      { message: "Falha ao enviar codigo de verificacao.", detail: message },
      { status: 500 }
    );
  }
}
