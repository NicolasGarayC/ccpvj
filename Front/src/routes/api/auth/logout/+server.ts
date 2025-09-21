import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Forward the request to the backend using SimpleAuth
		const response = await fetch(`${BACKEND_URL}/simple-auth/logout`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				// Forward any cookies from the frontend to the backend
				'Cookie': request.headers.get('cookie') || ''
			},
			credentials: 'include'
		});

		// Get the response from backend (safely handle empty responses)
		let data;
		try {
			const text = await response.text();
			data = text ? JSON.parse(text) : {};
		} catch (parseError) {
			console.log('Backend response is not JSON, treating as success');
			data = {};
		}

		if (response.ok) {
			// If backend logout succeeded, clear the frontend session cookie
			cookies.delete('auth-session', { path: '/' });

			return json({
				success: true,
				message: data.message || 'Sesión cerrada correctamente'
			});
		} else {
			// Even if backend fails, clear frontend cookie for consistency
			cookies.delete('auth-session', { path: '/' });

			return json({
				success: true,
				message: 'Sesión cerrada correctamente'
			});
		}

	} catch (error) {
		console.error('Logout proxy error:', error);

		// Always clear the frontend cookie, even on errors
		cookies.delete('auth-session', { path: '/' });

		return json({
			success: true,
			message: 'Sesión cerrada correctamente'
		});
	}
};