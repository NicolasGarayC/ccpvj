import fs from 'fs';
import path from 'path';

/**
 * Utility for cleaning up multimedia files to prevent orphaned files
 */

export interface CleanupResult {
	success: boolean;
	deletedFiles: string[];
	errors: string[];
}

/**
 * Delete a single media file safely
 */
export async function deleteMediaFile(filePath: string): Promise<boolean> {
	if (!filePath) return true; // Nothing to delete

	try {
		// Convert web path to file system path
		const fullPath = getFullFilePath(filePath);

		// Security check: ensure path is within media directory
		if (!isValidMediaPath(fullPath)) {
			console.warn(`Security: Attempted to delete file outside media directory: ${fullPath}`);
			return false;
		}

		// Check if file exists before attempting deletion
		if (fs.existsSync(fullPath)) {
			fs.unlinkSync(fullPath);
			console.log(`Successfully deleted media file: ${fullPath}`);
			return true;
		} else {
			console.log(`File already doesn't exist: ${fullPath}`);
			return true; // Consider success if file doesn't exist
		}
	} catch (error) {
		console.error(`Error deleting media file ${filePath}:`, error);
		return false;
	}
}

/**
 * Delete multiple media files
 */
export async function deleteMediaFiles(filePaths: string[]): Promise<CleanupResult> {
	const result: CleanupResult = {
		success: true,
		deletedFiles: [],
		errors: []
	};

	for (const filePath of filePaths) {
		if (!filePath) continue;

		const deleted = await deleteMediaFile(filePath);
		if (deleted) {
			result.deletedFiles.push(filePath);
		} else {
			result.errors.push(filePath);
			result.success = false;
		}
	}

	return result;
}

/**
 * Clean up old file when replacing with new one
 */
export async function replaceMediaFile(oldFilePath: string | null, newFilePath: string): Promise<CleanupResult> {
	const result: CleanupResult = {
		success: true,
		deletedFiles: [],
		errors: []
	};

	// Only delete if we have an old file and it's different from the new one
	if (oldFilePath && oldFilePath !== newFilePath) {
		const deleted = await deleteMediaFile(oldFilePath);
		if (deleted) {
			result.deletedFiles.push(oldFilePath);
		} else {
			result.errors.push(oldFilePath);
			result.success = false;
		}
	}

	return result;
}

/**
 * Find and clean orphaned files (files not referenced in database)
 */
export async function cleanOrphanedFiles(referencedFiles: string[]): Promise<CleanupResult> {
	const result: CleanupResult = {
		success: true,
		deletedFiles: [],
		errors: []
	};

	try {
		const mediaDir = getMediaBaseDirectory();
		const types = ['image', 'video', 'audio'];

		for (const type of types) {
			const typeDir = path.join(mediaDir, type);

			if (!fs.existsSync(typeDir)) continue;

			const files = fs.readdirSync(typeDir);

			for (const file of files) {
				const filePath = path.join(typeDir, file);
				const webPath = `/media/${type}/${file}`;

				// Skip directories
				if (!fs.statSync(filePath).isFile()) continue;

				// Check if this file is referenced in the database
				if (!referencedFiles.includes(webPath)) {
					const deleted = await deleteMediaFile(webPath);
					if (deleted) {
						result.deletedFiles.push(webPath);
					} else {
						result.errors.push(webPath);
						result.success = false;
					}
				}
			}
		}
	} catch (error) {
		console.error('Error cleaning orphaned files:', error);
		result.success = false;
		result.errors.push('Failed to scan directories');
	}

	return result;
}

/**
 * Clean up temporary upload files older than specified age
 */
export async function cleanTempFiles(maxAgeHours: number = 24): Promise<CleanupResult> {
	const result: CleanupResult = {
		success: true,
		deletedFiles: [],
		errors: []
	};

	try {
		const mediaDir = getMediaBaseDirectory();
		const tempDir = path.join(mediaDir, 'temp', 'uploads');

		if (!fs.existsSync(tempDir)) return result;

		const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);
		const types = ['images', 'videos', 'audio'];

		for (const type of types) {
			const typeDir = path.join(tempDir, type);

			if (!fs.existsSync(typeDir)) continue;

			const files = fs.readdirSync(typeDir);

			for (const file of files) {
				const filePath = path.join(typeDir, file);

				try {
					const stats = fs.statSync(filePath);

					if (stats.isFile() && stats.mtime.getTime() < maxAge) {
						fs.unlinkSync(filePath);
						result.deletedFiles.push(`temp/${type}/${file}`);
					}
				} catch (fileError) {
					console.error(`Error processing temp file ${filePath}:`, fileError);
					result.errors.push(`temp/${type}/${file}`);
					result.success = false;
				}
			}
		}
	} catch (error) {
		console.error('Error cleaning temp files:', error);
		result.success = false;
		result.errors.push('Failed to clean temp files');
	}

	return result;
}

/**
 * Get file size for a media file
 */
export function getMediaFileSize(filePath: string): number {
	try {
		const fullPath = getFullFilePath(filePath);
		if (fs.existsSync(fullPath)) {
			return fs.statSync(fullPath).size;
		}
	} catch (error) {
		console.error(`Error getting file size for ${filePath}:`, error);
	}
	return 0;
}

/**
 * Check if a media file exists
 */
export function mediaFileExists(filePath: string): boolean {
	try {
		const fullPath = getFullFilePath(filePath);
		return fs.existsSync(fullPath);
	} catch (error) {
		console.error(`Error checking file existence for ${filePath}:`, error);
		return false;
	}
}

// Helper functions

function getMediaBaseDirectory(): string {
	return process.env.MEDIA_BASE_PATH || path.join(process.cwd(), 'Data', 'media');
}

function getFullFilePath(webPath: string): string {
	// Convert web path like "/media/image/file.jpg" to full file system path
	const mediaDir = getMediaBaseDirectory();

	// Remove leading /media/ from web path
	const relativePath = webPath.replace(/^\/media\//, '');

	return path.join(mediaDir, relativePath);
}

function isValidMediaPath(fullPath: string): boolean {
	const mediaDir = getMediaBaseDirectory();
	const resolvedPath = path.resolve(fullPath);
	const resolvedMediaDir = path.resolve(mediaDir);

	return resolvedPath.startsWith(resolvedMediaDir);
}