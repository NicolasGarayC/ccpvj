import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const sessionToken = cookies.get('auth-session');
		
		if (!sessionToken) {
			return json({ 
				success: false,
				error: 'No hay sesión activa' 
			}, { status: 401 });
		}

		const { session, user } = await validateSessionToken(sessionToken);
		
		if (!session || !user) {
			return json({ 
				success: false,
				error: 'Sesión inválida' 
			}, { status: 401 });
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
		return json({ 
			success: false,
			error: 'Error interno del servidor' 
		}, { status: 500 });
	}
};