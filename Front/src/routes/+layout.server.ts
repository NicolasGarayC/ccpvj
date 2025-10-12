import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies, request }) => {
	// TODO: Get user from JWT token validation

	return {
		user: {
			idUsuario: 1,
			nombreUsuario: 'admin',
			nombre: 'Admin',
			apellido: 'User',
			telefono: '',
			nombreRol: 'Administrador'
		}
	};
};
