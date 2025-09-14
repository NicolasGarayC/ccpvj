import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		console.log('🔍 Inspeccionando estructura de la base de datos...');

		// Obtener todas las tablas
		const tables = await db.all(`
			SELECT name, type
			FROM sqlite_master
			WHERE type IN ('table', 'view')
			ORDER BY type, name;
		`);

		console.log('Tablas/Vistas encontradas:', tables);

		// Obtener estructura de tabla course si existe
		let courseStructure = null;
		try {
			courseStructure = await db.all(`PRAGMA table_info(course);`);
		} catch (e) {
			console.log('Tabla course no existe con minúsculas');
		}

		// Obtener estructura de tabla Course (PascalCase) si existe
		let CourseStructure = null;
		try {
			CourseStructure = await db.all(`PRAGMA table_info(Course);`);
		} catch (e) {
			console.log('Tabla Course no existe con mayúscula');
		}

		// Verificar si hay datos en course
		let courseData = null;
		try {
			courseData = await db.all(`SELECT COUNT(*) as count FROM course LIMIT 1;`);
		} catch (e) {
			try {
				courseData = await db.all(`SELECT COUNT(*) as count FROM Course LIMIT 1;`);
			} catch (e2) {
				courseData = { error: 'No se pudo acceder a ninguna tabla course' };
			}
		}

		return json({
			success: true,
			tables,
			structures: {
				course: courseStructure,
				Course: CourseStructure
			},
			courseData
		});

	} catch (error) {
		console.error('❌ Error inspeccionando DB:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido',
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 });
	}
};