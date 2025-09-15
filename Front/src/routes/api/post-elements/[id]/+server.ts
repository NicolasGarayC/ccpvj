import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { postElement, modulePost } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { deleteMediaFile } from '$lib/server/utils/mediaCleanup';
import fs from 'fs';
import path from 'path';

// PUT /api/post-elements/[id]
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
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
				error: 'No tienes permisos para modificar elementos de posts'
			}, { status: 403 });
		}

		const elementId = params.id;
		if (!elementId) {
			return json({ success: false, error: 'Element ID is required' }, { status: 400 });
		}

		// Get the element and verify ownership
		const element = await db
			.select({
				id: postElement.id,
				postId: postElement.postId,
			})
			.from(postElement)
			.where(eq(postElement.id, elementId))
			.limit(1);

		if (element.length === 0) {
			return json({ success: false, error: 'Element not found' }, { status: 404 });
		}

		// Verify user has access to the post
		const post = await db
			.select({
				authorId: modulePost.authorId
			})
			.from(modulePost)
			.where(eq(modulePost.id, element[0].postId))
			.limit(1);

		if (post.length === 0) {
			return json({ success: false, error: 'Post not found' }, { status: 404 });
		}

		if (post[0].authorId !== currentUser.id && currentUser.role !== 'administrador') {
			return json({
				success: false,
				error: 'No tienes permisos para modificar este elemento'
			}, { status: 403 });
		}

		const body = await request.json();
		const { content, filePath, fileName, fileSize, mimeType, orderNumber, metadata } = body;

		// Update the element
		await db
			.update(postElement)
			.set({
				content: content !== undefined ? content : undefined,
				filePath: filePath !== undefined ? filePath : undefined,
				fileName: fileName !== undefined ? fileName : undefined,
				fileSize: fileSize !== undefined ? fileSize : undefined,
				mimeType: mimeType !== undefined ? mimeType : undefined,
				orderNumber: orderNumber !== undefined ? orderNumber : undefined,
				metadata: metadata !== undefined ? metadata : undefined,
				updatedAt: new Date()
			})
			.where(eq(postElement.id, elementId));

		// Fetch the updated element
		const updatedElement = await db
			.select()
			.from(postElement)
			.where(eq(postElement.id, elementId))
			.limit(1);

		return json({
			success: true,
			data: {
				element: updatedElement[0]
			}
		});

	} catch (error) {
		console.error('Error updating post element:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/post-elements/[id]
export const DELETE: RequestHandler = async ({ params, cookies }) => {
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
				error: 'No tienes permisos para eliminar elementos de posts'
			}, { status: 403 });
		}

		const elementId = params.id;
		if (!elementId) {
			return json({ success: false, error: 'Element ID is required' }, { status: 400 });
		}

		// Get the element and verify ownership
		const element = await db
			.select({
				id: postElement.id,
				postId: postElement.postId,
				filePath: postElement.filePath
			})
			.from(postElement)
			.where(eq(postElement.id, elementId))
			.limit(1);

		if (element.length === 0) {
			return json({ success: false, error: 'Element not found' }, { status: 404 });
		}

		// Verify user has access to the post
		const post = await db
			.select({
				authorId: modulePost.authorId
			})
			.from(modulePost)
			.where(eq(modulePost.id, element[0].postId))
			.limit(1);

		if (post.length === 0) {
			return json({ success: false, error: 'Post not found' }, { status: 404 });
		}

		if (post[0].authorId !== currentUser.id && currentUser.role !== 'administrador') {
			return json({
				success: false,
				error: 'No tienes permisos para eliminar este elemento'
			}, { status: 403 });
		}

		// Delete associated media file if exists
		if (element[0].filePath) {
			const deleted = await deleteMediaFile(element[0].filePath);
			if (deleted) {
				console.log(`Successfully deleted media file: ${element[0].filePath}`);
			} else {
				console.error(`Failed to delete media file: ${element[0].filePath}`);
				// Continue with database deletion even if file deletion fails
			}
		}

		// Delete the element
		await db
			.delete(postElement)
			.where(eq(postElement.id, elementId));

		return json({
			success: true,
			data: {
				message: 'Element deleted successfully'
			}
		});

	} catch (error) {
		console.error('Error deleting post element:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};