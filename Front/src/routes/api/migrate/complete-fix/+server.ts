import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async () => {
	try {
		console.log('🔧 Iniciando migración completa de base de datos...');

		// Paso 1: Eliminar vistas problemáticas
		console.log('1️⃣ Eliminando vistas problemáticas...');
		await db.run(`DROP VIEW IF EXISTS CourseWithMedia;`);
		await db.run(`DROP VIEW IF EXISTS BlogPostWithMedia;`);
		await db.run(`DROP VIEW IF EXISTS EventWithMedia;`);
		await db.run(`DROP VIEW IF EXISTS WorkItemWithMedia;`);

		// Paso 2: Renombrar course_new a course si existe
		console.log('2️⃣ Renombrando course_new a course...');
		try {
			await db.run(`ALTER TABLE course_new RENAME TO course;`);
			console.log('✅ course_new renombrada a course');
		} catch (e) {
			console.log('ℹ️ course_new no existe o ya fue renombrada');
		}

		// Paso 3: Crear tabla course si no existe
		console.log('3️⃣ Creando tabla course con esquema correcto...');
		await db.run(`
			CREATE TABLE IF NOT EXISTS course (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				description TEXT NOT NULL,
				subject TEXT NOT NULL,
				image_path TEXT,
				is_active INTEGER DEFAULT 1 NOT NULL,
				is_featured INTEGER DEFAULT 0 NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER,
				educator_id TEXT NOT NULL
			);
		`);

		// Paso 4: Crear tabla module con esquema correcto
		console.log('4️⃣ Creando tabla module...');
		await db.run(`
			CREATE TABLE IF NOT EXISTS module (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				description TEXT NOT NULL,
				order_number INTEGER NOT NULL,
				is_active INTEGER DEFAULT 1 NOT NULL,
				course_id TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER,
				FOREIGN KEY (course_id) REFERENCES course (id) ON DELETE CASCADE
			);
		`);

		// Paso 5: Asegurar que work_item tenga el esquema correcto
		console.log('5️⃣ Verificando tabla work_item...');
		await db.run(`
			CREATE TABLE IF NOT EXISTS work_item (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				description TEXT,
				long_text TEXT,
				image_path TEXT,
				video_path TEXT,
				order_number INTEGER NOT NULL,
				is_active INTEGER DEFAULT 1 NOT NULL,
				module_id TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER,
				FOREIGN KEY (module_id) REFERENCES module (id) ON DELETE CASCADE
			);
		`);

		// Paso 6: Crear usuario de prueba para los cursos
		console.log('6️⃣ Creando usuario de prueba...');
		await db.run(`
			INSERT OR IGNORE INTO user (id, username, password_hash, role, created_at, updated_at)
			VALUES ('educator-1', 'profesor', 'hashed_password', 'Colaborador', ?, ?);
		`, [Date.now(), Date.now()]);

		// Paso 7: Insertar datos de prueba
		console.log('7️⃣ Insertando datos de prueba...');
		const courseId1 = 'course-1';
		const courseId2 = 'course-2';
		const now = Date.now();

		await db.run(`
			INSERT OR IGNORE INTO course (id, title, description, subject, is_active, is_featured, created_at, educator_id)
			VALUES
				(?, 'Matemáticas Básicas', 'Curso introductorio de matemáticas', 'Matemáticas', 1, 1, ?, 'educator-1'),
				(?, 'Física I', 'Principios fundamentales de la física', 'Física', 1, 0, ?, 'educator-1');
		`, [courseId1, now, courseId2, now]);

		// Insertar módulos
		await db.run(`
			INSERT OR IGNORE INTO module (id, title, description, order_number, course_id, created_at)
			VALUES
				('module-1', 'Aritmética', 'Operaciones básicas', 1, ?, ?),
				('module-2', 'Álgebra', 'Ecuaciones lineales', 2, ?, ?),
				('module-3', 'Cinemática', 'Movimiento y velocidad', 1, ?, ?);
		`, [courseId1, now, courseId1, now, courseId2, now]);

		// Insertar work items
		await db.run(`
			INSERT OR IGNORE INTO work_item (id, title, description, order_number, module_id, created_at)
			VALUES
				('work-1', 'Suma y Resta', 'Aprende las operaciones básicas', 1, 'module-1', ?),
				('work-2', 'Multiplicación', 'Tablas de multiplicar', 2, 'module-1', ?),
				('work-3', 'Ecuaciones de primer grado', 'Resolver ecuaciones básicas', 1, 'module-2', ?);
		`, [now, now, now]);

		// Paso 8: Verificar resultados
		const coursesCount = await db.all(`SELECT COUNT(*) as count FROM course;`);
		const modulesCount = await db.all(`SELECT COUNT(*) as count FROM module;`);
		const workItemsCount = await db.all(`SELECT COUNT(*) as count FROM work_item;`);

		console.log('✅ Migración completa exitosa');

		return json({
			success: true,
			message: 'Migración completa exitosa',
			counts: {
				courses: coursesCount[0]?.count || 0,
				modules: modulesCount[0]?.count || 0,
				workItems: workItemsCount[0]?.count || 0
			}
		});

	} catch (error) {
		console.error('❌ Error durante la migración completa:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido',
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 });
	}
};