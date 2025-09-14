import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// Get distinct subjects from active courses
		const subjects = await db
			.select({
				subject: course.subject
			})
			.from(course)
			.where(eq(course.isActive, true))
			.groupBy(course.subject)
			.orderBy(course.subject);

		// Extract just the subject names
		const subjectNames = subjects
			.map(s => s.subject)
			.filter(subject => subject && subject.trim() !== '');

		return json(subjectNames);

	} catch (err) {
		console.error('Error fetching subjects:', err);
		// Return default subjects if there's an error
		return json(['Matemáticas', 'Física', 'Sociales', 'Economía']);
	}
};