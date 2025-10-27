import { env } from '$env/dynamic/public';

const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const configuredBaseUrl = normalizeBaseUrl(env.PUBLIC_BACKEND_BASE_URL ?? '');

if (!configuredBaseUrl) {
	throw new Error('PUBLIC_BACKEND_BASE_URL no está configurada. Define esta variable en tu entorno o en .env.production.');
}

export const BACKEND_BASE_URL = configuredBaseUrl;
export const BACKEND_API_URL = `${BACKEND_BASE_URL}/api`;
