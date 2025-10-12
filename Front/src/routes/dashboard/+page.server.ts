import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
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