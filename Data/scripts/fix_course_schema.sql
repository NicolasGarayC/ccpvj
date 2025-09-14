-- Script para corregir el esquema de la tabla course
-- Convertir de PascalCase a snake_case

PRAGMA foreign_keys=OFF;

-- Crear tabla temporal con esquema correcto
CREATE TABLE IF NOT EXISTS course_new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject TEXT NOT NULL,
    image_path TEXT,
    is_active INTEGER DEFAULT 1 NOT NULL,
    is_featured INTEGER DEFAULT 0 NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    educator_id TEXT NOT NULL
);

-- Migrar datos existentes
INSERT OR IGNORE INTO course_new (
    id, title, description, subject, image_path,
    is_active, is_featured, created_at, updated_at, educator_id
)
SELECT
    Id,
    Title,
    Description,
    Subject,
    COALESCE(ImagePath, image_path, '') as image_path,
    COALESCE(IsActive, 1) as is_active,
    COALESCE(IsFeatured, 0) as is_featured,
    COALESCE(CreatedAt, strftime('%s', 'now')) as created_at,
    UpdatedAt as updated_at,
    EducatorId as educator_id
FROM course
WHERE Id IS NOT NULL AND Title IS NOT NULL AND EducatorId IS NOT NULL;

-- Renombrar tablas
DROP TABLE course;
ALTER TABLE course_new RENAME TO course;

-- Verificar que se aplicaron los cambios
.schema course

PRAGMA foreign_keys=ON;