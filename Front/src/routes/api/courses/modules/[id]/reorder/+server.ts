import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, module } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateSession } from '$lib/server/auth';

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const moduleId = params.id;

		// Validate session
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return error(401, 'Authentication required');
		}

		const sessionResult = await validateSession(sessionCookie);
		if (!sessionResult.session || !sessionResult.user) {
			return error(401, 'Invalid session');
		}

		// Check if module exists and get course info
		const moduleWithCourse = await db
			.select({
				moduleId: module.id,
				courseId: course.id,
				educatorId: course.educatorId
			})
			.from(module)
			.leftJoin(course, eq(module.courseId, course.id))
			.where(eq(module.id, moduleId));

		if (moduleWithCourse.length === 0) {
			return error(404, 'Module not found');
		}

		// Check permissions: user must be the educator or admin
		if (moduleWithCourse[0].educatorId !== sessionResult.user.id && sessionResult.user.role !== 'administrador') {
			return error(403, 'No tienes permisos para reordenar módulos en este curso');
		}

		const body = await request.json();
		const { newOrderNumber } = body;

		// Validate required fields
		if (newOrderNumber === undefined) {
			return error(400, 'newOrderNumber is required');
		}

		// Update module order
		await db
			.update(module)
			.set({
				orderNumber: newOrderNumber,
				updatedAt: new Date()
			})
			.where(eq(module.id, moduleId));

		return json({ success: true });

	} catch (err) {
		console.error('Error reordering module:', err);
		return error(500, 'Internal server error');
	}
};