// Centraliza a URL base do backend para facilitar troca entre ambientes.
const DEFAULT_PROD_URL = "https://inclusivecodeapi.onrender.com";

function resolveValidBaseUrl(candidate: string | undefined): string | null {
	const raw = candidate?.trim();

	if (!raw) {
		return null;
	}

	try {
		const parsed = new URL(raw);
		const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";

		if (!isHttp) {
			return null;
		}

		const host = parsed.hostname.toLowerCase();
		const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
		const isVercelProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

		if (isVercelProd && isLocalHost) {
			return null;
		}

		return parsed.origin;
	} catch {
		return null;
	}
}

const baseFromEnv =
	resolveValidBaseUrl(process.env.API_BASE_URL) ||
	resolveValidBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

export const UPSTREAM_BASE = baseFromEnv || DEFAULT_PROD_URL;

