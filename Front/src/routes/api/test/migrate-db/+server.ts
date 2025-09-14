import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const POST: RequestHandler = async () => {
  try {
    console.log('🔧 Iniciando migración de base de datos...');

    // Verificar estructura actual de la tabla course
    const courseTableInfo = await db.all(sql`PRAGMA table_info(course)`);
    console.log('Estructura actual de course:', courseTableInfo);

    // Agregar columna subject si no existe
    try {
      await db.run(sql`ALTER TABLE course ADD COLUMN subject TEXT DEFAULT 'General'`);
      console.log('✅ Columna subject agregada');
    } catch (e) {
      console.log('ℹ️ Columna subject ya existe');
    }

    // Agregar columna image_path si no existe
    try {
      await db.run(sql`ALTER TABLE course ADD COLUMN image_path TEXT`);
      console.log('✅ Columna image_path agregada');
    } catch (e) {
      console.log('ℹ️ Columna image_path ya existe');
    }

    // Crear tabla module si no existe
    await db.run(sql`CREATE TABLE IF NOT EXISTS module (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      order_number INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      course_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER,
      FOREIGN KEY (course_id) REFERENCES course (id) ON DELETE CASCADE
    )`);
    console.log('✅ Tabla module verificada/creada');

    // Crear tabla work_item si no existe
    await db.run(sql`CREATE TABLE IF NOT EXISTS work_item (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      long_text TEXT,
      image_path TEXT,
      video_path TEXT,
      order_number INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      module_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER,
      FOREIGN KEY (module_id) REFERENCES module (id) ON DELETE CASCADE
    )`);
    console.log('✅ Tabla work_item verificada/creada');

    // Crear índices (comentado por ahora)
    // await db.run(sql`CREATE INDEX IF NOT EXISTS idx_module_course_id ON module (course_id)`);
    // await db.run(sql`CREATE INDEX IF NOT EXISTS idx_module_order ON module (course_id, order_number)`);
    // await db.run(sql`CREATE INDEX IF NOT EXISTS idx_work_item_module_id ON work_item (module_id)`);
    // await db.run(sql`CREATE INDEX IF NOT EXISTS idx_work_item_order ON work_item (module_id, order_number)`);
    console.log('✅ Esquema básico creado');

    // Verificar estructura final
    const finalCourseInfo = await db.all(sql`PRAGMA table_info(course)`);
    const moduleInfo = await db.all(sql`PRAGMA table_info(module)`);
    const workItemInfo = await db.all(sql`PRAGMA table_info(work_item)`);

    return json({
      success: true,
      message: 'Migración completada exitosamente',
      tables: {
        course: finalCourseInfo,
        module: moduleInfo,
        work_item: workItemInfo
      }
    });

  } catch (err) {
    console.error('❌ Error durante la migración:', err);
    return error(500, `Error en migración: ${err}`);
  }
};