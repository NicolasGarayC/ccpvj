import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, module } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { validateSessionToken } from '$lib/server/auth';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Validate session
		const sessionToken = cookies.get('auth-session');
		if (!sessionToken) {
			return error(401, 'Authentication required');
		}

		const { session: userSession, user } = await validateSessionToken(sessionToken);
		if (!userSession || !user) {
			return error(401, 'Invalid session');
		}

		// Check if user can create modules (colaborador or administrador)
		if (!['colaborador', 'administrador'].includes(user.role)) {
			return error(403, 'No tienes permisos para crear módulos');
		}

		const body = await request.json();
		const { title, description, orderNumber, courseId } = body;

		// Validate required fields
		if (!title || !description || orderNumber === undefined || !courseId) {
			return error(400, 'Title, description, orderNumber, and courseId are required');
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
		if (existingCourse[0].educatorId !== user.id && user.role !== 'administrador') {
			return error(403, 'No tienes permisos para crear módulos en este curso');
		}

		// Create module
		const newModule = {
			id: nanoid(),
			title,
			description,
			orderNumber,
			isActive: true,
			courseId,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await db.insert(module).values(newModule);

		return json(newModule);

	} catch (err) {
		console.error('Error creating module:', err);
		return error(500, 'Internal server error');
	}
};