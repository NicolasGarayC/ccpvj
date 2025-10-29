import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { getMediaDir } from '$lib/server/utils/media-paths';

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

const ALLOWED_IMAGE_TYPES = [
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	'image/avif',
	'image/bmp',
	'image/tiff'
];

const sanitizeFileName = (name: string): string => {
	const extension = path.extname(name);
	const baseName = path.basename(name, extension);
	const sanitizedBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
	const timestamp = Date.now();
	return `${sanitizedBase || 'image'}_${timestamp}${extension || '.jpg'}`;
};

const normalizeRelativePath = (relativePath: string): string => {
	const withoutMediaPrefix = relativePath.replace(/^\/?media\//, '');
	// Prevent directory traversal by stripping leading ../ segments
	return path
		.normalize(withoutMediaPrefix)
		.replace(/^(\.\.(\/|\\|$))+/, '')
		.replace(/^\/+/, '');
};

const tryRemoveOldFile = async (mediaDir: string, rawPath?: string | null) => {
	if (!rawPath) {
		return;
	}

	const normalizedPath = normalizeRelativePath(rawPath);
	if (!normalizedPath) {
		return;
	}

	const fullPath = path.join(mediaDir, normalizedPath);
	try {
		await unlink(fullPath);
	} catch (error: any) {
		if (error?.code !== 'ENOENT') {
			console.error(`Failed to delete old file (${fullPath}):`, error);
		}
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { courseId } = params;
		if (!courseId) {
			return json({ error: 'Course ID is required' }, { status: 400 });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const oldImagePath = formData.get('oldImagePath') as string | null;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
			return json({ error: 'Invalid file type. Only image uploads are allowed.' }, { status: 400 });
		}

	if (file.size > MAX_FILE_SIZE) {
			return json({ error: 'File too large. Maximum size is 200MB.' }, { status: 400 });
		}

		const mediaDir = getMediaDir();
		const courseDir = path.join(mediaDir, 'content', 'material-apoyo', courseId);

		if (!existsSync(courseDir)) {
			await mkdir(courseDir, { recursive: true });
		}

		await tryRemoveOldFile(mediaDir, oldImagePath);

		const filename = sanitizeFileName(file.name);
		const destinationPath = path.join(courseDir, filename);

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		await writeFile(destinationPath, buffer);

		const relativePath = `content/material-apoyo/${courseId}/${filename}`;

		return json({
			success: true,
			filename,
			relativePath,
			url: `/media/${relativePath}`,
			size: file.size,
			type: file.type,
			context: 'material-apoyo',
			contentId: courseId
		});
	} catch (error) {
		console.error('Course image upload error:', error);
		return json({ error: 'Failed to upload image' }, { status: 500 });
	}
};
