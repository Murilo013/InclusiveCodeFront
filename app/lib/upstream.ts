// Centraliza a URL base do backend para facilitar troca entre ambientes.
const DEFAULT_PROD_URL = "https://inclusivecodeapi-plan-anbxdbfkaeb8dvfy.brazilsouth-01.azurewebsites.net";
const DEFAULT_DEV_URL = "http://localhost:5283";

export const UPSTREAM_BASE =
	process.env.API_BASE_URL?.trim() ||
	process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
	DEFAULT_PROD_URL;

export const DEV_URL =
	process.env.API_DEV_URL?.trim() ||
	process.env.NEXT_PUBLIC_API_DEV_URL?.trim() ||
	DEFAULT_DEV_URL;

