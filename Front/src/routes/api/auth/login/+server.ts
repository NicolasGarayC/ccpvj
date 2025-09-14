import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, generateSessionToken } from '$lib/server/auth';

// Usar autenticación directa de SvelteKit en lugar de proxy al backend .NET
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 });
		}

		// Buscar usuario en la base de datos
		const user = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, username))
			.limit(1);

		if (user.length === 0) {
			return json({ 
				success: false,
				error: 'Credenciales inválidas' 
			}, { status: 401 });
		}

		const foundUser = user[0];

		// Verificar contraseña (texto plano para desarrollo)
		const isValidPassword = foundUser.passwordHash === password;
		if (!isValidPassword) {
			return json({ 
				success: false,
				error: 'Credenciales inválidas' 
			}, { status: 401 });
		}

		// Crear sesión
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, foundUser.id);
		
		// Establecer cookie de sesión (usar el mismo nombre que en auth.ts)
		cookies.set('auth-session', sessionToken, {
			httpOnly: true,
			secure: false, // Para desarrollo local
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30, // 30 días
			path: '/'
		});

		// Devolver respuesta exitosa
		return json({
			success: true,
			data: {
				user: {
					id: foundUser.id,
					username: foundUser.username,
					nombre: foundUser.nombre,
					apellido: foundUser.apellido,
					role: foundUser.role,
					nombreRol: foundUser.role  // Agregar compatibilidad con el layout
				},
				session: {
					id: session.id,
					expiresAt: session.expiresAt
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