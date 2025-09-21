import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = 'http://localhost:5251/api';

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Forward the request to the backend using SimpleAuth
		const response = await fetch(`${BACKEND_URL}/simple-auth/me`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				// Forward any cookies from the frontend to the backend
				'Cookie': request.headers.get('cookie') || ''
			},
			credentials: 'include'
		});

		if (response.ok) {
			const data = await response.json();

			if (data.success && data.data?.user) {
				// Transform to match the status endpoint format
				return json({
					authenticated: true,
					user: {
						idUsuario: data.data.user.idUsuario,
						nombreUsuario: data.data.user.nombreUsuario,
						nombre: data.data.user.nombre,
						apellido: data.data.user.apellido,
						telefono: data.data.user.telefono || '',
						nombreRol: data.data.user.nombreRol
					}
				});
			}
		}

		// User not authenticated or backend error
		return json({
			authenticated: false,
			user: null
		});

	} catch (error) {
		console.error('Auth status proxy error:', error);
		return json({
			authenticated: false,
			user: null
		});
	}
};