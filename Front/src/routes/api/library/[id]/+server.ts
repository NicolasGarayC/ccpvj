import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { libraryResource, user } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { deleteMediaFile } from '$lib/server/utils/mediaCleanup';

// GET /api/library/[id] - Get single library resource
export const GET: RequestHandler = async ({ params }) => {
	try {
		const resourceId = params.id;

		// Get resource with uploader info
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
			.where(and(eq(libraryResource.id, resourceId), eq(libraryResource.isActive, true)));

		if (resources.length === 0) {
			return error(404, 'Recurso no encontrado');
		}

		const resource = resources[0];

		// Parse JSON fields and format response
		const formattedResource = {
			...resource,
			authors: JSON.parse(resource.authors || '[]'),
			tags: JSON.parse(resource.tags || '[]')
		};

		return json({
			success: true,
			data: formattedResource
		});

	} catch (err) {
		console.error('Error fetching library resource:', err);
		return error(500, 'Error interno del servidor');
	}
};

// PUT /api/library/[id] - Update library resource
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const resourceId = params.id;

		// Validate authentication
		const sessionToken = cookies.get('auth-session');
		if (!sessionToken) {
			return error(401, 'Authentication required');
		}

		const { session, user: currentUser } = await validateSessionToken(sessionToken);
		if (!session || !currentUser) {
			return error(401, 'Invalid session');
		}

		// Check if resource exists and user has permission
		const existingResource = await db
			.select()
			.from(libraryResource)
			.where(and(eq(libraryResource.id, resourceId), eq(libraryResource.isActive, true)));

		if (existingResource.length === 0) {
			return error(404, 'Recurso no encontrado');
		}

		// Check permissions: user must be the uploader or admin
		if (existingResource[0].uploadedBy !== currentUser.id && currentUser.role !== 'administrador') {
			return error(403, 'No tienes permisos para editar este recurso');
		}

		const body = await request.json();
		const { name, description, authors, category, publishYear, tags, language, downloadable, isFeatured, isbn, duration } = body;

		// Validate required fields
		if (!name || !authors || authors.length === 0) {
			return error(400, 'Nombre y autores son requeridos');
		}

		// Update resource
		await db
			.update(libraryResource)
			.set({
				name,
				description: description || null,
				authors: JSON.stringify(authors),
				category,
				publishYear: publishYear || null,
				tags: JSON.stringify(tags || []),
				language: language || 'es',
				downloadable: downloadable !== false,
				isFeatured: isFeatured || false,
				isbn: isbn || null,
				duration: duration || null,
				updatedAt: new Date()
			})
			.where(eq(libraryResource.id, resourceId));

		return json({ success: true });

	} catch (err) {
		console.error('Error updating library resource:', err);
		return error(500, 'Error interno del servidor');
	}
};

// DELETE /api/library/[id] - Delete library resource
export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		const resourceId = params.id;

		// Validate authentication
		const sessionToken = cookies.get('auth-session');
		if (!sessionToken) {
			return error(401, 'Authentication required');
		}

		const { session, user: currentUser } = await validateSessionToken(sessionToken);
		if (!session || !currentUser) {
			return error(401, 'Invalid session');
		}

		// Check if resource exists and user has permission
		const existingResource = await db
			.select()
			.from(libraryResource)
			.where(and(eq(libraryResource.id, resourceId), eq(libraryResource.isActive, true)));

		if (existingResource.length === 0) {
			return error(404, 'Recurso no encontrado');
		}

		// Check permissions: user must be the uploader or admin
		if (existingResource[0].uploadedBy !== currentUser.id && currentUser.role !== 'administrador') {
			return error(403, 'No tienes permisos para eliminar este recurso');
		}

		const resource = existingResource[0];

		// Delete physical file
		if (resource.filePath) {
			try {
				await deleteMediaFile(resource.filePath);
				console.log(`✅ Archivo eliminado: ${resource.filePath}`);
			} catch (fileError) {
				console.warn(`⚠️ No se pudo eliminar el archivo: ${resource.filePath}`, fileError);
				// Continue even if file deletion fails
			}
		}

		// Soft delete - set isActive to false
		await db
			.update(libraryResource)
			.set({
				isActive: false,
				updatedAt: new Date()
			})
			.where(eq(libraryResource.id, resourceId));

		return json({ success: true });

	} catch (err) {
		console.error('Error deleting library resource:', err);
		return error(500, 'Error interno del servidor');
	}
};