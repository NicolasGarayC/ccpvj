import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const SERVER_SIDE_URL = 'http://192.168.68.101:5251';

// En server-side (SSR), siempre usar la IP del servidor:5251
// En client-side (browser), usar URLs relativas para evitar problemas CORS
const rawBaseUrl = browser
	? (env.PUBLIC_BACKEND_BASE_URL ?? '')
	: SERVER_SIDE_URL;

const configuredBaseUrl = rawBaseUrl ? normalizeBaseUrl(rawBaseUrl) : '';

// URLs relativas funcionan tanto en desarrollo como en producción
// El proxy de Vite (dev) o Nginx (prod) se encarga de redirigir a la API

export const BACKEND_BASE_URL = configuredBaseUrl;
export const BACKEND_API_URL = configuredBaseUrl ? `${BACKEND_BASE_URL}/api` : '/api';
