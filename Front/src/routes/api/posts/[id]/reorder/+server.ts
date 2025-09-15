import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index';
import { modulePost, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// PATCH - Reorder a post
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session?.userId) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Check if post exists
		const existingPosts = await db
			.select()
			.from(modulePost)
			.where(eq(modulePost.id, params.id))
			.limit(1);

		if (existingPosts.length === 0) {
			return json({ error: 'Post not found' }, { status: 404 });
		}

		const existingPost = existingPosts[0];

		// Check user permissions
		const userData = await db.select().from(user).where(eq(user.id, session.userId)).limit(1);
		if (userData.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const currentUser = userData[0];
		const isOwner = existingPost.authorId === session.userId;
		const isAdmin = currentUser.role === 'administrador';
		const canReorder = isOwner || isAdmin || currentUser.role === 'colaborador';

		if (!canReorder) {
			return json({ error: 'No tienes permisos para reordenar posts en este módulo' }, { status: 403 });
		}

		const data = await request.json();
		const { newOrderNumber } = data;

		// Validate required fields
		if (newOrderNumber === undefined || newOrderNumber < 1) {
			return json({ error: 'Invalid order number' }, { status: 400 });
		}

		const now = new Date();

		await db.update(modulePost)
			.set({
				orderNumber: newOrderNumber,
				updatedAt: now
			})
			.where(eq(modulePost.id, params.id));

		return json({ success: true });
	} catch (error) {
		console.error('Error reordering post:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};