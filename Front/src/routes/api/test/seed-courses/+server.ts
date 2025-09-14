import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, module, workItem, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async () => {
  try {
    console.log('🌱 Iniciando seed de cursos (TEST)...');

    // Crear un usuario educador de ejemplo si no existe
    let educatorId = nanoid();
    try {
      await db.insert(user).values({
        id: educatorId,
        username: 'educador.ejemplo',
        passwordHash: '$2a$10$example.hash.for.seed.user.only',
        nombre: 'María',
        apellido: 'García',
        telefono: '+57 300 123 4567',
        role: 'Colaborador',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (e) {
      // Usuario ya existe, usar el existente
      const existingUsers = await db.select().from(user).where(eq(user.role, 'Colaborador')).limit(1);
      if (existingUsers.length > 0) {
        educatorId = existingUsers[0].id;
      }
    }

    // Crear cursos de ejemplo
    const mathCourseId = nanoid();
    await db.insert(course).values({
      id: mathCourseId,
      title: 'Matemáticas Fundamentales',
      description: 'Aprende los conceptos básicos de matemáticas de manera práctica y divertida. Este curso está diseñado para estudiantes que quieren fortalecer sus bases matemáticas.',
      subject: 'Matemáticas',
      isActive: true,
      isFeatured: true,
      educatorId: educatorId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const physicsCourseId = nanoid();
    await db.insert(course).values({
      id: physicsCourseId,
      title: 'Física Básica',
      description: 'Descubre los principios fundamentales de la física a través de experimentos y ejemplos cotidianos.',
      subject: 'Física',
      isActive: true,
      isFeatured: false,
      educatorId: educatorId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const socialCourseId = nanoid();
    await db.insert(course).values({
      id: socialCourseId,
      title: 'Historia de Colombia',
      description: 'Conoce la rica historia de nuestro país desde los pueblos originarios hasta la actualidad.',
      subject: 'Sociales',
      isActive: true,
      isFeatured: true,
      educatorId: educatorId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const economicsCourseId = nanoid();
    await db.insert(course).values({
      id: economicsCourseId,
      title: 'Economía Doméstica',
      description: 'Aprende a manejar tus finanzas personales y familiares de manera efectiva.',
      subject: 'Economía',
      isActive: true,
      isFeatured: false,
      educatorId: educatorId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Crear módulos para el curso de matemáticas
    const mathModule1Id = nanoid();
    await db.insert(module).values({
      id: mathModule1Id,
      title: 'Operaciones Básicas',
      description: 'Suma, resta, multiplicación y división',
      orderNumber: 1,
      courseId: mathCourseId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const mathModule2Id = nanoid();
    await db.insert(module).values({
      id: mathModule2Id,
      title: 'Fracciones',
      description: 'Comprende y opera con números fraccionarios',
      orderNumber: 2,
      courseId: mathCourseId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Crear módulos para el curso de física
    const physicsModule1Id = nanoid();
    await db.insert(module).values({
      id: physicsModule1Id,
      title: 'Mecánica Básica',
      description: 'Movimiento, fuerzas y energía',
      orderNumber: 1,
      courseId: physicsCourseId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Crear elementos de trabajo para el primer módulo de matemáticas
    await db.insert(workItem).values({
      id: nanoid(),
      title: 'Ejercicios de Suma',
      description: 'Practica operaciones de suma con diferentes niveles de dificultad',
      longText: 'En esta sección aprenderás a realizar sumas de manera eficiente. Comenzaremos con números de una cifra y avanzaremos gradualmente hacia operaciones más complejas.',
      orderNumber: 1,
      moduleId: mathModule1Id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.insert(workItem).values({
      id: nanoid(),
      title: 'Ejercicios de Resta',
      description: 'Domina las operaciones de resta paso a paso',
      longText: 'La resta es una operación fundamental. Aquí encontrarás ejercicios progresivos para dominar esta habilidad.',
      orderNumber: 2,
      moduleId: mathModule1Id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.insert(workItem).values({
      id: nanoid(),
      title: 'Multiplicación por Tablas',
      description: 'Aprende y practica las tablas de multiplicar',
      longText: 'Las tablas de multiplicar son la base de muchas operaciones matemáticas. Practiquemos juntos para memorizarlas.',
      orderNumber: 3,
      moduleId: mathModule1Id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Crear elementos de trabajo para el módulo de fracciones
    await db.insert(workItem).values({
      id: nanoid(),
      title: 'Qué son las Fracciones',
      description: 'Introducción al concepto de fracciones',
      longText: 'Una fracción representa una parte de un todo. Aprenderás a identificar y escribir fracciones correctamente.',
      orderNumber: 1,
      moduleId: mathModule2Id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.insert(workItem).values({
      id: nanoid(),
      title: 'Suma de Fracciones',
      description: 'Aprende a sumar fracciones con el mismo denominador',
      longText: 'Para sumar fracciones con el mismo denominador, sumamos los numeradores y mantenemos el denominador.',
      orderNumber: 2,
      moduleId: mathModule2Id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return json({
      success: true,
      message: 'Seed de cursos ejecutado exitosamente (TEST)',
      data: {
        courses: 4,
        modules: 3,
        workItems: 5,
        educator: educatorId
      }
    });

  } catch (err) {
    console.error('❌ Error durante el seed:', err);
    return error(500, `Error ejecutando el seed de cursos: ${err}`);
  }
};