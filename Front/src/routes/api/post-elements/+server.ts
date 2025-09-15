import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { postElement, modulePost, user } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/post-elements?postId=<id>
export const GET: RequestHandler = async ({ cookies, url }) => {
	try {
		// Allow unauthenticated access for public content viewing
		const postId = url.searchParams.get('postId');
		if (!postId) {
			return json({ success: false, error: 'Post ID is required' }, { status: 400 });
		}

		// Verify the post exists
		const post = await db
			.select({
				id: modulePost.id,
				title: modulePost.title,
				authorId: modulePost.authorId
			})
			.from(modulePost)
			.where(eq(modulePost.id, postId))
			.limit(1);

		if (post.length === 0) {
			return json({ success: false, error: 'Post not found' }, { status: 404 });
		}

		// Get all elements for this post ordered by orderNumber
		const elements = await db
			.select()
			.from(postElement)
			.where(and(
				eq(postElement.postId, postId),
				eq(postElement.isActive, true)
			))
			.orderBy(postElement.orderNumber);

		return json({
			success: true,
			data: {
				elements
			}
		});

	} catch (error) {
		console.error('Error loading post elements:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/post-elements
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const sessionToken = cookies.get('auth-session');
		if (!sessionToken) {
			return json({ success: false, error: 'Authentication required' }, { status: 401 });
		}

		const { session, user: currentUser } = await validateSessionToken(sessionToken);
		if (!session || !currentUser) {
			return json({ success: false, error: 'Invalid session' }, { status: 401 });
		}

		// Check user permissions
		if (!['administrador', 'colaborador'].includes(currentUser.role)) {
			return json({
				success: false,
				error: 'No tienes permisos para crear elementos de posts'
			}, { status: 403 });
		}

		const body = await request.json();
		const { postId, elementType, content, orderNumber, metadata } = body;

		if (!postId || !elementType || orderNumber === undefined) {
			return json({
				success: false,
				error: 'Missing required fields: postId, elementType, orderNumber'
			}, { status: 400 });
		}

		// Verify the post exists and user has access (author or admin)
		const post = await db
			.select({
				id: modulePost.id,
				authorId: modulePost.authorId
			})
			.from(modulePost)
			.where(eq(modulePost.id, postId))
			.limit(1);

		if (post.length === 0) {
			return json({ success: false, error: 'Post not found' }, { status: 404 });
		}

		if (post[0].authorId !== currentUser.id && currentUser.role !== 'administrador') {
			return json({
				success: false,
				error: 'No tienes permisos para modificar este post'
			}, { status: 403 });
		}

		// Create the element
		const elementId = crypto.randomUUID();
		await db.insert(postElement).values({
			id: elementId,
			postId,
			elementType,
			content: content || null,
			orderNumber,
			metadata: metadata || null,
			isActive: true,
			createdAt: new Date(),
			updatedAt: null
		});

		// Fetch the created element
		const createdElement = await db
			.select()
			.from(postElement)
			.where(eq(postElement.id, elementId))
			.limit(1);

		return json({
			success: true,
			data: {
				element: createdElement[0]
			}
		});

	} catch (error) {
		console.error('Error creating post element:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};