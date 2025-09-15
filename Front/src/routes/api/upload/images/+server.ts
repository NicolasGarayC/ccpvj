import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { postElement } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { replaceMediaFile } from '$lib/server/utils/mediaCleanup';
import { getMediaDirectory, getProjectRoot } from '$lib/server/utils/paths';
import fs from 'fs';
import path from 'path';

// POST /api/upload/images - Endpoint específico para imágenes
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

		// Get elementId from headers (from nginx or client)
		const elementId = request.headers.get('X-Element-ID');
		if (!elementId) {
			return json({ success: false, error: 'Element ID is required' }, { status: 400 });
		}

		// Handle file upload from nginx (via X-File-Path) or direct upload
		const nginxFilePath = request.headers.get('X-File-Path');

		if (nginxFilePath) {
			// File uploaded via nginx - just process metadata
			return await processNginxUpload(elementId, nginxFilePath, 'image');
		} else {
			// Direct upload (fallback)
			return await processDirectUpload(request, elementId, 'image');
		}

	} catch (error) {
		console.error('Error uploading image:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

async function processNginxUpload(elementId: string, nginxFilePath: string, elementType: string) {
	// Get current element to check for existing file
	const currentElement = await db
		.select({ filePath: postElement.filePath })
		.from(postElement)
		.where(eq(postElement.id, elementId))
		.limit(1);

	const oldFilePath = currentElement.length > 0 ? currentElement[0].filePath : null;

	// Move file from nginx temp to final location
	const finalDir = getMediaDirectory(elementType);
	const fileExtension = path.extname(nginxFilePath);
	const fileName = `${elementId}_${Date.now()}${fileExtension}`;
	const finalPath = path.join(finalDir, fileName);
	const webPath = `/media/${elementType}/${fileName}`;

	// Ensure directory exists
	if (!fs.existsSync(finalDir)) {
		fs.mkdirSync(finalDir, { recursive: true });
	}

	// Move file from nginx temp to final location
	fs.renameSync(nginxFilePath, finalPath);

	// Get file stats
	const stats = fs.statSync(finalPath);
	const mimeType = getMimeType(elementType, fileExtension);

	// Update database
	await db
		.update(postElement)
		.set({
			filePath: webPath,
			fileName: path.basename(nginxFilePath),
			fileSize: stats.size,
			mimeType: mimeType,
			updatedAt: new Date()
		})
		.where(eq(postElement.id, elementId));

	// Clean up old file after successful database update
	if (oldFilePath) {
		const cleanupResult = await replaceMediaFile(oldFilePath, webPath);
		if (cleanupResult.deletedFiles.length > 0) {
			console.log(`Cleaned up old image: ${cleanupResult.deletedFiles.join(', ')}`);
		}
	}

	return json({
		success: true,
		data: {
			filePath: webPath,
			fileName: path.basename(nginxFilePath),
			fileSize: stats.size,
			mimeType: mimeType,
			message: 'Image uploaded successfully via nginx'
		}
	});
}

async function processDirectUpload(request: Request, elementId: string, elementType: string) {
	// Get current element to check for existing file
	const currentElement = await db
		.select({ filePath: postElement.filePath })
		.from(postElement)
		.where(eq(postElement.id, elementId))
		.limit(1);

	const oldFilePath = currentElement.length > 0 ? currentElement[0].filePath : null;

	const formData = await request.formData();
	const file = formData.get('file') as File;

	if (!file) {
		return json({ success: false, error: 'No file provided' }, { status: 400 });
	}

	// Validate file type - check both MIME type and extension
	const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'];
	const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.tiff'];
	const fileExtension = path.extname(file.name).toLowerCase();

	// Debug logging
	console.log('File validation debug:', {
		fileName: file.name,
		fileType: file.type,
		fileExtension: fileExtension,
		fileSize: file.size
	});

	const isValidMimeType = validImageTypes.includes(file.type);
	const isValidExtension = validExtensions.includes(fileExtension);

	console.log('Validation results:', {
		isValidMimeType,
		isValidExtension,
		validImageTypes,
		validExtensions
	});

	if (!isValidMimeType && !isValidExtension) {
		console.log('File validation failed for:', {
			fileName: file.name,
			fileType: file.type,
			fileExtension: fileExtension
		});
		return json({
			success: false,
			error: `Tipo de archivo no válido. Archivo: ${file.name}, Tipo: ${file.type}, Extensión: ${fileExtension}. Tipos permitidos: JPG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF`
		}, { status: 400 });
	}

	// Check file size (20MB limit for images)
	if (file.size > 20 * 1024 * 1024) {
		return json({
			success: false,
			error: 'El archivo es demasiado grande. Tamaño máximo: 20MB'
		}, { status: 400 });
	}

	// Save file
	const finalDir = getMediaDirectory(elementType);
	const fileExtension = path.extname(file.name);
	const fileName = `${elementId}_${Date.now()}${fileExtension}`;
	const finalPath = path.join(finalDir, fileName);
	const webPath = `/media/${elementType}/${fileName}`;

	// Ensure directory exists
	if (!fs.existsSync(finalDir)) {
		fs.mkdirSync(finalDir, { recursive: true });
	}

	// Save file
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	fs.writeFileSync(finalPath, buffer);

	// Update database
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

	// Clean up old file after successful database update
	if (oldFilePath) {
		const cleanupResult = await replaceMediaFile(oldFilePath, webPath);
		if (cleanupResult.deletedFiles.length > 0) {
			console.log(`Cleaned up old image: ${cleanupResult.deletedFiles.join(', ')}`);
		}
	}

	return json({
		success: true,
		data: {
			filePath: webPath,
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type,
			message: 'Image uploaded successfully'
		}
	});
}

// Función movida a src/lib/server/utils/paths.ts

function getMimeType(elementType: string, extension: string): string {
	const mimeTypes: Record<string, Record<string, string>> = {
		image: {
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.gif': 'image/gif',
			'.webp': 'image/webp',
			'.svg': 'image/svg+xml',
			'.avif': 'image/avif',
			'.bmp': 'image/bmp',
			'.tiff': 'image/tiff'
		}
	};

	return mimeTypes[elementType]?.[extension.toLowerCase()] || 'application/octet-stream';
}