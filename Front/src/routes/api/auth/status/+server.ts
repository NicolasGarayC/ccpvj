import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ authenticated: false, user: null });
	}

	return json({
		authenticated: true,
		user: {
			idUsuario: locals.user.id,
			nombreUsuario: locals.user.username,
			nombre: locals.user.nombre || locals.user.username,
			apellido: locals.user.apellido || '',
			telefono: locals.user.telefono || '',
			nombreRol: locals.user.role || 'Estudiante'
		}
	});
};