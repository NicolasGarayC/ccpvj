import { env } from '$env/dynamic/public';

const normalizeBaseUrl = (url: string | undefined): string => {
	const trimmed = (url ?? '').trim().replace(/\/+$/, '');
	return trimmed.length > 0 ? trimmed : 'http://localhost:5251';
};

export const BACKEND_BASE_URL = normalizeBaseUrl(env.PUBLIC_BACKEND_BASE_URL);
export const BACKEND_API_URL = `${BACKEND_BASE_URL}/api`;
