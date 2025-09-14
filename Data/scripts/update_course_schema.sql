-- Update course table to add subject column if it doesn't exist
-- Check if subject column exists and add it if not
PRAGMA table_info(course);

-- Add subject column to course table if it doesn't exist
ALTER TABLE course ADD COLUMN subject TEXT;

-- Update any existing courses to have a default subject
UPDATE course SET subject = 'General' WHERE subject IS NULL;

-- Create module table if it doesn't exist
CREATE TABLE IF NOT EXISTS module (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    course_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (course_id) REFERENCES course (id) ON DELETE CASCADE
);

-- Create work_item table if it doesn't exist
CREATE TABLE IF NOT EXISTS work_item (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    long_text TEXT,
    image_path TEXT,
    video_path TEXT,
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    module_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (module_id) REFERENCES module (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_module_course_id ON module (course_id);
CREATE INDEX IF NOT EXISTS idx_module_order ON module (course_id, order_number);
CREATE INDEX IF NOT EXISTS idx_work_item_module_id ON work_item (module_id);
CREATE INDEX IF NOT EXISTS idx_work_item_order ON work_item (module_id, order_number);

-- Verify the schema
SELECT 'course' as table_name, sql FROM sqlite_master WHERE type='table' AND name='course'
UNION ALL
SELECT 'module' as table_name, sql FROM sqlite_master WHERE type='table' AND name='module'
UNION ALL
SELECT 'work_item' as table_name, sql FROM sqlite_master WHERE type='table' AND name='work_item';