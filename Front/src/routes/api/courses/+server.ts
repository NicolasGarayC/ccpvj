import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { course, module, workItem, user } from '$lib/server/db/schema';
import { eq, and, like, desc, asc, count, sql } from 'drizzle-orm';
import { validateSession } from '$lib/server/auth';
import { nanoid } from 'nanoid';

export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		// Extract query parameters
		const page = parseInt(url.searchParams.get('page') || '1');
		const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
		const searchTerm = url.searchParams.get('searchTerm');
		const subject = url.searchParams.get('subject');
		const isFeatured = url.searchParams.get('isFeatured');
		const isActive = url.searchParams.get('isActive');
		const sortBy = url.searchParams.get('sortBy') || 'createdAt';

		// Build where conditions
		const whereConditions = [];

		if (searchTerm) {
			whereConditions.push(
				sql`(${course.title} LIKE ${'%' + searchTerm + '%'} OR ${course.description} LIKE ${'%' + searchTerm + '%'})`
			);
		}

		if (subject) {
			whereConditions.push(eq(course.subject, subject));
		}

		if (isFeatured !== null && isFeatured !== undefined) {
			whereConditions.push(eq(course.isFeatured, isFeatured === 'true'));
		}

		if (isActive !== null && isActive !== undefined) {
			whereConditions.push(eq(course.isActive, isActive === 'true'));
		} else {
			// Default to active courses only
			whereConditions.push(eq(course.isActive, true));
		}

		const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

		// Build order clause
		let orderClause;
		switch (sortBy) {
			case 'title':
				orderClause = asc(course.title);
				break;
			case 'subject':
				orderClause = asc(course.subject);
				break;
			case 'updatedAt':
				orderClause = desc(course.updatedAt);
				break;
			default:
				orderClause = desc(course.createdAt);
		}

		// Get total count
		const totalCountResult = await db
			.select({ count: count() })
			.from(course)
			.where(whereClause);
		const totalCount = totalCountResult[0].count;

		// Get paginated courses with educator info and counts
		const coursesWithDetails = await db
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
			.where(whereClause)
			.orderBy(orderClause)
			.limit(pageSize)
			.offset((page - 1) * pageSize);

		const totalPages = Math.ceil(totalCount / pageSize);

		return json({
			courses: coursesWithDetails,
			totalCount,
			page,
			pageSize,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1
		});

	} catch (err) {
		console.error('Error fetching courses:', err);
		return error(500, 'Internal server error');
	}
};

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

		// Check if user can create courses (colaborador or administrador)
		if (!['colaborador', 'administrador'].includes(sessionResult.user.role)) {
			return error(403, 'No tienes permisos para crear cursos');
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

		// Create course
		const newCourse = {
			id: nanoid(),
			title,
			description,
			subject,
			isFeatured: isFeatured || false,
			imagePath,
			educatorId: sessionResult.user.id,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await db.insert(course).values(newCourse);

		return json(newCourse);

	} catch (err) {
		console.error('Error creating course:', err);
		return error(500, 'Internal server error');
	}
};