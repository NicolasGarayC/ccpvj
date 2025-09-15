-- Migración: Crear sistema de elementos dinámicos para posts
-- Permite múltiples elementos multimedia ordenables por post

-- Crear tabla para elementos de posts
CREATE TABLE IF NOT EXISTS post_element (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    element_type TEXT NOT NULL, -- 'title', 'text', 'image', 'video', 'audio'
    content TEXT, -- Para título y texto
    file_path TEXT, -- Para archivos multimedia
    file_name TEXT, -- Nombre original del archivo
    file_size INTEGER, -- Tamaño del archivo en bytes
    mime_type TEXT, -- Tipo MIME del archivo
    order_number INTEGER NOT NULL, -- Orden dentro del post
    metadata TEXT, -- JSON para datos adicionales (alt text, caption, etc.)
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (post_id) REFERENCES module_post(id) ON DELETE CASCADE
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_post_element_post_id ON post_element(post_id);
CREATE INDEX IF NOT EXISTS idx_post_element_type ON post_element(element_type);
CREATE INDEX IF NOT EXISTS idx_post_element_order ON post_element(post_id, order_number);
CREATE INDEX IF NOT EXISTS idx_post_element_active ON post_element(is_active);

-- Migrar datos existentes de module_post a post_element
-- Solo si existen posts con contenido
INSERT INTO post_element (
    id,
    post_id,
    element_type,
    content,
    file_path,
    order_number,
    is_active,
    created_at,
    updated_at
)
SELECT
    -- Crear elementos de título
    'title_' || mp.id,
    mp.id,
    'title',
    mp.title,
    NULL,
    1, -- Título siempre es primer elemento
    1,
    mp.created_at,
    mp.updated_at
FROM module_post mp
WHERE mp.title IS NOT NULL
UNION ALL
SELECT
    -- Crear elementos de subtítulo
    'subtitle_' || mp.id,
    mp.id,
    'text',
    mp.subtitle,
    NULL,
    2, -- Subtítulo como segundo elemento
    1,
    mp.created_at,
    mp.updated_at
FROM module_post mp
WHERE mp.subtitle IS NOT NULL
UNION ALL
SELECT
    -- Crear elementos de contenido de texto
    'content_' || mp.id,
    mp.id,
    'text',
    mp.content,
    NULL,
    3, -- Contenido de texto como tercer elemento
    1,
    mp.created_at,
    mp.updated_at
FROM module_post mp
WHERE mp.content IS NOT NULL
UNION ALL
SELECT
    -- Crear elementos de imagen
    'image_' || mp.id,
    mp.id,
    'image',
    NULL,
    mp.image_path,
    4, -- Imagen como cuarto elemento
    1,
    mp.created_at,
    mp.updated_at
FROM module_post mp
WHERE mp.image_path IS NOT NULL
UNION ALL
SELECT
    -- Crear elementos de video
    'video_' || mp.id,
    mp.id,
    'video',
    NULL,
    mp.video_path,
    5, -- Video como quinto elemento
    1,
    mp.created_at,
    mp.updated_at
FROM module_post mp
WHERE mp.video_path IS NOT NULL
UNION ALL
SELECT
    -- Crear elementos de audio
    'audio_' || mp.id,
    mp.id,
    'audio',
    NULL,
    mp.audio_path,
    6, -- Audio como sexto elemento
    1,
    mp.created_at,
    mp.updated_at
FROM module_post mp
WHERE mp.audio_path IS NOT NULL;

-- Actualizar la versión del esquema
PRAGMA user_version = 6;