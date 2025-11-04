// Media configuration based on nginx setup
export const mediaConfig = {
	// Base directory where nginx serves media files from
	baseDir: process.env.MEDIA_BASE_PATH || '/home/user/ccpvj/Data/media',

	// Web paths that nginx serves (must match nginx configuration)
	webPaths: {
		image: '/media/image',
		video: '/media/video',
		audio: '/media/audio'
	},

	// Upload endpoints that nginx forwards to our API
	uploadEndpoints: {
		image: '/api/upload/images',
		video: '/api/upload/videos',
		audio: '/api/upload/audio'
	},

	// File size limits (different for direct vs nginx uploads)
	maxFileSizes: {
		// Direct upload limits (smaller)
		direct: {
			image: 200 * 1024 * 1024,      // 200MB
			video: 20 * 1024 * 1024 * 1024, // 20GB
			audio: 20 * 1024 * 1024 * 1024  // 20GB
		},
		// Nginx upload limits (larger, as configured en nginx)
		nginx: {
			image: 200 * 1024 * 1024,       // 200MB
			video: 20 * 1024 * 1024 * 1024, // 20GB
			audio: 20 * 1024 * 1024 * 1024  // 20GB
		}
	},

	// Supported file types
	supportedTypes: {
		image: [
			'image/jpeg', 'image/png', 'image/gif',
			'image/webp', 'image/svg+xml', 'image/avif',
			'image/bmp', 'image/tiff'
		],
		video: [
			'video/mp4', 'video/avi', 'video/mov',
			'video/wmv', 'video/webm'
		],
		audio: [
			'audio/mp3', 'audio/wav', 'audio/ogg',
			'audio/m4a', 'audio/aac', 'audio/flac'
		],
		document: [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation'
		]
	},

	// File extensions mapping
	extensions: {
		image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.tiff'],
		video: ['.mp4', '.avi', '.mov', '.wmv', '.webm'],
		audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
		document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
	}
};

// Helper function to get full file system path
export function getMediaPath(elementType: 'image' | 'video' | 'audio', fileName: string): string {
	return `${mediaConfig.baseDir}/${elementType}/${fileName}`;
}

// Helper function to get web path for serving
export function getWebPath(elementType: 'image' | 'video' | 'audio', fileName: string): string {
	return `${mediaConfig.webPaths[elementType]}/${fileName}`;
}

// Helper function to validate file type
export function isValidFileType(elementType: 'image' | 'video' | 'audio', mimeType: string): boolean {
	return mediaConfig.supportedTypes[elementType].includes(mimeType);
}

// Helper function to check file size
export function isValidFileSize(elementType: 'image' | 'video' | 'audio', fileSize: number, uploadType: 'direct' | 'nginx' = 'direct'): boolean {
	return fileSize <= mediaConfig.maxFileSizes[uploadType][elementType];
}

// Helper function to generate unique filename
export function generateFileName(elementId: string, originalName: string): string {
	const extension = originalName.substring(originalName.lastIndexOf('.'));
	return `${elementId}_${Date.now()}${extension}`;
}
