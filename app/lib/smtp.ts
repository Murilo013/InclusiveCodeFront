import nodemailer from "nodemailer";

const defaultPort = 587;

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultPort;
}

function shouldBypassSmtp(): boolean {
  return (process.env.EMAIL_VERIFICATION_BYPASS_SMTP ?? "false").toLowerCase() === "true";
}

function normalizeValue(value: string | undefined): string {
  return (value ?? "").trim();
}

function normalizePassword(value: string | undefined): string {
  return normalizeValue(value).replace(/\s+/g, "");
}

function createTransporter() {
  const host = normalizeValue(process.env.SMTP_HOST);
  const user = normalizeValue(process.env.SMTP_USER);
  const pass = normalizePassword(process.env.SMTP_PASS);

  if (!host || !user || !pass) {
    throw new Error("Variaveis SMTP_HOST, SMTP_USER e SMTP_PASS sao obrigatorias.");
  }

  return nodemailer.createTransport({
    host,
    port: parsePort(process.env.SMTP_PORT),
    secure: (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
    auth: {
      user,
      pass,
    },
  });
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  if (shouldBypassSmtp()) {
    console.log(`[InclusiveCode] EMAIL_VERIFICATION_BYPASS_SMTP=true. Codigo para ${email}: ${code}`);
    return;
  }

  const transporter = createTransporter();
  const from = normalizeValue(process.env.SMTP_FROM ?? process.env.SMTP_USER);

  if (!from) {
    throw new Error("Variavel SMTP_FROM ou SMTP_USER obrigatoria para envio.");
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: "Codigo de verificacao - InclusiveCode",
    text: `Seu codigo de verificacao e: ${code}.`,
    html: `<p>Seu codigo de verificacao e:</p><h2>${code}</h2><p>Esse codigo expira em poucos minutos.</p>`,
  });
}
