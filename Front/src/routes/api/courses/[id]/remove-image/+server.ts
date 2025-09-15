import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { course } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { deleteMediaFile } from '$lib/server/utils/mediaCleanup.js';
import { validateSessionToken } from '$lib/server/auth.js';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		// Verificar autenticación usando el mismo patrón que otros endpoints
		const sessionToken = cookies.get('auth-session');
		if (!sessionToken) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { session, user: currentUser } = await validateSessionToken(sessionToken);
		if (!session || !currentUser) {
			return json({ error: 'Invalid session' }, { status: 401 });
		}

		// Verificar permisos de usuario
		if (!['administrador', 'colaborador'].includes(currentUser.role)) {
			return json({
				error: 'No tienes permisos para eliminar archivos'
			}, { status: 403 });
		}

		const courseId = params.id;
		if (!courseId) {
			return json({ error: 'ID de curso requerido' }, { status: 400 });
		}

		// Obtener el curso actual para verificar si tiene imagen
		const existingCourse = await db
			.select({
				id: course.id,
				imagePath: course.imagePath,
				educatorId: course.educatorId
			})
			.from(course)
			.where(eq(course.id, courseId))
			.limit(1);

		if (existingCourse.length === 0) {
			return json({ error: 'Curso no encontrado' }, { status: 404 });
		}

		const courseData = existingCourse[0];

		// Verificar si el curso tiene una imagen
		if (!courseData.imagePath) {
			return json({ error: 'El curso no tiene imagen para eliminar' }, { status: 400 });
		}

		// Eliminar el archivo físico del servidor
		try {
			await deleteMediaFile(courseData.imagePath);
			console.log(`✅ Archivo eliminado: ${courseData.imagePath}`);
		} catch (fileError) {
			console.warn(`⚠️ No se pudo eliminar el archivo: ${courseData.imagePath}`, fileError);
			// Continuamos aunque el archivo no se pueda eliminar
		}

		// Actualizar la base de datos para remover la referencia a la imagen
		await db
			.update(course)
			.set({
				imagePath: null,
				updatedAt: new Date()
			})
			.where(eq(course.id, courseId));

		console.log(`✅ Imagen eliminada del curso ${courseId}`);

		return json({
			success: true,
			message: 'Imagen eliminada correctamente',
			courseId: courseId
		});

	} catch (error) {
		console.error('Error al eliminar imagen del curso:', error);
		return json(
			{ error: 'Error interno del servidor al eliminar la imagen' },
			{ status: 500 }
		);
	}
};