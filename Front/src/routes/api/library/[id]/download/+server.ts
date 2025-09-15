import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { libraryResource } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// GET /api/library/[id]/download - Download library resource file
export const GET: RequestHandler = async ({ params }) => {
	try {
		const resourceId = params.id;

		// Get resource info
		const resources = await db
			.select({
				id: libraryResource.id,
				name: libraryResource.name,
				fileName: libraryResource.fileName,
				filePath: libraryResource.filePath,
				mimeType: libraryResource.mimeType,
				downloadable: libraryResource.downloadable,
				downloadCount: libraryResource.downloadCount
			})
			.from(libraryResource)
			.where(and(eq(libraryResource.id, resourceId), eq(libraryResource.isActive, true)));

		if (resources.length === 0) {
			return error(404, 'Recurso no encontrado');
		}

		const resource = resources[0];

		// Check if resource is downloadable
		if (!resource.downloadable) {
			return error(403, 'Este recurso no permite descargas');
		}

		// Build full file path
		const fullPath = path.join(process.cwd(), 'static', resource.filePath);

		// Check if file exists
		if (!fs.existsSync(fullPath)) {
			console.error(`File not found: ${fullPath}`);
			return error(404, 'Archivo no encontrado en el servidor');
		}

		// Increment download count
		try {
			await db
				.update(libraryResource)
				.set({
					downloadCount: sql`${libraryResource.downloadCount} + 1`,
					updatedAt: new Date()
				})
				.where(eq(libraryResource.id, resourceId));
		} catch (updateError) {
			console.warn('Failed to update download count:', updateError);
			// Continue with download even if count update fails
		}

		// Read file
		const fileBuffer = fs.readFileSync(fullPath);

		// Set appropriate headers
		const headers = new Headers({
			'Content-Type': resource.mimeType || 'application/octet-stream',
			'Content-Length': fileBuffer.length.toString(),
			'Content-Disposition': `attachment; filename="${encodeURIComponent(resource.fileName)}"`,
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			'Pragma': 'no-cache',
			'Expires': '0'
		});

		return new Response(fileBuffer, {
			status: 200,
			headers
		});

	} catch (err) {
		console.error('Error downloading library resource:', err);
		return error(500, 'Error interno del servidor al descargar el archivo');
	}
};