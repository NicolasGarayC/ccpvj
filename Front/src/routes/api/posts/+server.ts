import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index';
import { modulePost, user } from '$lib/server/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET - Get posts for a module or by search params
export const GET: RequestHandler = async ({ request, locals, url }) => {
	const session = locals.session;
	// Allow unauthenticated access for public content viewing
	// Authentication only required for creating/editing posts

	const moduleId = url.searchParams.get('moduleId');
	const authorId = url.searchParams.get('authorId');
	const isActive = url.searchParams.get('isActive');
	const sortBy = url.searchParams.get('sortBy') || 'order';

	try {
		let query = db
			.select({
				id: modulePost.id,
				title: modulePost.title,
				subtitle: modulePost.subtitle,
				content: modulePost.content,
				imagePath: modulePost.imagePath,
				videoPath: modulePost.videoPath,
				audioPath: modulePost.audioPath,
				orderNumber: modulePost.orderNumber,
				isActive: modulePost.isActive,
				moduleId: modulePost.moduleId,
				authorId: modulePost.authorId,
				createdAt: modulePost.createdAt,
				updatedAt: modulePost.updatedAt,
				authorName: user.username
			})
			.from(modulePost)
			.leftJoin(user, eq(modulePost.authorId, user.id));

		// Apply filters
		const conditions = [];
		if (moduleId) {
			conditions.push(eq(modulePost.moduleId, moduleId));
		}
		if (authorId) {
			conditions.push(eq(modulePost.authorId, authorId));
		}
		if (isActive !== null) {
			conditions.push(eq(modulePost.isActive, isActive === 'true'));
		}

		if (conditions.length > 0) {
			query = query.where(and(...conditions));
		}

		// Apply sorting
		switch (sortBy) {
			case 'created':
				query = query.orderBy(desc(modulePost.createdAt));
				break;
			case 'title':
				query = query.orderBy(asc(modulePost.title));
				break;
			case 'order':
			default:
				query = query.orderBy(asc(modulePost.orderNumber));
				break;
		}

		const posts = await query;

		return json(posts);
	} catch (error) {
		console.error('Error getting posts:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

// POST - Create a new post
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.userId) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	// Check user permissions
	const userData = await db.select().from(user).where(eq(user.id, session.userId)).limit(1);
	if (userData.length === 0) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	const currentUser = userData[0];
	if (!['colaborador', 'administrador'].includes(currentUser.role)) {
		return json({ error: 'No tienes permisos para crear posts' }, { status: 403 });
	}

	try {
		const data = await request.json();
		const { title, subtitle, content, imagePath, videoPath, audioPath, orderNumber, moduleId } = data;

		// Validate required fields
		if (!title || !moduleId || orderNumber === undefined) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const postId = nanoid();
		const now = new Date();

		const newPost = await db.insert(modulePost).values({
			id: postId,
			title,
			subtitle: subtitle || null,
			content: content || null,
			imagePath: imagePath || null,
			videoPath: videoPath || null,
			audioPath: audioPath || null,
			orderNumber,
			isActive: true,
			moduleId,
			authorId: session.userId,
			createdAt: now,
			updatedAt: null
		}).returning();

		// Get the created post with author name
		const createdPost = await db
			.select({
				id: modulePost.id,
				title: modulePost.title,
				subtitle: modulePost.subtitle,
				content: modulePost.content,
				imagePath: modulePost.imagePath,
				videoPath: modulePost.videoPath,
				audioPath: modulePost.audioPath,
				orderNumber: modulePost.orderNumber,
				isActive: modulePost.isActive,
				moduleId: modulePost.moduleId,
				authorId: modulePost.authorId,
				createdAt: modulePost.createdAt,
				updatedAt: modulePost.updatedAt,
				authorName: user.username
			})
			.from(modulePost)
			.leftJoin(user, eq(modulePost.authorId, user.id))
			.where(eq(modulePost.id, postId))
			.limit(1);

		return json(createdPost[0], { status: 201 });
	} catch (error) {
		console.error('Error creating post:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};