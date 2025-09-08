import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirigir a login si no está autenticado
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	return {
		user: {
			idUsuario: locals.user.id,
			nombreUsuario: locals.user.username,
			nombre: locals.user.nombre || locals.user.username,
			apellido: locals.user.apellido || '',
			telefono: locals.user.telefono || '',
			nombreRol: locals.user.role || 'Estudiante'
		}
	};
};