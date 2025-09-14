import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { module, workItem } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const courseId = params.id;

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

		return json(modules);

	} catch (err) {
		console.error('Error fetching course modules:', err);
		return error(500, 'Internal server error');
	}
};