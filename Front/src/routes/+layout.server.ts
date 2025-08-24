import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies, request }) => {
	// Si no hay usuario en locals, verificar localStorage a través de cookies/headers de demo
	if (!locals.user) {
		// En una app real, aquí manejarías la sesión apropiadamente
		// Para demo, podemos usar una cookie especial
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

	return {
		user: locals.user ? {
			id: locals.user.id,
			username: locals.user.username,
			nombre: locals.user.username, // Adaptar según tu estructura
			role: 'student' // Adaptar según tu estructura
		} : null
	};
};
