import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Endpoint de registro público deshabilitado
// Solo administradores y colaboradores pueden crear usuarios a través del sistema de gestión
export const POST: RequestHandler = async () => {
	return json({ 
		error: 'El registro público está deshabilitado. Contacta con un administrador para crear tu cuenta.' 
	}, { status: 403 });
};