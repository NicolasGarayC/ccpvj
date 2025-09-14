import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, user } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { validateSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
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

		// Get user's courses with details
		const userCoursesWithDetails = await db
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
				educatorName: sql<string>`${user.nombre} || ' ' || ${user.apellido}`,
				moduleCount: sql<number>`COALESCE(module_counts.count, 0)`,
				workItemCount: sql<number>`COALESCE(workitem_counts.count, 0)`
			})
			.from(course)
			.leftJoin(user, eq(course.educatorId, user.id))
			.leftJoin(
				sql`(SELECT course_id, COUNT(*) as count FROM module WHERE is_active = 1 GROUP BY course_id) as module_counts`,
				sql`module_counts.course_id = ${course.id}`
			)
			.leftJoin(
				sql`(SELECT m.course_id, COUNT(wi.id) as count FROM module m LEFT JOIN work_item wi ON m.id = wi.module_id WHERE m.is_active = 1 AND (wi.is_active = 1 OR wi.is_active IS NULL) GROUP BY m.course_id) as workitem_counts`,
				sql`workitem_counts.course_id = ${course.id}`
			)
			.where(eq(course.educatorId, sessionResult.user.id))
			.orderBy(course.createdAt);

		return json(userCoursesWithDetails);

	} catch (err) {
		console.error('Error fetching user courses:', err);
		return error(500, 'Internal server error');
	}
};