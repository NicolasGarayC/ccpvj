import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index';
import { modulePost, user, postElement } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { deleteMediaFiles } from '$lib/server/utils/mediaCleanup';

// GET - Get a specific post by ID
export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	// Allow unauthenticated access for public content viewing

	try {
		const posts = await db
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
			.where(eq(modulePost.id, params.id))
			.limit(1);

		if (posts.length === 0) {
			return json({ error: 'Post not found' }, { status: 404 });
		}

		return json(posts[0]);
	} catch (error) {
		console.error('Error getting post:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT - Update a post
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session?.userId) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Check if post exists and get current post data
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
		const canEdit = isOwner || isAdmin;

		if (!canEdit) {
			return json({ error: 'No tienes permisos para editar este post' }, { status: 403 });
		}

		const data = await request.json();
		const { title, subtitle, content, imagePath, videoPath, audioPath, orderNumber } = data;

		// Validate required fields
		if (!title || orderNumber === undefined) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const now = new Date();

		await db.update(modulePost)
			.set({
				title,
				subtitle: subtitle || null,
				content: content || null,
				imagePath: imagePath || null,
				videoPath: videoPath || null,
				audioPath: audioPath || null,
				orderNumber,
				updatedAt: now
			})
			.where(eq(modulePost.id, params.id));

		return json({ success: true });
	} catch (error) {
		console.error('Error updating post:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE - Delete a post
export const DELETE: RequestHandler = async ({ params, locals }) => {
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
		const canDelete = isOwner || isAdmin;

		if (!canDelete) {
			return json({ error: 'No tienes permisos para eliminar este post' }, { status: 403 });
		}

		// Get all media files associated with this post before deleting
		const elements = await db
			.select({ filePath: postElement.filePath })
			.from(postElement)
			.where(eq(postElement.postId, params.id));

		const mediaFiles = elements
			.map(e => e.filePath)
			.filter(path => path !== null) as string[];

		// Delete the post (this will cascade delete elements via foreign key)
		await db.delete(modulePost).where(eq(modulePost.id, params.id));

		// Clean up all associated media files
		if (mediaFiles.length > 0) {
			const cleanupResult = await deleteMediaFiles(mediaFiles);
			if (cleanupResult.deletedFiles.length > 0) {
				console.log(`Cleaned up ${cleanupResult.deletedFiles.length} media files for deleted post: ${params.id}`);
			}
			if (cleanupResult.errors.length > 0) {
				console.error(`Failed to delete ${cleanupResult.errors.length} media files for post: ${params.id}`, cleanupResult.errors);
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting post:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};