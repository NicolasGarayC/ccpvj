import { env } from '$env/dynamic/public';

const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const DEV_FALLBACK_BASE_URL = 'http://localhost:5251';
const rawBaseUrl =
	env.PUBLIC_BACKEND_BASE_URL ??
	(import.meta.env?.DEV ? DEV_FALLBACK_BASE_URL : '');
const configuredBaseUrl = rawBaseUrl ? normalizeBaseUrl(rawBaseUrl) : '';

if (!configuredBaseUrl) {
	throw new Error(
		'PUBLIC_BACKEND_BASE_URL no está configurada. Define esta variable en tu entorno o en .env.production.'
	);
}

export const BACKEND_BASE_URL = configuredBaseUrl;
export const BACKEND_API_URL = `${BACKEND_BASE_URL}/api`;
