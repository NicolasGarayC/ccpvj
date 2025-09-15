import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { postElement, modulePost } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getMediaBasePath, getLegacyFilePath } from '$lib/server/utils/paths';
import fs from 'fs';
import path from 'path';

// POST /api/post-elements/[id]/upload
export const POST: RequestHandler = async ({ params, request, cookies }) => {
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
				error: 'No tienes permisos para subir archivos'
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
				elementType: postElement.elementType,
				filePath: postElement.filePath
			})
			.from(postElement)
			.where(eq(postElement.id, elementId))
			.limit(1);

		if (element.length === 0) {
			console.error('Element not found with ID:', elementId);
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

		// Validate element type
		if (!['image', 'video', 'audio'].includes(element[0].elementType)) {
			return json({
				success: false,
				error: 'Este tipo de elemento no acepta archivos'
			}, { status: 400 });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({
				success: false,
				error: 'No file provided'
			}, { status: 400 });
		}

		// Validate file type based on element type
		const validMimeTypes = {
			image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'],
			video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
			audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac']
		};

		const allowedTypes = validMimeTypes[element[0].elementType as keyof typeof validMimeTypes] || [];
		if (!allowedTypes.includes(file.type)) {
			return json({
				success: false,
				error: `Tipo de archivo no válido para ${element[0].elementType}. Tipos permitidos: ${allowedTypes.join(', ')}`
			}, { status: 400 });
		}

		// Check file size (generous limits for professional content)
		let maxSize: number;
		let sizeLabel: string;

		if (element[0].elementType === 'video') {
			maxSize = 5 * 1024 * 1024 * 1024; // 5GB for videos (full movies)
			sizeLabel = '5GB';
		} else if (element[0].elementType === 'audio') {
			maxSize = 500 * 1024 * 1024; // 500MB for audio (1-2 hours high quality)
			sizeLabel = '500MB';
		} else { // image
			maxSize = 200 * 1024 * 1024; // 200MB for images (high resolution)
			sizeLabel = '200MB';
		}

		if (file.size > maxSize) {
			return json({
				success: false,
				error: `El archivo es demasiado grande. Tamaño máximo para ${element[0].elementType === 'video' ? 'videos' : element[0].elementType === 'audio' ? 'audios' : 'imágenes'}: ${sizeLabel}`
			}, { status: 400 });
		}

		// Create media directory if it doesn't exist
		const mediaBaseDir = getMediaBasePath();
		if (!fs.existsSync(mediaBaseDir)) {
			fs.mkdirSync(mediaBaseDir, { recursive: true });
		}

		// Create subdirectory for element type
		const elementDir = path.join(mediaBaseDir, element[0].elementType);
		if (!fs.existsSync(elementDir)) {
			fs.mkdirSync(elementDir, { recursive: true });
		}

		// Generate unique filename
		const fileExtension = path.extname(file.name);
		const fileName = `${elementId}_${Date.now()}${fileExtension}`;
		const filePath = path.join(elementDir, fileName);
		const webPath = `/media/${element[0].elementType}/${fileName}`;

		// Delete old file if exists
		if (element[0].filePath) {
			try {
				// Try new path first, then fallback to old path
				let oldFilePath = path.join(getMediaBasePath(), element[0].filePath);
				if (!fs.existsSync(oldFilePath)) {
					// Fallback to old static path (no longer needed since we moved everything)
					// oldFilePath = path.join(process.cwd(), 'static', element[0].filePath);
				}
				if (fs.existsSync(oldFilePath)) {
					fs.unlinkSync(oldFilePath);
				}
			} catch (fileError) {
				console.error('Error deleting old file:', fileError);
				// Continue with upload even if old file deletion fails
			}
		}

		// Save the file
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		fs.writeFileSync(filePath, buffer);

		// Update the element in database
		await db
			.update(postElement)
			.set({
				filePath: webPath,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				updatedAt: new Date()
			})
			.where(eq(postElement.id, elementId));

		return json({
			success: true,
			data: {
				filePath: webPath,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				message: 'File uploaded successfully'
			}
		});

	} catch (error) {
		console.error('Error uploading file:', error);
		console.error('Element ID:', params.id);
		console.error('Error details:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};