import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, module, workItem } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const moduleId = params.id;

		// Get module with work items
		const moduleWithDetails = await db
			.select({
				id: module.id,
				title: module.title,
				description: module.description,
				orderNumber: module.orderNumber,
				isActive: module.isActive,
				courseId: module.courseId,
				createdAt: module.createdAt,
				updatedAt: module.updatedAt
			})
			.from(module)
			.where(eq(module.id, moduleId));

		if (moduleWithDetails.length === 0) {
			return error(404, 'Module not found');
		}

		const moduleData = moduleWithDetails[0];

		// Get work items for this module
		const workItems = await db
			.select()
			.from(workItem)
			.where(and(eq(workItem.moduleId, moduleId), eq(workItem.isActive, true)))
			.orderBy(workItem.orderNumber);

		const workItemCount = workItems.length;

		return json({
			...moduleData,
			workItems,
			workItemCount
		});

	} catch (err) {
		console.error('Error fetching module:', err);
		return error(500, 'Internal server error');
	}
};

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
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
			return error(403, 'No tienes permisos para editar este módulo');
		}

		const body = await request.json();
		const { title, description, orderNumber } = body;

		// Validate required fields
		if (!title || !description || orderNumber === undefined) {
			return error(400, 'Title, description, and orderNumber are required');
		}

		// Update module
		await db
			.update(module)
			.set({
				title,
				description,
				orderNumber,
				updatedAt: new Date()
			})
			.where(eq(module.id, moduleId));

		return json({ success: true });

	} catch (err) {
		console.error('Error updating module:', err);
		return error(500, 'Internal server error');
	}
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
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
			return error(403, 'No tienes permisos para eliminar este módulo');
		}

		// Soft delete - set isActive to false
		await db
			.update(module)
			.set({
				isActive: false,
				updatedAt: new Date()
			})
			.where(eq(module.id, moduleId));

		return json({ success: true });

	} catch (err) {
		console.error('Error deleting module:', err);
		return error(500, 'Internal server error');
	}
};