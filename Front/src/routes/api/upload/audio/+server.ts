import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { postElement } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { replaceMediaFile } from '$lib/server/utils/mediaCleanup';
import { getMediaDirectory } from '$lib/server/utils/paths';
import fs from 'fs';
import path from 'path';

// POST /api/upload/audio - Endpoint específico para audio
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
			return await processNginxUpload(elementId, nginxFilePath, 'audio');
		} else {
			// Direct upload (fallback)
			return await processDirectUpload(request, elementId, 'audio');
		}

	} catch (error) {
		console.error('Error uploading audio:', error);
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
			console.log(`Cleaned up old audio: ${cleanupResult.deletedFiles.join(', ')}`);
		}
	}

	return json({
		success: true,
		data: {
			filePath: webPath,
			fileName: path.basename(nginxFilePath),
			fileSize: stats.size,
			mimeType: mimeType,
			message: 'Audio uploaded successfully via nginx'
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

	// Validate file type
	const validAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac'];
	if (!validAudioTypes.includes(file.type)) {
		return json({
			success: false,
			error: `Tipo de archivo no válido. Tipos permitidos: ${validAudioTypes.join(', ')}`
		}, { status: 400 });
	}

	// Check file size (100MB limit for audio in direct uploads)
	const maxSize = 100 * 1024 * 1024; // 100MB for direct uploads
	if (file.size > maxSize) {
		return json({
			success: false,
			error: 'El archivo es demasiado grande. Tamaño máximo: 100MB (usa nginx para archivos más grandes)'
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
			console.log(`Cleaned up old audio: ${cleanupResult.deletedFiles.join(', ')}`);
		}
	}

	return json({
		success: true,
		data: {
			filePath: webPath,
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type,
			message: 'Audio uploaded successfully'
		}
	});
}

// Función movida a src/lib/server/utils/paths.ts

function getMimeType(elementType: string, extension: string): string {
	const mimeTypes: Record<string, Record<string, string>> = {
		audio: {
			'.mp3': 'audio/mp3',
			'.wav': 'audio/wav',
			'.ogg': 'audio/ogg',
			'.m4a': 'audio/m4a',
			'.aac': 'audio/aac',
			'.flac': 'audio/flac'
		}
	};

	return mimeTypes[elementType]?.[extension.toLowerCase()] || 'application/octet-stream';
}