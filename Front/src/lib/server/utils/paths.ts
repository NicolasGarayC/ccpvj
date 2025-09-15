import path from 'path';

/**
 * Obtiene la ruta base del proyecto desde la variable de entorno PROJECT_ROOT
 * Por defecto usa 'D:' en desarrollo para Windows
 * En producción se puede configurar como '/var/www', '/home/user', etc.
 */
export function getProjectRoot(): string {
	const projectRoot = process.env.PROJECT_ROOT || 'D:';
	return projectRoot;
}

/**
 * Construye la ruta completa a la carpeta de medios
 * Estructura: PROJECT_ROOT/ccpvj/Data/var/www/media
 */
export function getMediaBasePath(): string {
	const projectRoot = getProjectRoot();
	return path.join(projectRoot, 'ccpvj', 'Data', 'var', 'www', 'media');
}

/**
 * Construye la ruta completa a un directorio específico de medios
 * @param mediaType - Tipo de media: 'image', 'video', 'audio', 'library', etc.
 */
export function getMediaDirectory(mediaType: string): string {
	const basePath = getMediaBasePath();
	return path.join(basePath, mediaType);
}

/**
 * Construye la ruta completa a la base de datos
 */
export function getDatabasePath(): string {
	const projectRoot = getProjectRoot();
	return path.join(projectRoot, 'ccpvj', 'Data', 'ccpvj.db');
}

/**
 * Construye rutas de archivos legacy para cleanup (rutas anteriores con static/)
 * @param filePath - Ruta relativa del archivo
 */
export function getLegacyFilePath(filePath: string): string {
	return path.join(process.cwd(), 'static', filePath);
}