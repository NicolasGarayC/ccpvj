import type { HandleClientError, HandleFetch } from '@sveltejs/kit';
import { authModalStore } from '$lib/stores/authStore';

// Interceptor de fetch para detectar sesión expirada
export const handleFetch: HandleFetch = async ({ request, fetch }) => {
	// Realizar la petición original
	const response = await fetch(request);

	// Si la respuesta es 401 (Unauthorized), mostrar modal de sesión expirada
	if (response.status === 401) {
		// Solo mostrar el modal si la petición fue a la API
		const url = new URL(request.url);
		if (url.pathname.startsWith('/api')) {
			console.warn('🔒 Sesión expirada detectada - Status 401');

			// Mostrar modal de sesión expirada
			authModalStore.showSessionExpired();

			// Limpiar token del localStorage
			if (typeof window !== 'undefined') {
				localStorage.removeItem('token');
				localStorage.removeItem('user');
			}
		}
	}

	return response;
};

// Manejo de errores del cliente
export const handleError: HandleClientError = async ({ error, event }) => {
	console.error('Client error:', error);

	return {
		message: 'Ha ocurrido un error inesperado'
	};
};
