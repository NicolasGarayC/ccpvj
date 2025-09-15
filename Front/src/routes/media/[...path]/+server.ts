import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMediaBasePath } from '$lib/server/utils/paths';
import fs from 'fs';
import path from 'path';

// Static file serving for media files (development only)
// In production, nginx serves these files directly
export const GET: RequestHandler = async ({ params }) => {
	try {
		// Get the full path from the URL parameters
		const mediaPath = params.path;

		if (!mediaPath) {
			throw error(404, 'File not found');
		}

		// Construct full file path
		const baseDir = getMediaBasePath();
		const filePath = path.join(baseDir, mediaPath);

		// Security check: ensure the path is within the media directory
		const resolvedPath = path.resolve(filePath);
		const resolvedBaseDir = path.resolve(baseDir);

		if (!resolvedPath.startsWith(resolvedBaseDir)) {
			throw error(403, 'Access denied');
		}

		// Check if file exists
		if (!fs.existsSync(filePath)) {
			throw error(404, 'File not found');
		}

		// Get file stats
		const stats = fs.statSync(filePath);
		if (!stats.isFile()) {
			throw error(404, 'Not a file');
		}

		// Determine content type
		const ext = path.extname(filePath).toLowerCase();
		const contentType = getContentType(ext);

		// Read and return file
		const fileBuffer = fs.readFileSync(filePath);

		return new Response(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': stats.size.toString(),
				'Cache-Control': 'public, max-age=3600', // 1 hour cache for development
				'ETag': `"${stats.mtime.getTime()}-${stats.size}"`,
				'Last-Modified': stats.mtime.toUTCString(),
				// Add CORS headers for development
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS'
			}
		});

	} catch (err) {
		console.error('Error serving media file:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Internal server error');
	}
};

function getContentType(extension: string): string {
	const contentTypes: Record<string, string> = {
		// Images
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.png': 'image/png',
		'.gif': 'image/gif',
		'.webp': 'image/webp',
		'.svg': 'image/svg+xml',

		// Videos
		'.mp4': 'video/mp4',
		'.webm': 'video/webm',
		'.avi': 'video/avi',
		'.mov': 'video/quicktime',
		'.wmv': 'video/x-ms-wmv',

		// Audio
		'.mp3': 'audio/mpeg',
		'.wav': 'audio/wav',
		'.ogg': 'audio/ogg',
		'.m4a': 'audio/mp4',
		'.aac': 'audio/aac',
		'.flac': 'audio/flac'
	};

	return contentTypes[extension] || 'application/octet-stream';
}