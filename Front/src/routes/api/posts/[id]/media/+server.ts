import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index';
import { modulePost, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { getMediaBasePath, getLegacyFilePath } from '$lib/server/utils/paths';

// POST - Upload media for a post
export const POST: RequestHandler = async ({ params, request, locals }) => {
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
		const canUpload = isOwner || isAdmin || currentUser.role === 'colaborador';

		if (!canUpload) {
			return json({ error: 'No tienes permisos para subir archivos' }, { status: 403 });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;
		const mediaType = formData.get('mediaType') as string;

		if (!file || !mediaType) {
			return json({ error: 'Missing file or media type' }, { status: 400 });
		}

		// Validate media type
		if (!['image', 'video', 'audio'].includes(mediaType)) {
			return json({ error: 'Invalid media type' }, { status: 400 });
		}

		// Validate file type based on media type
		const validMimeTypes = {
			image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'],
			video: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
			audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
		};

		if (!validMimeTypes[mediaType].includes(file.type)) {
			return json({ error: `Invalid file type for ${mediaType}` }, { status: 400 });
		}

		// Validate file size (max 50MB for videos, 10MB for others)
		const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
		if (file.size > maxSize) {
			const maxSizeMB = maxSize / (1024 * 1024);
			return json({ error: `File size exceeds ${maxSizeMB}MB limit` }, { status: 400 });
		}

		// Generate unique filename
		const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
		const fileName = `${nanoid()}.${fileExtension}`;

		// Create upload directory structure
		const uploadDir = join(getMediaBasePath(), 'posts', mediaType);
		if (!existsSync(uploadDir)) {
			await mkdir(uploadDir, { recursive: true });
		}

		// Save file
		const filePath = join(uploadDir, fileName);
		const arrayBuffer = await file.arrayBuffer();
		await writeFile(filePath, new Uint8Array(arrayBuffer));

		// Generate public URL
		const publicPath = `/media/posts/${mediaType}/${fileName}`;

		// Update post with media path
		const now = new Date();
		const updateData: any = { updatedAt: now };

		switch (mediaType) {
			case 'image':
				updateData.imagePath = publicPath;
				break;
			case 'video':
				updateData.videoPath = publicPath;
				break;
			case 'audio':
				updateData.audioPath = publicPath;
				break;
		}

		await db.update(modulePost)
			.set(updateData)
			.where(eq(modulePost.id, params.id));

		return json({ path: publicPath }, { status: 201 });
	} catch (error) {
		console.error('Error uploading media:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE - Remove media from a post
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
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
		const canDelete = isOwner || isAdmin || currentUser.role === 'colaborador';

		if (!canDelete) {
			return json({ error: 'No tienes permisos para eliminar archivos' }, { status: 403 });
		}

		const data = await request.json();
		const { mediaType } = data;

		if (!mediaType || !['image', 'video', 'audio'].includes(mediaType)) {
			return json({ error: 'Invalid media type' }, { status: 400 });
		}

		// Get current media path
		let currentPath: string | null = null;
		switch (mediaType) {
			case 'image':
				currentPath = existingPost.imagePath;
				break;
			case 'video':
				currentPath = existingPost.videoPath;
				break;
			case 'audio':
				currentPath = existingPost.audioPath;
				break;
		}

		// Delete physical file if exists
		if (currentPath) {
			try {
				// Try new path first, then fallback to old path
				let physicalPath = join(getMediaBasePath(), currentPath);
				if (!existsSync(physicalPath)) {
					// Fallback to old static path
					physicalPath = getLegacyFilePath(currentPath);
				}
				if (existsSync(physicalPath)) {
					await unlink(physicalPath);
				}
			} catch (fileError) {
				console.warn('Could not delete physical file:', fileError);
				// Continue with database update even if file deletion fails
			}
		}

		// Update database to remove media path
		const now = new Date();
		const updateData: any = { updatedAt: now };

		switch (mediaType) {
			case 'image':
				updateData.imagePath = null;
				break;
			case 'video':
				updateData.videoPath = null;
				break;
			case 'audio':
				updateData.audioPath = null;
				break;
		}

		await db.update(modulePost)
			.set(updateData)
			.where(eq(modulePost.id, params.id));

		return json({ success: true });
	} catch (error) {
		console.error('Error removing media:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};