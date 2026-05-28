export type AuthUserSession = {
  username: string;
  email: string;
  userId: string | null;
  verificado: boolean;
  analisesCount: number;
  pro: boolean;
};

const SESSION_KEYS = {
  username: "auth_user",
  email: "auth_email",
  userIdPrimary: "auth_user_id",
  userIdLegacyLower: "userId",
  userIdLegacyUpper: "UserId",
  verified: "auth_user_verified",
  analysesCount: "auth_user_analises_count",
  pro: "auth_user_pro",
} as const;

function isBrowser() {
  return typeof window !== "undefined";
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "sim"].includes(normalized)) return true;
    if (["false", "0", "no", "nao"].includes(normalized)) return false;
  }

  return null;
}

function parseNonNegativeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return null;

    const parsed = Number.parseInt(normalized, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectUserSources(data: Record<string, unknown>): Record<string, unknown>[] {
  const sources: Record<string, unknown>[] = [];
  const seen = new Set<Record<string, unknown>>();
  const nestedKeys = [
    "user",
    "usuario",
    "data",
    "result",
    "payload",
    "profile",
    "account",
    "userData",
    "usuarioData",
  ];

  const enqueue = (value: unknown) => {
    if (!isRecord(value)) {
      return;
    }

    if (seen.has(value)) {
      return;
    }

    sources.push(value);
    seen.add(value);
  };

  enqueue(data);

  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index];
    nestedKeys.forEach((key) => enqueue(source[key]));
  }

  return sources;
}

function pickValue(sources: Record<string, unknown>[], keys: string[]) {
  for (const source of sources) {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        return source[key];
      }
    }
  }

  return undefined;
}

export function resolveUserIdFromPayload(data: Record<string, unknown>): string | null {
  const sources = collectUserSources(data);
  const keys = [
    "UserId",
    "userId",
    "id",
    "user_id",
    "usuarioId",
    "idUsuario",
    "IdUsuario",
    "userID",
  ];

  for (const source of sources) {
    for (const key of keys) {
      const candidate = source[key];

      if (typeof candidate === "number" && candidate > 0) {
        return String(candidate);
      }

      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
  }

  return null;
}

export function normalizeAuthUserFromPayload(
  data: Record<string, unknown>,
  fallback?: { username?: string; email?: string }
): AuthUserSession {
  const sources = collectUserSources(data);

  const usernameCandidate =
    (typeof pickValue(sources, ["username", "nome", "name", "login", "userName", "UserName"]) ===
      "string" &&
      String(pickValue(sources, ["username", "nome", "name", "login", "userName", "UserName"]))
        .trim()) ||
    (typeof fallback?.username === "string" && fallback.username.trim()) ||
    "";

  const emailCandidate =
    (typeof pickValue(sources, ["email", "Email", "mail", "userEmail"]) === "string" &&
      String(pickValue(sources, ["email", "Email", "mail", "userEmail"]))
        .trim()) ||
    (typeof fallback?.email === "string" && fallback.email.trim()) ||
    "";

  const verifiedCandidate = parseBoolean(
    pickValue(sources, ["verificado", "Verificado", "verified", "isVerified", "emailVerified"])
  );

  const analysesCountCandidate = parseNonNegativeInt(
    pickValue(sources, [
      "analisesCount",
      "AnalisesCount",
      "analysesCount",
      "analysisCount",
      "analiseCount",
      "analysis_count",
      "analises_count",
    ])
  );

  const proCandidate =
    parseBoolean(
      pickValue(sources, ["pro", "Pro", "isPro", "planoPro", "planPro", "premium"])
    ) ?? false;

  return {
    username: usernameCandidate,
    email: emailCandidate,
    userId: resolveUserIdFromPayload(data),
    verificado: verifiedCandidate ?? false,
    analisesCount: analysesCountCandidate ?? 0,
    pro: proCandidate,
  };
}

export function getStoredAuthUser(): AuthUserSession | null {
  if (!isBrowser()) {
    return null;
  }

  const username = sessionStorage.getItem(SESSION_KEYS.username) ?? "";
  const email = sessionStorage.getItem(SESSION_KEYS.email) ?? "";
  const userId =
    sessionStorage.getItem(SESSION_KEYS.userIdPrimary) ??
    sessionStorage.getItem(SESSION_KEYS.userIdLegacyLower) ??
    sessionStorage.getItem(SESSION_KEYS.userIdLegacyUpper);

  if (!username && !email && !userId) {
    return null;
  }

  const verificado = parseBoolean(sessionStorage.getItem(SESSION_KEYS.verified)) ?? false;
  const analisesCount =
    parseNonNegativeInt(sessionStorage.getItem(SESSION_KEYS.analysesCount)) ?? 0;
  const pro = parseBoolean(sessionStorage.getItem(SESSION_KEYS.pro)) ?? false;

  return {
    username,
    email,
    userId,
    verificado,
    analisesCount,
    pro,
  };
}

export function setStoredAuthUser(patch: Partial<AuthUserSession>): AuthUserSession | null {
  if (!isBrowser()) {
    return null;
  }

  const current = getStoredAuthUser() ?? {
    username: "",
    email: "",
    userId: null,
    verificado: false,
    analisesCount: 0,
    pro: false,
  };

  const next: AuthUserSession = {
    ...current,
    ...patch,
    analisesCount: Math.max(0, Math.floor(patch.analisesCount ?? current.analisesCount)),
  };

  if (next.username) {
    sessionStorage.setItem(SESSION_KEYS.username, next.username);
  }

  if (next.email) {
    sessionStorage.setItem(SESSION_KEYS.email, next.email);
  }

  if (next.userId) {
    sessionStorage.setItem(SESSION_KEYS.userIdPrimary, next.userId);
    sessionStorage.setItem(SESSION_KEYS.userIdLegacyLower, next.userId);
    sessionStorage.setItem(SESSION_KEYS.userIdLegacyUpper, next.userId);
  } else {
    sessionStorage.removeItem(SESSION_KEYS.userIdPrimary);
    sessionStorage.removeItem(SESSION_KEYS.userIdLegacyLower);
    sessionStorage.removeItem(SESSION_KEYS.userIdLegacyUpper);
  }

  sessionStorage.setItem(SESSION_KEYS.verified, String(next.verificado));
  sessionStorage.setItem(SESSION_KEYS.analysesCount, String(next.analisesCount));
  sessionStorage.setItem(SESSION_KEYS.pro, String(next.pro));

  return next;
}

export function setStoredAuthUserFromPayload(
  payload: Record<string, unknown>,
  fallback?: { username?: string; email?: string }
): AuthUserSession | null {
  const normalized = normalizeAuthUserFromPayload(payload, fallback);
  return setStoredAuthUser(normalized);
}

export function incrementStoredAnalisesCount(step = 1): AuthUserSession | null {
  const current = getStoredAuthUser();
  if (!current) {
    return null;
  }

  return setStoredAuthUser({
    analisesCount: Math.max(0, current.analisesCount + step),
  });
}

export function clearStoredAuthUser() {
  if (!isBrowser()) {
    return;
  }

  const keysToClear = [
    SESSION_KEYS.username,
    SESSION_KEYS.email,
    SESSION_KEYS.userIdPrimary,
    SESSION_KEYS.userIdLegacyLower,
    SESSION_KEYS.userIdLegacyUpper,
    SESSION_KEYS.verified,
    SESSION_KEYS.analysesCount,
    SESSION_KEYS.pro,
  ];

  keysToClear.forEach((key) => {
    sessionStorage.removeItem(key);
  });
}
