import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies, request }) => {
	// Si no hay usuario en locals, verificar localStorage a través de cookies/headers de demo
	if (!locals.user) {
		// Leer usuario desde cookie o localStorage (simulado por cookie 'demo-user')
		const demoUser = cookies.get('demo-user');
		if (demoUser) {
			try {
				const user = JSON.parse(demoUser);
				return { user };
			} catch (e) {
				return { user: null };
			}
		}
	}
	// Adaptar estructura al backend real
	return {
		user: locals.user ? {
			idUsuario: locals.user.id,
			nombreUsuario: locals.user.username,
			nombre: locals.user.nombre || locals.user.username,
			apellido: locals.user.apellido || '',
			telefono: locals.user.telefono || '',
			nombreRol: locals.user.role || 'Estudiante'
		} : null
	};
};
