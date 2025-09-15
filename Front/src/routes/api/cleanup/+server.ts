import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSessionToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { postElement } from '$lib/server/db/schema';
import { cleanOrphanedFiles, cleanTempFiles, type CleanupResult } from '$lib/server/utils/mediaCleanup';

// POST /api/cleanup - Manual cleanup endpoint for administrators
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

		// Only administrators can run cleanup
		if (currentUser.role !== 'administrador') {
			return json({
				success: false,
				error: 'Solo administradores pueden ejecutar la limpieza'
			}, { status: 403 });
		}

		const body = await request.json();
		const {
			cleanOrphaned = true,
			cleanTemp = true,
			tempFileMaxAgeHours = 24,
			dryRun = false
		} = body;

		const results: {
			orphanedFiles: CleanupResult;
			tempFiles: CleanupResult;
			summary: {
				totalDeleted: number;
				totalErrors: number;
				deletedFiles: string[];
				errors: string[];
			};
		} = {
			orphanedFiles: { success: true, deletedFiles: [], errors: [] },
			tempFiles: { success: true, deletedFiles: [], errors: [] },
			summary: {
				totalDeleted: 0,
				totalErrors: 0,
				deletedFiles: [],
				errors: []
			}
		};

		// Get all referenced file paths from database
		let referencedFiles: string[] = [];
		if (cleanOrphaned) {
			const elements = await db
				.select({ filePath: postElement.filePath })
				.from(postElement)
				.where(isNotNull(postElement.filePath));

			referencedFiles = elements
				.map(e => e.filePath)
				.filter(path => path !== null) as string[];
		}

		// Clean orphaned files
		if (cleanOrphaned && !dryRun) {
			results.orphanedFiles = await cleanOrphanedFiles(referencedFiles);
		} else if (cleanOrphaned && dryRun) {
			// For dry run, we would scan but not delete
			console.log('DRY RUN: Would clean orphaned files not in:', referencedFiles.slice(0, 5));
			results.orphanedFiles = { success: true, deletedFiles: ['[DRY RUN] Would delete orphaned files'], errors: [] };
		}

		// Clean temporary files
		if (cleanTemp && !dryRun) {
			results.tempFiles = await cleanTempFiles(tempFileMaxAgeHours);
		} else if (cleanTemp && dryRun) {
			console.log(`DRY RUN: Would clean temp files older than ${tempFileMaxAgeHours} hours`);
			results.tempFiles = { success: true, deletedFiles: ['[DRY RUN] Would delete temp files'], errors: [] };
		}

		// Calculate summary
		results.summary.deletedFiles = [
			...results.orphanedFiles.deletedFiles,
			...results.tempFiles.deletedFiles
		];
		results.summary.errors = [
			...results.orphanedFiles.errors,
			...results.tempFiles.errors
		];
		results.summary.totalDeleted = results.summary.deletedFiles.length;
		results.summary.totalErrors = results.summary.errors.length;

		console.log(`Cleanup completed:`, {
			deleted: results.summary.totalDeleted,
			errors: results.summary.totalErrors,
			dryRun
		});

		return json({
			success: true,
			data: {
				...results,
				message: dryRun
					? 'Dry run completed - no files were actually deleted'
					: `Cleanup completed: ${results.summary.totalDeleted} files deleted, ${results.summary.totalErrors} errors`
			}
		});

	} catch (error) {
		console.error('Error during cleanup:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

// GET /api/cleanup - Get cleanup statistics
export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const sessionToken = cookies.get('auth-session');
		if (!sessionToken) {
			return json({ success: false, error: 'Authentication required' }, { status: 401 });
		}

		const { session, user: currentUser } = await validateSessionToken(sessionToken);
		if (!session || !currentUser) {
			return json({ success: false, error: 'Invalid session' }, { status: 401 });
		}

		// Only administrators can view cleanup stats
		if (currentUser.role !== 'administrador') {
			return json({
				success: false,
				error: 'Solo administradores pueden ver estadísticas de limpieza'
			}, { status: 403 });
		}

		// Get database statistics
		const elementsWithFiles = await db
			.select({ filePath: postElement.filePath })
			.from(postElement)
			.where(isNotNull(postElement.filePath));

		const referencedFiles = elementsWithFiles
			.map(e => e.filePath)
			.filter(path => path !== null) as string[];

		// TODO: Scan file system to count actual files
		// For now, just return database stats

		return json({
			success: true,
			data: {
				databaseFiles: referencedFiles.length,
				referencedFiles: referencedFiles.slice(0, 10), // Show first 10 for preview
				message: 'Use POST /api/cleanup with dryRun: true to see what would be cleaned'
			}
		});

	} catch (error) {
		console.error('Error getting cleanup stats:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

// Helper function for SQL is not null check
function isNotNull(column: any) {
	return sql`${column} IS NOT NULL`;
}

// Import sql from drizzle-orm
import { sql } from 'drizzle-orm';