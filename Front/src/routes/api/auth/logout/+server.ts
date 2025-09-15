import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSessionTokenCookie, validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { session } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const sessionToken = cookies.get('auth-session');

		if (sessionToken) {
			// Validar y eliminar la sesión de la base de datos
			try {
				const { session: userSession } = await validateSessionToken(sessionToken);
				if (userSession) {
					await db.delete(session).where(eq(session.id, userSession.id));
				}
			} catch (error) {
				console.error('Error deleting session from database:', error);
			}
		}

		// Limpiar cookie de sesión
		cookies.delete('auth-session', { path: '/' });

		return json({ success: true, message: 'Sesión cerrada correctamente' });

	} catch (error) {
		console.error('Logout error:', error);
		// Limpiar cookie incluso si hay error
		cookies.delete('auth-session', { path: '/' });
		return json({ success: true, message: 'Sesión cerrada correctamente' });
	}
};