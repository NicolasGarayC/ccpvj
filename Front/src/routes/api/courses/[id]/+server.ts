import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, module, workItem, user } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { validateSessionToken } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const courseId = params.id;

		// Get course with educator info and modules
		const courseWithDetails = await db
			.select({
				id: course.id,
				title: course.title,
				description: course.description,
				subject: course.subject,
				imagePath: course.imagePath,
				isActive: course.isActive,
				isFeatured: course.isFeatured,
				createdAt: course.createdAt,
				updatedAt: course.updatedAt,
				educatorId: course.educatorId,
				educatorName: sql<string>`${user.nombre} || ' ' || ${user.apellido}`
			})
			.from(course)
			.leftJoin(user, eq(course.educatorId, user.id))
			.where(eq(course.id, courseId));

		if (courseWithDetails.length === 0) {
			return error(404, 'Course not found');
		}

		const courseData = courseWithDetails[0];

		// Get modules with work item counts
		const modules = await db
			.select({
				id: module.id,
				title: module.title,
				description: module.description,
				orderNumber: module.orderNumber,
				isActive: module.isActive,
				courseId: module.courseId,
				createdAt: module.createdAt,
				updatedAt: module.updatedAt,
				workItemCount: sql<number>`COALESCE(workitem_counts.count, 0)`
			})
			.from(module)
			.leftJoin(
				sql`(SELECT module_id, COUNT(*) as count FROM work_item WHERE is_active = 1 GROUP BY module_id) as workitem_counts`,
				sql`workitem_counts.module_id = ${module.id}`
			)
			.where(and(eq(module.courseId, courseId), eq(module.isActive, true)))
			.orderBy(module.orderNumber);

		const moduleCount = modules.length;
		const workItemCount = modules.reduce((total, mod) => total + mod.workItemCount, 0);

		return json({
			...courseData,
			modules,
			moduleCount,
			workItemCount
		});

	} catch (err) {
		console.error('Error fetching course:', err);
		return error(500, 'Internal server error');
	}
};

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const courseId = params.id;

		// Validate session
		const sessionCookie = cookies.get('auth-session');
		if (!sessionCookie) {
			return error(401, 'Authentication required');
		}

		const sessionResult = await validateSessionToken(sessionCookie);
		if (!sessionResult.session || !sessionResult.user) {
			return error(401, 'Invalid session');
		}

		// Check if course exists and user has permission
		const existingCourse = await db
			.select()
			.from(course)
			.where(eq(course.id, courseId));

		if (existingCourse.length === 0) {
			return error(404, 'Course not found');
		}

		// Check permissions: user must be the educator or admin
		if (existingCourse[0].educatorId !== sessionResult.user.id && sessionResult.user.role !== 'administrador') {
			return error(403, 'No tienes permisos para editar este curso');
		}

		const body = await request.json();
		const { title, description, subject, isFeatured, imagePath } = body;

		// Validate required fields
		if (!title || !description || !subject) {
			return error(400, 'Title, description, and subject are required');
		}

		// Valid subjects
		const validSubjects = ['Matemáticas', 'Física', 'Sociales', 'Economía'];
		if (!validSubjects.includes(subject)) {
			return error(400, 'Invalid subject. Must be one of: ' + validSubjects.join(', '));
		}

		// Update course
		await db
			.update(course)
			.set({
				title,
				description,
				subject,
				isFeatured: isFeatured || false,
				imagePath,
				updatedAt: new Date()
			})
			.where(eq(course.id, courseId));

		return json({ success: true });

	} catch (err) {
		console.error('Error updating course:', err);
		return error(500, 'Internal server error');
	}
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		const courseId = params.id;

		// Validate session
		const sessionCookie = cookies.get('auth-session');
		if (!sessionCookie) {
			return error(401, 'Authentication required');
		}

		const sessionResult = await validateSessionToken(sessionCookie);
		if (!sessionResult.session || !sessionResult.user) {
			return error(401, 'Invalid session');
		}

		// Check if course exists and user has permission
		const existingCourse = await db
			.select()
			.from(course)
			.where(eq(course.id, courseId));

		if (existingCourse.length === 0) {
			return error(404, 'Course not found');
		}

		// Check permissions: user must be the educator or admin
		if (existingCourse[0].educatorId !== sessionResult.user.id && sessionResult.user.role !== 'administrador') {
			return error(403, 'No tienes permisos para eliminar este curso');
		}

		// Soft delete - set isActive to false
		await db
			.update(course)
			.set({
				isActive: false,
				updatedAt: new Date()
			})
			.where(eq(course.id, courseId));

		return json({ success: true });

	} catch (err) {
		console.error('Error deleting course:', err);
		return error(500, 'Internal server error');
	}
};