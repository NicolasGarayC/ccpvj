import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { libraryResource } from '$lib/server/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

// GET /api/library/stats - Get library statistics
export const GET: RequestHandler = async () => {
	try {
		// Get total resources count
		const totalResourcesResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(libraryResource)
			.where(eq(libraryResource.isActive, true));

		const totalResources = totalResourcesResult[0]?.count || 0;

		// Get total downloads
		const totalDownloadsResult = await db
			.select({ total: sql<number>`sum(${libraryResource.downloadCount})` })
			.from(libraryResource)
			.where(eq(libraryResource.isActive, true));

		const totalDownloads = totalDownloadsResult[0]?.total || 0;

		// Get resources by type
		const resourcesByTypeResult = await db
			.select({
				mediaType: libraryResource.mediaType,
				count: sql<number>`count(*)`
			})
			.from(libraryResource)
			.where(eq(libraryResource.isActive, true))
			.groupBy(libraryResource.mediaType);

		const resourcesByType = {
			pdf: 0,
			video: 0,
			image: 0,
			audio: 0,
			document: 0
		};

		resourcesByTypeResult.forEach(row => {
			if (row.mediaType in resourcesByType) {
				resourcesByType[row.mediaType as keyof typeof resourcesByType] = row.count;
			}
		});

		// Get resources by category
		const resourcesByCategoryResult = await db
			.select({
				category: libraryResource.category,
				count: sql<number>`count(*)`
			})
			.from(libraryResource)
			.where(eq(libraryResource.isActive, true))
			.groupBy(libraryResource.category);

		const resourcesByCategory = {
			educacion: 0,
			cultura: 0,
			historia: 0,
			arte: 0,
			literatura: 0,
			ciencias: 0,
			otros: 0
		};

		resourcesByCategoryResult.forEach(row => {
			if (row.category in resourcesByCategory) {
				resourcesByCategory[row.category as keyof typeof resourcesByCategory] = row.count;
			}
		});

		// Get popular resources (top 5 by download count)
		const popularResourcesResult = await db
			.select({
				id: libraryResource.id,
				name: libraryResource.name,
				downloadCount: libraryResource.downloadCount,
				mediaType: libraryResource.mediaType
			})
			.from(libraryResource)
			.where(eq(libraryResource.isActive, true))
			.orderBy(desc(libraryResource.downloadCount))
			.limit(5);

		// Get recent uploads (last 5)
		const recentUploadsResult = await db
			.select({
				id: libraryResource.id,
				name: libraryResource.name,
				uploadedAt: libraryResource.uploadedAt,
				mediaType: libraryResource.mediaType
			})
			.from(libraryResource)
			.where(eq(libraryResource.isActive, true))
			.orderBy(desc(libraryResource.uploadedAt))
			.limit(5);

		const stats = {
			totalResources,
			totalDownloads,
			resourcesByType,
			resourcesByCategory,
			popularResources: popularResourcesResult,
			recentUploads: recentUploadsResult
		};

		return json({
			success: true,
			data: stats
		});

	} catch (error) {
		console.error('Error fetching library stats:', error);
		return json({
			success: false,
			error: 'Error al cargar estadísticas'
		}, { status: 500 });
	}
};