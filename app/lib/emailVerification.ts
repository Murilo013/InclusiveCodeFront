import { randomInt } from "crypto";

const DEFAULT_CODE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

type PendingRegistration = {
  username: string;
  email: string;
  password: string;
  code: string;
  expiresAt: number;
  attempts: number;
};

const pendingRegistrations = new Map<string, PendingRegistration>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function cleanupExpiredEntries(now: number): void {
  for (const [email, pending] of pendingRegistrations.entries()) {
    if (pending.expiresAt <= now) {
      pendingRegistrations.delete(email);
    }
  }
}

function codeTtlMs(): number {
  return parsePositiveInt(process.env.EMAIL_VERIFICATION_CODE_TTL_MS, DEFAULT_CODE_TTL_MS);
}

function maxAttempts(): number {
  return parsePositiveInt(process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS);
}

export function createVerificationCode(): string {
  return randomInt(0, 1000000).toString().padStart(6, "0");
}

export function savePendingRegistration(input: {
  username: string;
  email: string;
  password: string;
  code: string;
}): void {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const key = normalizeEmail(input.email);
  pendingRegistrations.set(key, {
    username: input.username,
    email: key,
    password: input.password,
    code: input.code,
    attempts: 0,
    expiresAt: now + codeTtlMs(),
  });
}

export type VerificationResult =
  | {
      ok: true;
      pending: PendingRegistration;
    }
  | {
      ok: false;
      message: string;
      status: number;
    };

export function verifyPendingRegistrationCode(email: string, code: string): VerificationResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const key = normalizeEmail(email);
  const pending = pendingRegistrations.get(key);

  if (!pending) {
    return {
      ok: false,
      message: "Codigo ausente ou expirado. Solicite um novo codigo.",
      status: 400,
    };
  }

  if (pending.expiresAt <= now) {
    pendingRegistrations.delete(key);
    return {
      ok: false,
      message: "Codigo expirado. Solicite um novo codigo.",
      status: 400,
    };
  }

  if (pending.code !== code.trim()) {
    pending.attempts += 1;

    if (pending.attempts >= maxAttempts()) {
      pendingRegistrations.delete(key);
      return {
        ok: false,
        message: "Numero maximo de tentativas excedido. Solicite um novo codigo.",
        status: 429,
      };
    }

    return {
      ok: false,
      message: "Codigo invalido.",
      status: 400,
    };
  }

  return {
    ok: true,
    pending,
  };
}

export function clearPendingRegistration(email: string): void {
  pendingRegistrations.delete(normalizeEmail(email));
}
