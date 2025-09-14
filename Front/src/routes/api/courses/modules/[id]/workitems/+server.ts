import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { workItem } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const moduleId = params.id;

		// Get work items for this module
		const workItems = await db
			.select()
			.from(workItem)
			.where(and(eq(workItem.moduleId, moduleId), eq(workItem.isActive, true)))
			.orderBy(workItem.orderNumber);

		return json(workItems);

	} catch (err) {
		console.error('Error fetching module work items:', err);
		return error(500, 'Internal server error');
	}
};