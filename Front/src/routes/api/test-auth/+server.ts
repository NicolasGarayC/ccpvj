import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Verificar conexión a la base de datos
		const userCount = await db.select().from(table.user).limit(1);
		const sessionCount = await db.select().from(table.session).limit(1);

		// Verificar estructura de tablas
		const testUser = await db
			.select({
				id: table.user.id,
				username: table.user.username,
				role: table.user.role,
				createdAt: table.user.createdAt
			})
			.from(table.user)
			.limit(1);

		return json({
			status: 'ok',
			database: {
				connected: true,
				tables: {
					users: userCount.length,
					sessions: sessionCount.length
				}
			},
			sample_user: testUser[0] || null,
			message: 'Sistema de autenticación listo. Usa: admin/admin123 o estudiante/student123'
		});
	} catch (error) {
		return json({
			status: 'error',
			error: error.message,
			message: 'Error de conexión a la base de datos. Ejecuta: npm run db:push && npm run db:seed'
		}, { status: 500 });
	}
};