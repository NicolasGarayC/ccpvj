import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { course } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { replaceMediaFile } from '$lib/server/utils/mediaCleanup';
import { getMediaDirectory } from '$lib/server/utils/paths';
import fs from 'fs';
import path from 'path';

// POST /api/upload/course-images - Endpoint específico para imágenes de cursos
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
				error: 'No tienes permisos para subir archivos'
			}, { status: 403 });
		}

		// Get courseId from headers (optional for new courses)
		const courseId = request.headers.get('X-Course-ID');
		let courseData = null;

		if (courseId) {
			// Verify course exists and user has permission
			const existingCourse = await db
				.select()
				.from(course)
				.where(eq(course.id, courseId))
				.limit(1);

			if (existingCourse.length === 0) {
				return json({ success: false, error: 'Course not found' }, { status: 404 });
			}

			courseData = existingCourse[0];
			const isOwner = courseData.educatorId === currentUser.id;
			const isAdmin = currentUser.role === 'administrador';

			if (!isOwner && !isAdmin) {
				return json({
					success: false,
					error: 'No tienes permisos para editar este curso'
				}, { status: 403 });
			}
		}

		// Process the file upload
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ success: false, error: 'No file provided' }, { status: 400 });
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'];
		if (!allowedTypes.includes(file.type)) {
			return json({
				success: false,
				error: 'Tipo de archivo no válido. Solo se permiten JPG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF'
			}, { status: 400 });
		}

		// Validate file size (20MB max)
		const maxSize = 20 * 1024 * 1024; // 20MB
		if (file.size > maxSize) {
			return json({
				success: false,
				error: 'Archivo muy grande (máx. 20MB)'
			}, { status: 400 });
		}

		// Save the file
		const mediaDir = getMediaDirectory('image');
		if (!fs.existsSync(mediaDir)) {
			fs.mkdirSync(mediaDir, { recursive: true });
		}

		const fileExtension = path.extname(file.name);
		const fileName = `course_${courseId}_${Date.now()}${fileExtension}`;
		const filePath = path.join(mediaDir, fileName);
		const webPath = `/media/image/${fileName}`;

		// Write file to disk
		const arrayBuffer = await file.arrayBuffer();
		fs.writeFileSync(filePath, new Uint8Array(arrayBuffer));

		// Update course in database if courseId exists
		if (courseId && courseData) {
			// Get old image path for cleanup
			const oldImagePath = courseData.imagePath;

			// Update course in database
			await db.update(course)
				.set({
					imagePath: webPath,
					updatedAt: new Date()
				})
				.where(eq(course.id, courseId));

			// Clean up old file if it exists
			if (oldImagePath) {
				try {
					const cleanupResult = await replaceMediaFile(oldImagePath, webPath);
					if (cleanupResult.deletedFiles.length > 0) {
						console.log(`Cleaned up old course image: ${oldImagePath}`);
					}
				} catch (error) {
					console.error('Error cleaning up old course image:', error);
					// Don't fail the request if cleanup fails
				}
			}
		}

		return json({
			success: true,
			url: webPath,
			relativePath: webPath
		});

	} catch (error) {
		console.error('Error uploading course image:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};