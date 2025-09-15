import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { postElement, modulePost } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/post-elements/reorder
export const PUT: RequestHandler = async ({ request, cookies }) => {
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
				error: 'No tienes permisos para reordenar elementos de posts'
			}, { status: 403 });
		}

		const body = await request.json();
		const { postId, elementOrders } = body;

		if (!postId || !elementOrders || !Array.isArray(elementOrders)) {
			return json({
				success: false,
				error: 'Missing required fields: postId and elementOrders array'
			}, { status: 400 });
		}

		// Verify user has access to the post
		const post = await db
			.select({
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

		// Update order for each element
		const promises = elementOrders.map(({ id, orderNumber }) =>
			db
				.update(postElement)
				.set({
					orderNumber,
					updatedAt: new Date()
				})
				.where(and(
					eq(postElement.id, id),
					eq(postElement.postId, postId)
				))
		);

		await Promise.all(promises);

		// Fetch the updated elements
		const updatedElements = await db
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
				elements: updatedElements,
				message: 'Elements reordered successfully'
			}
		});

	} catch (error) {
		console.error('Error reordering post elements:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};