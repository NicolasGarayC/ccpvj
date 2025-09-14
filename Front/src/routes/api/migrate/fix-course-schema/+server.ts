import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async () => {
	try {
		console.log('🔧 Iniciando corrección de esquema course...');

		// Verificar estructura actual
		const currentStructure = await db.run(`PRAGMA table_info(course);`);
		console.log('Estructura actual de course:', JSON.stringify(currentStructure, null, 2));

		// Crear tabla temporal con el esquema correcto
		await db.run(`
			CREATE TABLE IF NOT EXISTS course_new (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				description TEXT NOT NULL,
				subject TEXT NOT NULL,
				image_path TEXT,
				is_active INTEGER DEFAULT 1 NOT NULL,
				is_featured INTEGER DEFAULT 0 NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER,
				educator_id TEXT NOT NULL,
				FOREIGN KEY (educator_id) REFERENCES user (id)
			);
		`);
		console.log('✅ Tabla course_new creada');

		// Migrar datos existentes
		const migrationResult = await db.run(`
			INSERT OR IGNORE INTO course_new (
				id, title, description, subject, image_path,
				is_active, is_featured, created_at, updated_at, educator_id
			)
			SELECT
				Id, Title, Description, Subject,
				COALESCE(ImagePath, image_path) as image_path,
				COALESCE(IsActive, 1) as is_active,
				COALESCE(IsFeatured, 0) as is_featured,
				COALESCE(CreatedAt, strftime('%s', 'now')) as created_at,
				UpdatedAt as updated_at,
				EducatorId as educator_id
			FROM course
			WHERE Id IS NOT NULL AND Title IS NOT NULL;
		`);
		console.log('✅ Datos migrados:', migrationResult);

		// Verificar migración
		const newData = await db.all(`SELECT * FROM course_new LIMIT 5;`);
		console.log('📊 Datos migrados (muestra):', JSON.stringify(newData, null, 2));

		// Renombrar tablas
		await db.run(`DROP TABLE course;`);
		await db.run(`ALTER TABLE course_new RENAME TO course;`);
		console.log('✅ Esquema course corregido');

		return json({
			success: true,
			message: 'Esquema course corregido exitosamente',
			migratedRows: migrationResult,
			sampleData: newData
		});

	} catch (error) {
		console.error('❌ Error durante la migración:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido',
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 });
	}
};