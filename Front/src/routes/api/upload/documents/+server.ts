import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { getMediaDirectory } from '$lib/server/utils/paths';
import fs from 'fs';
import path from 'path';

// POST /api/upload/documents - Endpoint específico para documentos
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

		// Process the file upload
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ success: false, error: 'No file provided' }, { status: 400 });
		}

		// Validate file type
		const allowedTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation'
		];

		if (!allowedTypes.includes(file.type)) {
			return json({
				success: false,
				error: 'Tipo de archivo no válido. Solo se permiten PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX)'
			}, { status: 400 });
		}

		// Validate file size (100MB max)
		const maxSize = 100 * 1024 * 1024; // 100MB
		if (file.size > maxSize) {
			return json({
				success: false,
				error: 'Archivo muy grande (máx. 100MB)'
			}, { status: 400 });
		}

		// Save the file
		const mediaDir = getMediaDirectory('document');
		if (!fs.existsSync(mediaDir)) {
			fs.mkdirSync(mediaDir, { recursive: true });
		}

		const fileExtension = path.extname(file.name);
		const fileName = `document_${Date.now()}${fileExtension}`;
		const filePath = path.join(mediaDir, fileName);
		const webPath = `/media/document/${fileName}`;

		// Write file to disk
		const arrayBuffer = await file.arrayBuffer();
		fs.writeFileSync(filePath, new Uint8Array(arrayBuffer));

		return json({
			success: true,
			url: webPath,
			relativePath: webPath,
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type
		});

	} catch (error) {
		console.error('Error uploading document:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};