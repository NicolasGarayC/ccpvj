import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, user } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const count = parseInt(url.searchParams.get('count') || '6');

		const featuredCoursesWithDetails = await db
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
			.where(and(eq(course.isActive, true), eq(course.isFeatured, true)))
			.orderBy(course.createdAt)
			.limit(count);

		return json(featuredCoursesWithDetails);

	} catch (err) {
		console.error('Error fetching featured courses:', err);
		return error(500, 'Internal server error');
	}
};