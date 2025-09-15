import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { libraryResource, user } from '$lib/server/db/schema';
import { eq, and, sql, like, or, desc, asc } from 'drizzle-orm';
import { getMediaDirectory } from '$lib/server/utils/paths';
import fs from 'fs';
import path from 'path';

// GET /api/library - Get all library resources with optional filters
export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchParams = url.searchParams;

		// Build where conditions based on filters
		let whereConditions = [eq(libraryResource.isActive, true)];

		// Search term
		const search = searchParams.get('search');
		if (search) {
			const searchTerm = `%${search}%`;
			whereConditions.push(
				or(
					like(libraryResource.name, searchTerm),
					like(libraryResource.description, searchTerm),
					like(libraryResource.authors, searchTerm),
					like(libraryResource.tags, searchTerm)
				)!
			);
		}

		// Filters
		const category = searchParams.get('category');
		if (category) {
			whereConditions.push(eq(libraryResource.category, category));
		}

		const mediaType = searchParams.get('mediaType');
		if (mediaType) {
			whereConditions.push(eq(libraryResource.mediaType, mediaType));
		}

		const language = searchParams.get('language');
		if (language) {
			whereConditions.push(eq(libraryResource.language, language));
		}

		const publishYear = searchParams.get('publishYear');
		if (publishYear) {
			whereConditions.push(eq(libraryResource.publishYear, parseInt(publishYear)));
		}

		const downloadable = searchParams.get('downloadable');
		if (downloadable !== null) {
			whereConditions.push(eq(libraryResource.downloadable, downloadable === 'true'));
		}

		const isFeatured = searchParams.get('isFeatured');
		if (isFeatured !== null) {
			whereConditions.push(eq(libraryResource.isFeatured, isFeatured === 'true'));
		}

		// Get resources with uploader info
		const resources = await db
			.select({
				id: libraryResource.id,
				name: libraryResource.name,
				description: libraryResource.description,
				authors: libraryResource.authors,
				publishYear: libraryResource.publishYear,
				category: libraryResource.category,
				mediaType: libraryResource.mediaType,
				fileName: libraryResource.fileName,
				filePath: libraryResource.filePath,
				fileSize: libraryResource.fileSize,
				mimeType: libraryResource.mimeType,
				duration: libraryResource.duration,
				isbn: libraryResource.isbn,
				downloadable: libraryResource.downloadable,
				downloadCount: libraryResource.downloadCount,
				tags: libraryResource.tags,
				language: libraryResource.language,
				uploadedBy: libraryResource.uploadedBy,
				uploadedAt: libraryResource.uploadedAt,
				isActive: libraryResource.isActive,
				isFeatured: libraryResource.isFeatured,
				uploaderName: sql<string>`${user.nombre} || ' ' || ${user.apellido}`
			})
			.from(libraryResource)
			.leftJoin(user, eq(libraryResource.uploadedBy, user.id))
			.where(and(...whereConditions))
			.orderBy(desc(libraryResource.uploadedAt));

		// Parse JSON fields and format response
		const formattedResources = resources.map(resource => ({
			...resource,
			authors: JSON.parse(resource.authors || '[]'),
			tags: JSON.parse(resource.tags || '[]')
		}));

		return json({
			success: true,
			data: formattedResources
		});

	} catch (error) {
		console.error('Error fetching library resources:', error);
		return json({
			success: false,
			error: 'Error al cargar recursos de la biblioteca'
		}, { status: 500 });
	}
};

// POST /api/library - Create new library resource
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Validate authentication
		const sessionToken = cookies.get('auth-session');
		if (!sessionToken) {
			return json({
				success: false,
				error: 'Authentication required'
			}, { status: 401 });
		}

		const { session, user: currentUser } = await validateSessionToken(sessionToken);
		if (!session || !currentUser) {
			return json({
				success: false,
				error: 'Invalid session'
			}, { status: 401 });
		}

		// Check user permissions
		if (!['administrador', 'colaborador'].includes(currentUser.role)) {
			return json({
				success: false,
				error: 'No tienes permisos para subir recursos'
			}, { status: 403 });
		}

		// Process the form data
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const dataStr = formData.get('data') as string;

		if (!file || !dataStr) {
			return json({
				success: false,
				error: 'Archivo y datos son requeridos'
			}, { status: 400 });
		}

		const resourceData = JSON.parse(dataStr);

		// Validate required fields
		if (!resourceData.name || !resourceData.authors || resourceData.authors.length === 0) {
			return json({
				success: false,
				error: 'Nombre y autores son requeridos'
			}, { status: 400 });
		}

		// Validate file type based on mediaType
		const allowedTypes: Record<string, string[]> = {
			pdf: ['application/pdf'],
			video: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
			image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
			audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
			document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
		};

		const validTypes = allowedTypes[resourceData.mediaType] || [];
		if (!validTypes.includes(file.type)) {
			return json({
				success: false,
				error: `Tipo de archivo no válido para ${resourceData.mediaType}`
			}, { status: 400 });
		}

		// Create media directory
		const mediaDir = getMediaDirectory('library');
		if (!fs.existsSync(mediaDir)) {
			fs.mkdirSync(mediaDir, { recursive: true });
		}

		// Save file
		const fileExtension = path.extname(file.name);
		const fileName = `library_${Date.now()}_${Math.random().toString(36).substring(2)}${fileExtension}`;
		const filePath = path.join(mediaDir, fileName);
		const webPath = `/media/library/${fileName}`;

		// Write file to disk
		const arrayBuffer = await file.arrayBuffer();
		fs.writeFileSync(filePath, new Uint8Array(arrayBuffer));

		// Insert into database
		const [newResource] = await db.insert(libraryResource).values({
			name: resourceData.name,
			description: resourceData.description || null,
			authors: JSON.stringify(resourceData.authors),
			publishYear: resourceData.publishYear || null,
			category: resourceData.category,
			mediaType: resourceData.mediaType,
			fileName: file.name,
			filePath: webPath,
			fileSize: file.size,
			mimeType: file.type,
			duration: resourceData.duration || null,
			isbn: resourceData.isbn || null,
			downloadable: resourceData.downloadable !== false,
			downloadCount: 0,
			tags: JSON.stringify(resourceData.tags || []),
			language: resourceData.language || 'es',
			uploadedBy: currentUser.id,
			uploadedAt: new Date(),
			isActive: true,
			isFeatured: resourceData.isFeatured || false
		}).returning();

		// Format response
		const formattedResource = {
			...newResource,
			authors: JSON.parse(newResource.authors || '[]'),
			tags: JSON.parse(newResource.tags || '[]')
		};

		return json({
			success: true,
			data: formattedResource
		});

	} catch (error) {
		console.error('Error creating library resource:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};