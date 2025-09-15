-- Migration: Create module_post table for enhanced content management
-- This replaces the work_item table with a more robust post system

-- Create the new module_post table
CREATE TABLE IF NOT EXISTS module_post (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT, -- Main rich text content
    image_path TEXT,
    video_path TEXT,
    audio_path TEXT, -- New field for audio content
    order_number INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    module_id TEXT NOT NULL,
    author_id TEXT NOT NULL, -- New field to track who created the post
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (module_id) REFERENCES module(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES user(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_module_post_module_id ON module_post(module_id);
CREATE INDEX IF NOT EXISTS idx_module_post_author_id ON module_post(author_id);
CREATE INDEX IF NOT EXISTS idx_module_post_order ON module_post(module_id, order_number);
CREATE INDEX IF NOT EXISTS idx_module_post_active ON module_post(is_active);

-- Migrate existing work_item data to module_post (if any exists)
INSERT INTO module_post (
    id,
    title,
    subtitle,
    content,
    image_path,
    video_path,
    audio_path,
    order_number,
    is_active,
    module_id,
    author_id,
    created_at,
    updated_at
)
SELECT
    w.id,
    w.title,
    w.description AS subtitle, -- Map description to subtitle
    w.long_text AS content,   -- Map long_text to content
    w.image_path,
    w.video_path,
    NULL AS audio_path,       -- No audio in old system
    w.order_number,
    w.is_active,
    w.module_id,
    (SELECT id FROM user WHERE role = 'administrador' LIMIT 1) AS author_id, -- Assign to first admin
    w.created_at,
    w.updated_at
FROM work_item w
WHERE NOT EXISTS (
    SELECT 1 FROM module_post mp WHERE mp.id = w.id
);

-- Create a view to maintain compatibility with old workItem queries
CREATE VIEW IF NOT EXISTS work_item_view AS
SELECT
    id,
    title,
    subtitle AS description,
    content AS long_text,
    image_path,
    video_path,
    order_number,
    is_active,
    module_id,
    created_at,
    updated_at
FROM module_post;

PRAGMA user_version = 5; -- Update schema version