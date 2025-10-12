import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { unlink, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const BASE_MEDIA_DIR = 'Data/media';
const OLD_STRUCTURE_DIRS = ['image', 'video', 'audio', 'document'];

interface CleanupOptions {
    dryRun?: boolean;
    cleanOldStructure?: boolean;
    cleanOrphaned?: boolean;
    cleanTemp?: boolean;
}

interface CleanupResult {
    success: boolean;
    deletedFiles: string[];
    deletedCount: number;
    errors: string[];
    message: string;
}

async function getFilesRecursively(dirPath: string): Promise<string[]> {
    try {
        const files: string[] = [];
        const items = await readdir(dirPath);

        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const itemStat = await stat(fullPath);

            if (itemStat.isDirectory()) {
                const subFiles = await getFilesRecursively(fullPath);
                files.push(...subFiles);
            } else {
                files.push(fullPath);
            }
        }

        return files;
    } catch (error) {
        return [];
    }
}

async function cleanOldStructureFiles(dryRun: boolean): Promise<{ deletedFiles: string[]; errors: string[] }> {
    const deletedFiles: string[] = [];
    const errors: string[] = [];

    for (const dir of OLD_STRUCTURE_DIRS) {
        const oldDirPath = path.join(BASE_MEDIA_DIR, dir);

        if (!existsSync(oldDirPath)) continue;

        try {
            const files = await getFilesRecursively(oldDirPath);

            for (const filePath of files) {
                if (dryRun) {
                    deletedFiles.push(filePath);
                } else {
                    try {
                        await unlink(filePath);
                        deletedFiles.push(filePath);
                        console.log(`🗑️ Deleted old structure file: ${filePath}`);
                    } catch (error) {
                        errors.push(`Failed to delete ${filePath}: ${error}`);
                        console.error(`⚠️ Failed to delete ${filePath}:`, error);
                    }
                }
            }
        } catch (error) {
            errors.push(`Failed to read directory ${oldDirPath}: ${error}`);
        }
    }

    return { deletedFiles, errors };
}

async function cleanOrphanedFiles(dryRun: boolean): Promise<{ deletedFiles: string[]; errors: string[] }> {
    const deletedFiles: string[] = [];
    const errors: string[] = [];

    // This is a simplified version - in a real implementation, you would
    // check the database to see which files are still referenced

    // For now, we'll just log that this feature needs database integration
    console.log('🔍 Orphaned file cleanup requires database integration');

    return { deletedFiles, errors };
}

async function cleanTempFiles(dryRun: boolean, maxAgeHours: number = 24): Promise<{ deletedFiles: string[]; errors: string[] }> {
    const deletedFiles: string[] = [];
    const errors: string[] = [];

    const tempDir = path.join(BASE_MEDIA_DIR, 'temp');

    if (!existsSync(tempDir)) {
        return { deletedFiles, errors };
    }

    try {
        const files = await getFilesRecursively(tempDir);
        const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

        for (const filePath of files) {
            try {
                const fileStat = await stat(filePath);

                if (fileStat.mtime.getTime() < cutoffTime) {
                    if (dryRun) {
                        deletedFiles.push(filePath);
                    } else {
                        await unlink(filePath);
                        deletedFiles.push(filePath);
                        console.log(`🗑️ Deleted temp file: ${filePath}`);
                    }
                }
            } catch (error) {
                errors.push(`Failed to process temp file ${filePath}: ${error}`);
            }
        }
    } catch (error) {
        errors.push(`Failed to read temp directory: ${error}`);
    }

    return { deletedFiles, errors };
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const options: CleanupOptions = {
            dryRun: body.dryRun ?? false,
            cleanOldStructure: body.cleanOldStructure ?? true,
            cleanOrphaned: body.cleanOrphaned ?? false,
            cleanTemp: body.cleanTemp ?? true
        };

        console.log('🧹 Starting media cleanup with options:', options);

        let allDeletedFiles: string[] = [];
        let allErrors: string[] = [];

        // Clean old structure files (non-contextual uploads)
        if (options.cleanOldStructure) {
            const { deletedFiles, errors } = await cleanOldStructureFiles(options.dryRun || false);
            allDeletedFiles.push(...deletedFiles);
            allErrors.push(...errors);
        }

        // Clean orphaned files (files not referenced in database)
        if (options.cleanOrphaned) {
            const { deletedFiles, errors } = await cleanOrphanedFiles(options.dryRun || false);
            allDeletedFiles.push(...deletedFiles);
            allErrors.push(...errors);
        }

        // Clean temporary files
        if (options.cleanTemp) {
            const { deletedFiles, errors } = await cleanTempFiles(options.dryRun || false);
            allDeletedFiles.push(...deletedFiles);
            allErrors.push(...errors);
        }

        const result: CleanupResult = {
            success: allErrors.length === 0,
            deletedFiles: allDeletedFiles,
            deletedCount: allDeletedFiles.length,
            errors: allErrors,
            message: options.dryRun
                ? `Dry run complete. Would delete ${allDeletedFiles.length} files.`
                : `Cleanup complete. Deleted ${allDeletedFiles.length} files.`
        };

        console.log('✅ Media cleanup completed:', result);

        return json(result);

    } catch (error) {
        console.error('Media cleanup error:', error);
        return json({
            success: false,
            deletedFiles: [],
            deletedCount: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            message: 'Media cleanup failed'
        }, { status: 500 });
    }
};