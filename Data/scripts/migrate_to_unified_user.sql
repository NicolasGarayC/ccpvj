-- Migration script to consolidate dual user architecture
-- Establishes 'user' table as single source of truth

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS Course_backup AS SELECT * FROM Course;
CREATE TABLE IF NOT EXISTS BlogPost_backup AS SELECT * FROM BlogPost;
CREATE TABLE IF NOT EXISTS Event_backup AS SELECT * FROM Event;

-- Step 2: Update Course table structure
-- Drop and recreate Course with proper TEXT foreign key
DROP TABLE Course;
CREATE TABLE Course (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    Title TEXT NOT NULL,
    Description TEXT NOT NULL,
    Subject TEXT NOT NULL, -- 'Matemáticas', 'Física', 'Sociales', 'Economía'
    IsActive INTEGER NOT NULL DEFAULT 1,
    IsFeatured INTEGER NOT NULL DEFAULT 0,
    CreatedAt INTEGER NOT NULL, -- Unix timestamp
    UpdatedAt INTEGER,
    EducatorId TEXT NOT NULL, -- Changed from INTEGER to TEXT
    -- Course-specific multimedia (course thumbnail/banner)
    ImagePath TEXT, -- Course banner/thumbnail
    FOREIGN KEY (EducatorId) REFERENCES user(id) ON DELETE CASCADE
);

-- Recreate indexes
CREATE INDEX idx_course_educator ON Course(EducatorId);
CREATE INDEX idx_course_subject ON Course(Subject);
CREATE INDEX idx_course_active ON Course(IsActive);

-- Step 3: Update BlogPost table structure
DROP TABLE BlogPost;
CREATE TABLE BlogPost (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    Title TEXT NOT NULL,
    Content TEXT NOT NULL, -- Main text content
    Summary TEXT,
    Slug TEXT NOT NULL UNIQUE,
    IsPublished INTEGER NOT NULL DEFAULT 0,
    IsFeatured INTEGER NOT NULL DEFAULT 0,
    Views INTEGER NOT NULL DEFAULT 0,
    CreatedAt INTEGER NOT NULL, -- Unix timestamp
    UpdatedAt INTEGER,
    PublishedAt INTEGER,
    AuthorId TEXT NOT NULL, -- Changed from INTEGER to TEXT
    CategoryId TEXT,
    -- Blog-specific multimedia (contextual to this post)
    FeaturedImagePath TEXT, -- Article featured image
    PdfPath TEXT, -- Downloadable PDF document
    VideoPath TEXT, -- Embedded video
    FOREIGN KEY (AuthorId) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (CategoryId) REFERENCES BlogCategory(Id)
);

-- Recreate BlogPost indexes
CREATE INDEX idx_blog_author ON BlogPost(AuthorId);
CREATE INDEX idx_blog_category ON BlogPost(CategoryId);
CREATE INDEX idx_blog_published ON BlogPost(IsPublished);
CREATE INDEX idx_blog_slug ON BlogPost(Slug);

-- Step 4: Update Event table structure
DROP TABLE Event;
CREATE TABLE Event (
    Id TEXT PRIMARY KEY,
    Title TEXT NOT NULL,
    Description TEXT,
    StartDateTime INTEGER NOT NULL, -- Unix timestamp
    EndDateTime INTEGER,
    IsAllDay INTEGER NOT NULL DEFAULT 0,
    Location TEXT,
    EventType TEXT NOT NULL DEFAULT 'General',
    IsActive INTEGER NOT NULL DEFAULT 1,
    IsFeatured INTEGER NOT NULL DEFAULT 0,
    MaxAttendees INTEGER,
    CurrentAttendees INTEGER NOT NULL DEFAULT 0,
    RequiresRegistration INTEGER NOT NULL DEFAULT 0,
    RegistrationDeadline INTEGER,
    ImagePath TEXT,
    PdfPath TEXT,
    
    -- Recurring events
    IsRecurring INTEGER NOT NULL DEFAULT 0,
    RecurrencePattern TEXT,
    RecurrenceInterval INTEGER DEFAULT 1,
    RecurrenceEndDate INTEGER,
    RecurrenceDaysOfWeek TEXT,
    
    -- Related content references
    RelatedCourseId TEXT,
    RelatedBlogPostId TEXT,
    
    CreatedAt INTEGER NOT NULL,
    UpdatedAt INTEGER,
    OrganizerId TEXT NOT NULL, -- Changed from INTEGER to TEXT
    
    FOREIGN KEY (OrganizerId) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (RelatedCourseId) REFERENCES Course(Id),
    FOREIGN KEY (RelatedBlogPostId) REFERENCES BlogPost(Id)
);

-- Step 5: Update MediaFile table to use proper user references
UPDATE MediaFile SET UploadedBy = 'admin' WHERE UploadedBy NOT IN (SELECT id FROM user);

-- Step 6: Enable foreign key constraints permanently
PRAGMA foreign_keys = ON;

-- Step 7: Clean up backup tables after confirming migration success
-- DROP TABLE Course_backup;
-- DROP TABLE BlogPost_backup;
-- DROP TABLE Event_backup;

-- Migration completed - user table is now the single source of truth