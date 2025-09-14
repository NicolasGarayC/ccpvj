import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async () => {
  try {
    console.log('🌱 Iniciando seed directo con SQL...');

    // Crear un usuario educador de ejemplo
    const educatorId = nanoid();
    const now = Date.now();

    await db.run(sql`
      INSERT OR IGNORE INTO user (id, username, password_hash, nombre, apellido, telefono, role, created_at, updated_at)
      VALUES (${educatorId}, 'educador.ejemplo', '$2a$10$example.hash.seed', 'María', 'García', '+57 300 123 4567', 'Colaborador', ${now}, ${now})
    `);

    // Crear cursos usando los nombres de columna correctos
    const mathCourseId = nanoid();
    await db.run(sql`
      INSERT INTO course (Id, Title, Description, Subject, IsActive, IsFeatured, EducatorId, CreatedAt, UpdatedAt)
      VALUES (${mathCourseId}, 'Matemáticas Fundamentales', 'Aprende los conceptos básicos de matemáticas de manera práctica y divertida.', 'Matemáticas', 1, 1, ${educatorId}, ${now}, ${now})
    `);

    const physicsCourseId = nanoid();
    await db.run(sql`
      INSERT INTO course (Id, Title, Description, Subject, IsActive, IsFeatured, EducatorId, CreatedAt, UpdatedAt)
      VALUES (${physicsCourseId}, 'Física Básica', 'Descubre los principios fundamentales de la física.', 'Física', 1, 0, ${educatorId}, ${now}, ${now})
    `);

    const socialCourseId = nanoid();
    await db.run(sql`
      INSERT INTO course (Id, Title, Description, Subject, IsActive, IsFeatured, EducatorId, CreatedAt, UpdatedAt)
      VALUES (${socialCourseId}, 'Historia de Colombia', 'Conoce la rica historia de nuestro país.', 'Sociales', 1, 1, ${educatorId}, ${now}, ${now})
    `);

    const economicsCourseId = nanoid();
    await db.run(sql`
      INSERT INTO course (Id, Title, Description, Subject, IsActive, IsFeatured, EducatorId, CreatedAt, UpdatedAt)
      VALUES (${economicsCourseId}, 'Economía Doméstica', 'Aprende a manejar tus finanzas personales.', 'Economía', 1, 0, ${educatorId}, ${now}, ${now})
    `);

    console.log('✅ Cursos creados');

    // Crear módulos para matemáticas
    const mathModule1Id = nanoid();
    await db.run(sql`
      INSERT INTO module (id, title, description, order_number, is_active, course_id, created_at, updated_at)
      VALUES (${mathModule1Id}, 'Operaciones Básicas', 'Suma, resta, multiplicación y división', 1, 1, ${mathCourseId}, ${now}, ${now})
    `);

    const mathModule2Id = nanoid();
    await db.run(sql`
      INSERT INTO module (id, title, description, order_number, is_active, course_id, created_at, updated_at)
      VALUES (${mathModule2Id}, 'Fracciones', 'Comprende y opera con números fraccionarios', 2, 1, ${mathCourseId}, ${now}, ${now})
    `);

    // Crear módulo para física
    const physicsModule1Id = nanoid();
    await db.run(sql`
      INSERT INTO module (id, title, description, order_number, is_active, course_id, created_at, updated_at)
      VALUES (${physicsModule1Id}, 'Mecánica Básica', 'Movimiento, fuerzas y energía', 1, 1, ${physicsCourseId}, ${now}, ${now})
    `);

    console.log('✅ Módulos creados');

    // Crear elementos de trabajo para matemáticas
    await db.run(sql`
      INSERT INTO work_item (id, title, description, long_text, order_number, is_active, module_id, created_at, updated_at)
      VALUES (${nanoid()}, 'Ejercicios de Suma', 'Practica operaciones de suma', 'En esta sección aprenderás a realizar sumas de manera eficiente.', 1, 1, ${mathModule1Id}, ${now}, ${now})
    `);

    await db.run(sql`
      INSERT INTO work_item (id, title, description, long_text, order_number, is_active, module_id, created_at, updated_at)
      VALUES (${nanoid()}, 'Ejercicios de Resta', 'Domina las operaciones de resta', 'La resta es una operación fundamental.', 2, 1, ${mathModule1Id}, ${now}, ${now})
    `);

    await db.run(sql`
      INSERT INTO work_item (id, title, description, long_text, order_number, is_active, module_id, created_at, updated_at)
      VALUES (${nanoid()}, 'Multiplicación por Tablas', 'Aprende las tablas de multiplicar', 'Las tablas de multiplicar son la base.', 3, 1, ${mathModule1Id}, ${now}, ${now})
    `);

    await db.run(sql`
      INSERT INTO work_item (id, title, description, long_text, order_number, is_active, module_id, created_at, updated_at)
      VALUES (${nanoid()}, 'Qué son las Fracciones', 'Introducción al concepto de fracciones', 'Una fracción representa una parte de un todo.', 1, 1, ${mathModule2Id}, ${now}, ${now})
    `);

    await db.run(sql`
      INSERT INTO work_item (id, title, description, long_text, order_number, is_active, module_id, created_at, updated_at)
      VALUES (${nanoid()}, 'Suma de Fracciones', 'Aprende a sumar fracciones', 'Para sumar fracciones con el mismo denominador.', 2, 1, ${mathModule2Id}, ${now}, ${now})
    `);

    console.log('✅ Elementos de trabajo creados');

    // Verificar datos creados
    const courseCount = await db.get(sql`SELECT COUNT(*) as count FROM course`);
    const moduleCount = await db.get(sql`SELECT COUNT(*) as count FROM module`);
    const workItemCount = await db.get(sql`SELECT COUNT(*) as count FROM work_item`);

    return json({
      success: true,
      message: 'Seed ejecutado exitosamente con SQL directo',
      data: {
        courses: courseCount?.count || 0,
        modules: moduleCount?.count || 0,
        workItems: workItemCount?.count || 0,
        educatorId
      }
    });

  } catch (err) {
    console.error('❌ Error durante el seed:', err);
    return error(500, `Error ejecutando el seed: ${err}`);
  }
};