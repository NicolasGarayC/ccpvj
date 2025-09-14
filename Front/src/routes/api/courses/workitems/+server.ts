import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, module, workItem } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateSession } from '$lib/server/auth';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Validate session
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return error(401, 'Authentication required');
		}

		const sessionResult = await validateSession(sessionCookie);
		if (!sessionResult.session || !sessionResult.user) {
			return error(401, 'Invalid session');
		}

		// Check if user can create work items (colaborador or administrador)
		if (!['colaborador', 'administrador'].includes(sessionResult.user.role)) {
			return error(403, 'No tienes permisos para crear elementos de trabajo');
		}

		const body = await request.json();
		const { title, description, longText, orderNumber, moduleId, imagePath, videoPath } = body;

		// Validate required fields
		if (!title || orderNumber === undefined || !moduleId) {
			return error(400, 'Title, orderNumber, and moduleId are required');
		}

		// Check if module exists and get course info for permission check
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
			return error(403, 'No tienes permisos para crear elementos de trabajo en este módulo');
		}

		// Create work item
		const newWorkItem = {
			id: nanoid(),
			title,
			description,
			longText,
			orderNumber,
			moduleId,
			imagePath,
			videoPath,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await db.insert(workItem).values(newWorkItem);

		return json(newWorkItem);

	} catch (err) {
		console.error('Error creating work item:', err);
		return error(500, 'Internal server error');
	}
};