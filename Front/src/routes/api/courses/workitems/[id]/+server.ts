import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, module, workItem } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const workItemId = params.id;

		// Get work item
		const workItems = await db
			.select()
			.from(workItem)
			.where(eq(workItem.id, workItemId));

		if (workItems.length === 0) {
			return error(404, 'Work item not found');
		}

		return json(workItems[0]);

	} catch (err) {
		console.error('Error fetching work item:', err);
		return error(500, 'Internal server error');
	}
};

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const workItemId = params.id;

		// Validate session
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return error(401, 'Authentication required');
		}

		const sessionResult = await validateSession(sessionCookie);
		if (!sessionResult.session || !sessionResult.user) {
			return error(401, 'Invalid session');
		}

		// Check if work item exists and get course info for permission check
		const workItemWithCourse = await db
			.select({
				workItemId: workItem.id,
				moduleId: module.id,
				courseId: course.id,
				educatorId: course.educatorId
			})
			.from(workItem)
			.leftJoin(module, eq(workItem.moduleId, module.id))
			.leftJoin(course, eq(module.courseId, course.id))
			.where(eq(workItem.id, workItemId));

		if (workItemWithCourse.length === 0) {
			return error(404, 'Work item not found');
		}

		// Check permissions: user must be the educator or admin
		if (workItemWithCourse[0].educatorId !== sessionResult.user.id && sessionResult.user.role !== 'administrador') {
			return error(403, 'No tienes permisos para editar este elemento de trabajo');
		}

		const body = await request.json();
		const { title, description, longText, orderNumber, imagePath, videoPath } = body;

		// Validate required fields
		if (!title || orderNumber === undefined) {
			return error(400, 'Title and orderNumber are required');
		}

		// Update work item
		await db
			.update(workItem)
			.set({
				title,
				description,
				longText,
				orderNumber,
				imagePath,
				videoPath,
				updatedAt: new Date()
			})
			.where(eq(workItem.id, workItemId));

		return json({ success: true });

	} catch (err) {
		console.error('Error updating work item:', err);
		return error(500, 'Internal server error');
	}
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		const workItemId = params.id;

		// Validate session
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return error(401, 'Authentication required');
		}

		const sessionResult = await validateSession(sessionCookie);
		if (!sessionResult.session || !sessionResult.user) {
			return error(401, 'Invalid session');
		}

		// Check if work item exists and get course info for permission check
		const workItemWithCourse = await db
			.select({
				workItemId: workItem.id,
				moduleId: module.id,
				courseId: course.id,
				educatorId: course.educatorId
			})
			.from(workItem)
			.leftJoin(module, eq(workItem.moduleId, module.id))
			.leftJoin(course, eq(module.courseId, course.id))
			.where(eq(workItem.id, workItemId));

		if (workItemWithCourse.length === 0) {
			return error(404, 'Work item not found');
		}

		// Check permissions: user must be the educator or admin
		if (workItemWithCourse[0].educatorId !== sessionResult.user.id && sessionResult.user.role !== 'administrador') {
			return error(403, 'No tienes permisos para eliminar este elemento de trabajo');
		}

		// Soft delete - set isActive to false
		await db
			.update(workItem)
			.set({
				isActive: false,
				updatedAt: new Date()
			})
			.where(eq(workItem.id, workItemId));

		return json({ success: true });

	} catch (err) {
		console.error('Error deleting work item:', err);
		return error(500, 'Internal server error');
	}
};