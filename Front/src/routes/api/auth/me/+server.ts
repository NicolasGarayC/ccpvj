import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const sessionToken = cookies.get('auth-session');

		if (!sessionToken) {
			// Return success with null user for unauthenticated access
			return json({
				success: true,
				data: {
					user: null
				}
			});
		}

		const { session, user } = await validateSessionToken(sessionToken);

		if (!session || !user) {
			// Return success with null user for invalid sessions
			return json({
				success: true,
				data: {
					user: null
				}
			});
		}

		// Devolver datos del usuario compatible con el layout
		return json({
			success: true,
			data: {
				user: {
					id: user.id,
					username: user.username,
					nombre: user.nombre || user.username,
					apellido: user.apellido || '',
					role: user.role || 'Usuario',
					nombreRol: user.role || 'Usuario'
				}
			}
		});

	} catch (error) {
		console.error('Error in /api/auth/me:', error);
		// Return success with null user even on server errors to avoid breaking the UI
		return json({
			success: true,
			data: {
				user: null
			}
		});
	}
};