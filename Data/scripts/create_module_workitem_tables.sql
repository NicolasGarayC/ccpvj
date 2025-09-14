-- Script para crear/migrar las tablas module y work_item

PRAGMA foreign_keys=OFF;

-- Crear tabla module si no existe
CREATE TABLE IF NOT EXISTS module (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    course_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (course_id) REFERENCES course (id) ON DELETE CASCADE
);

-- Crear tabla work_item si no existe
CREATE TABLE IF NOT EXISTS work_item (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    long_text TEXT,
    image_path TEXT,
    video_path TEXT,
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    module_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (module_id) REFERENCES module (id) ON DELETE CASCADE
);

-- Verificar esquemas
.schema module
.schema work_item

PRAGMA foreign_keys=ON;