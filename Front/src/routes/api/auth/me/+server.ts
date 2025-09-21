import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const GET: RequestHandler = async ({ request, cookies }) => {
	try {
		// Try to get auth-session cookie from SvelteKit cookies first
		let authSessionCookie = cookies.get('auth-session');

		// If not found in SvelteKit cookies, parse from request headers (for testing/curl)
		if (!authSessionCookie) {
			const cookieHeader = request.headers.get('cookie');
			if (cookieHeader) {
				const match = cookieHeader.match(/auth-session=([^;]+)/);
				if (match) {
					authSessionCookie = match[1];
				}
			}
		}

		if (!authSessionCookie) {
			// No session cookie present
			return json({
				success: true,
				data: {
					user: null
				}
			});
		}

		// Forward the request to the backend using SimpleAuth
		const response = await fetch(`${BACKEND_URL}/simple-auth/me`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': `auth-session=${authSessionCookie}`
			},
			credentials: 'include'
		});

		if (response.ok) {
			// Get the backend response
			const data = await response.json();

			// Transform backend response format to match AuthService expectations
			if (data.success && data.user) {
				return json({
					success: true,
					data: {
						user: {
							idUsuario: data.user.id,
							nombreUsuario: data.user.username,
							nombre: data.user.nombre,
							apellido: data.user.apellido,
							nombreRol: data.user.role
						}
					}
				});
			} else {
				return json({
					success: true,
					data: {
						user: null
					}
				});
			}
		} else {
			// Return success with null user for unauthenticated/invalid sessions
			return json({
				success: true,
				data: {
					user: null
				}
			});
		}

	} catch (error) {
		console.error('Auth me proxy error:', error);

		// Return success with null user even on server errors to avoid breaking the UI
		return json({
			success: true,
			data: {
				user: null
			}
		});
	}
};