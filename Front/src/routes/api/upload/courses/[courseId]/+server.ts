import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

const BASE_UPLOAD_DIR = 'Data/media/content/courses';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB for course banners

const ALLOWED_TYPES = [
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

async function cleanupOldFile(filePath: string): Promise<void> {
    try {
        if (existsSync(filePath)) {
            unlinkSync(filePath);
            console.log(`🗑️ Deleted old file: ${filePath}`);
        }
    } catch (error) {
        console.error(`⚠️ Failed to delete old file ${filePath}:`, error);
    }
}

export const POST: RequestHandler = async ({ request, params }) => {
    try {
        const { courseId } = params;

        if (!courseId) {
            return json({ error: 'Course ID is required' }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const oldImagePath = formData.get('oldImagePath') as string;

        if (!file) {
            return json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return json({
                error: 'Invalid file type. Only images are allowed.'
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return json({
                error: 'File too large. Maximum size is 20MB.'
            }, { status: 400 });
        }

        // Create contextual directory structure
        const courseDir = path.join(BASE_UPLOAD_DIR, courseId);
        if (!existsSync(courseDir)) {
            await mkdir(courseDir, { recursive: true });
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const extension = path.extname(file.name);
        const filename = `banner_${timestamp}${extension}`;
        const filepath = path.join(courseDir, filename);

        // Clean up old file if exists
        if (oldImagePath) {
            const oldFilePath = path.join('Data/media', oldImagePath);
            await cleanupOldFile(oldFilePath);
        }

        // Save new file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

        // Return contextual path for database storage
        const relativePath = `content/courses/${courseId}/${filename}`;

        console.log(`✅ Course image uploaded: ${relativePath}`);

        return json({
            success: true,
            filename,
            relativePath,
            url: `/media/${relativePath}`,
            size: file.size,
            type: file.type,
            context: 'course',
            contentId: courseId
        });

    } catch (error) {
        console.error('Course image upload error:', error);
        return json({
            error: 'Failed to upload course image'
        }, { status: 500 });
    }
};