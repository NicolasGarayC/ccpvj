-- =====================================================
-- CENTRO CULTURAL VÍCTOR JARA - CONTEXTUAL MULTIMEDIA SCHEMA (FIXED)
-- Multimedia files depend on content context (Courses, Blog, Events)
-- =====================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- =====================================================
-- AUTHENTICATION & USER MANAGEMENT TABLES
-- =====================================================

-- Table: user (Primary Frontend Table)
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nombre TEXT,
    apellido TEXT,
    telefono TEXT,
    role TEXT NOT NULL DEFAULT 'Estudiante',
    created_at INTEGER NOT NULL, -- Unix timestamp
    updated_at INTEGER NOT NULL  -- Unix timestamp
);

-- Table: session (Frontend Sessions)  
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL, -- Unix timestamp
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Table: Rol (User Roles)
CREATE TABLE IF NOT EXISTS Rol (
    IdRol INTEGER PRIMARY KEY AUTOINCREMENT,
    NombreRol TEXT NOT NULL,
    Descripcion TEXT
);

-- =====================================================
-- EDUCATIONAL CONTENT SYSTEM
-- =====================================================

-- Table: Course (Educational Courses - Matemáticas, Física, Sociales, Economía)
CREATE TABLE IF NOT EXISTS Course (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    Title TEXT NOT NULL,
    Description TEXT NOT NULL,
    Subject TEXT NOT NULL, -- 'Matemáticas', 'Física', 'Sociales', 'Economía'
    IsActive INTEGER NOT NULL DEFAULT 1,
    IsFeatured INTEGER NOT NULL DEFAULT 0,
    CreatedAt INTEGER NOT NULL, -- Unix timestamp
    UpdatedAt INTEGER,
    EducatorId TEXT NOT NULL,
    -- Course-specific multimedia (course thumbnail/banner)
    ImagePath TEXT, -- Course banner/thumbnail
    FOREIGN KEY (EducatorId) REFERENCES user(id) ON DELETE CASCADE
);

-- Table: Module (Course Modules/Lessons)
CREATE TABLE IF NOT EXISTS Module (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    Title TEXT NOT NULL,
    Description TEXT DEFAULT '',
    OrderNumber INTEGER NOT NULL DEFAULT 0,
    IsActive INTEGER NOT NULL DEFAULT 1,
    CreatedAt INTEGER NOT NULL, -- Unix timestamp
    UpdatedAt INTEGER,
    CourseId TEXT NOT NULL,
    FOREIGN KEY (CourseId) REFERENCES Course(Id) ON DELETE CASCADE
);

-- Table: WorkItem (Module Work Items - NEW ENTITY)
-- This is where multimedia gets attached to specific educational content
CREATE TABLE IF NOT EXISTS WorkItem (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    Title TEXT NOT NULL,
    Description TEXT,
    LongText TEXT, -- Detailed content/instructions
    OrderNumber INTEGER NOT NULL DEFAULT 0,
    IsActive INTEGER NOT NULL DEFAULT 1,
    CreatedAt INTEGER NOT NULL, -- Unix timestamp
    UpdatedAt INTEGER,
    ModuleId TEXT NOT NULL,
    -- WorkItem-specific multimedia (contextual to this work item)
    ImagePath TEXT, -- Work item illustration/diagram
    VideoPath TEXT, -- Instructional video
    FOREIGN KEY (ModuleId) REFERENCES Module(Id) ON DELETE CASCADE
);

-- =====================================================
-- BLOG & CONTENT MANAGEMENT SYSTEM
-- =====================================================

-- Table: BlogCategory
CREATE TABLE IF NOT EXISTS BlogCategory (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    Name TEXT NOT NULL UNIQUE,
    Description TEXT,
    Color TEXT DEFAULT '#6B7280',
    CreatedAt INTEGER NOT NULL
);

-- Table: BlogPost (Blog Articles with contextual multimedia)
CREATE TABLE IF NOT EXISTS BlogPost (
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
    AuthorId TEXT NOT NULL,
    CategoryId TEXT,
    -- Blog-specific multimedia (contextual to this post)
    FeaturedImagePath TEXT, -- Article featured image
    PdfPath TEXT, -- Downloadable PDF document
    VideoPath TEXT, -- Embedded video
    FOREIGN KEY (AuthorId) REFERENCES user(id),
    FOREIGN KEY (CategoryId) REFERENCES BlogCategory(Id)
);

-- =====================================================
-- EVENTS & CALENDAR SYSTEM
-- =====================================================

-- Table: Event (Cultural Events with contextual multimedia)
CREATE TABLE IF NOT EXISTS Event (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    Title TEXT NOT NULL,
    Description TEXT,
    StartDateTime INTEGER NOT NULL, -- Unix timestamp
    EndDateTime INTEGER NOT NULL, -- Unix timestamp
    Location TEXT,
    MaxAttendees INTEGER,
    CurrentAttendees INTEGER NOT NULL DEFAULT 0,
    IsActive INTEGER NOT NULL DEFAULT 1,
    RequiresRegistration INTEGER NOT NULL DEFAULT 0,
    CreatedAt INTEGER NOT NULL, -- Unix timestamp
    UpdatedAt INTEGER,
    OrganizerId TEXT NOT NULL,
    -- Event-specific multimedia (contextual to this event)
    ImagePath TEXT, -- Event poster/image
    FOREIGN KEY (OrganizerId) REFERENCES user(id)
);

-- Table: EventRegistration
CREATE TABLE IF NOT EXISTS EventRegistration (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    EventId TEXT NOT NULL,
    UserId TEXT NOT NULL,
    RegistrationDate INTEGER NOT NULL, -- Unix timestamp
    Status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled, attended
    Notes TEXT,
    FOREIGN KEY (EventId) REFERENCES Event(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE(EventId, UserId) -- Prevent duplicate registrations
);

-- =====================================================
-- MULTIMEDIA METADATA TRACKING SYSTEM
-- =====================================================

-- Table: MediaFile (File metadata - NOT independent, always linked to content)
-- This table tracks uploaded files but they MUST belong to specific content
CREATE TABLE IF NOT EXISTS MediaFile (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    FileName TEXT NOT NULL,
    RelativePath TEXT NOT NULL,
    FileSize INTEGER NOT NULL DEFAULT 0,
    MimeType TEXT NOT NULL,
    UploadedBy TEXT NOT NULL,
    UploadedAt INTEGER NOT NULL, -- Unix timestamp
    
    -- Context Information - ONE of these must be filled
    -- Determines what content this media belongs to
    ContentType TEXT NOT NULL, -- 'course', 'workitem', 'blog', 'event'
    ContentId TEXT NOT NULL, -- ID of the related content
    MediaType TEXT NOT NULL, -- 'image', 'video', 'pdf', 'audio'
    
    FOREIGN KEY (UploadedBy) REFERENCES user(id),
    -- Check constraint to ensure valid content types
    CHECK (ContentType IN ('course', 'workitem', 'blog', 'event')),
    CHECK (MediaType IN ('image', 'video', 'pdf', 'audio'))
);

-- Table: UploadStatus (Track upload progress)
CREATE TABLE IF NOT EXISTS UploadStatus (
    UploadId TEXT PRIMARY KEY, -- GUID as TEXT
    Status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, error
    ErrorMessage TEXT,
    MediaFileId INTEGER, -- References MediaFile.Id when completed
    CreatedAt INTEGER NOT NULL, -- Unix timestamp
    CompletedAt INTEGER,
    Progress REAL NOT NULL DEFAULT 0.0, -- 0-100
    FileName TEXT NOT NULL,
    UserId TEXT NOT NULL,
    -- Context for what content this upload is for
    TargetContentType TEXT NOT NULL, -- 'course', 'workitem', 'blog', 'event'
    TargetContentId TEXT NOT NULL, -- ID of the target content
    TargetMediaType TEXT NOT NULL, -- 'image', 'video', 'pdf', 'audio'
    
    FOREIGN KEY (MediaFileId) REFERENCES MediaFile(Id),
    FOREIGN KEY (UserId) REFERENCES user(id)
);

-- =====================================================
-- JWT TOKEN MANAGEMENT
-- =====================================================

-- Table: RefreshToken
CREATE TABLE IF NOT EXISTS RefreshToken (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    Token TEXT NOT NULL UNIQUE,
    ExpiresAt INTEGER NOT NULL, -- Unix timestamp
    CreatedAt INTEGER NOT NULL, -- Unix timestamp
    IsRevoked INTEGER NOT NULL DEFAULT 0,
    UserId TEXT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES user(id) ON DELETE CASCADE
);

-- Table: TokenBlacklist
CREATE TABLE IF NOT EXISTS TokenBlacklist (
    Id TEXT PRIMARY KEY, -- GUID as TEXT
    TokenJti TEXT NOT NULL UNIQUE, -- JWT ID
    ExpiresAt INTEGER NOT NULL, -- Unix timestamp
    CreatedAt INTEGER NOT NULL, -- Unix timestamp
    UserId TEXT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES user(id) ON DELETE CASCADE
);

-- =====================================================
-- INITIAL DATA INSERTION
-- =====================================================

-- Insert default roles
INSERT OR IGNORE INTO Rol (IdRol, NombreRol, Descripcion) VALUES 
(1, 'Administrador', 'Administrador del sistema con acceso completo'),
(2, 'Educador', 'Educador que puede crear y gestionar cursos'),
(3, 'Estudiante', 'Usuario estudiante con acceso a cursos'),
(4, 'Moderador', 'Moderador de contenido y eventos');

-- Insert default blog categories
INSERT OR IGNORE INTO BlogCategory (Id, Name, Description, Color, CreatedAt) VALUES 
('cat_noticias', 'Noticias', 'Noticias del centro cultural', '#3B82F6', strftime('%s', 'now')),
('cat_talleres', 'Talleres', 'Información sobre talleres y cursos', '#10B981', strftime('%s', 'now')),
('cat_eventos', 'Eventos', 'Eventos y actividades especiales', '#8B5CF6', strftime('%s', 'now')),
('cat_comunidad', 'Comunidad', 'Historias y contenido de la comunidad', '#F59E0B', strftime('%s', 'now'));

-- =====================================================
-- INDEXES FOR PERFORMANCE (CREATED AFTER TABLES)
-- =====================================================

-- Authentication indexes
CREATE INDEX IF NOT EXISTS idx_user_username ON user(username);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON session(expires_at);

-- Educational content indexes
CREATE INDEX IF NOT EXISTS idx_course_educator ON Course(EducatorId);
CREATE INDEX IF NOT EXISTS idx_course_subject ON Course(Subject);
CREATE INDEX IF NOT EXISTS idx_course_active ON Course(IsActive);
CREATE INDEX IF NOT EXISTS idx_module_course ON Module(CourseId);
CREATE INDEX IF NOT EXISTS idx_module_order ON Module(CourseId, OrderNumber);
CREATE INDEX IF NOT EXISTS idx_workitem_module ON WorkItem(ModuleId);
CREATE INDEX IF NOT EXISTS idx_workitem_order ON WorkItem(ModuleId, OrderNumber);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_blog_author ON BlogPost(AuthorId);
CREATE INDEX IF NOT EXISTS idx_blog_category ON BlogPost(CategoryId);
CREATE INDEX IF NOT EXISTS idx_blog_published ON BlogPost(IsPublished);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON BlogPost(Slug);

-- Event indexes
CREATE INDEX IF NOT EXISTS idx_event_organizer ON Event(OrganizerId);
CREATE INDEX IF NOT EXISTS idx_event_start_time ON Event(StartDateTime);
CREATE INDEX IF NOT EXISTS idx_event_active ON Event(IsActive);
CREATE INDEX IF NOT EXISTS idx_event_registration ON EventRegistration(EventId, UserId);

-- Media indexes (contextual)
CREATE INDEX IF NOT EXISTS idx_media_content ON MediaFile(ContentType, ContentId);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON MediaFile(UploadedBy);
CREATE INDEX IF NOT EXISTS idx_media_type ON MediaFile(MediaType);
CREATE INDEX IF NOT EXISTS idx_upload_status ON UploadStatus(Status);
CREATE INDEX IF NOT EXISTS idx_upload_target ON UploadStatus(TargetContentType, TargetContentId);

-- Token indexes
CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON RefreshToken(UserId);
CREATE INDEX IF NOT EXISTS idx_refresh_token_expires ON RefreshToken(ExpiresAt);
CREATE INDEX IF NOT EXISTS idx_blacklist_token ON TokenBlacklist(TokenJti);
CREATE INDEX IF NOT EXISTS idx_blacklist_expires ON TokenBlacklist(ExpiresAt);

-- =====================================================
-- VIEWS FOR CONTEXTUAL QUERIES
-- =====================================================

-- View: CourseWithMedia
-- Get courses with their multimedia
CREATE VIEW IF NOT EXISTS CourseWithMedia AS
SELECT 
    c.Id,
    c.Title,
    c.Description,
    c.Subject,
    c.ImagePath as CourseImage,
    u.username as EducatorUsername,
    u.nombre as EducatorName,
    (SELECT COUNT(*) FROM Module WHERE CourseId = c.Id AND IsActive = 1) as ModuleCount,
    (SELECT COUNT(*) FROM MediaFile WHERE ContentType = 'course' AND ContentId = c.Id) as MediaFileCount
FROM Course c
JOIN user u ON c.EducatorId = u.id
WHERE c.IsActive = 1;

-- View: WorkItemWithMedia
-- Get work items with their multimedia
CREATE VIEW IF NOT EXISTS WorkItemWithMedia AS
SELECT 
    wi.Id,
    wi.Title,
    wi.Description,
    wi.LongText,
    wi.ImagePath,
    wi.VideoPath,
    wi.OrderNumber,
    m.Title as ModuleName,
    c.Title as CourseName,
    c.Subject,
    (SELECT COUNT(*) FROM MediaFile WHERE ContentType = 'workitem' AND ContentId = wi.Id) as MediaFileCount
FROM WorkItem wi
JOIN Module m ON wi.ModuleId = m.Id
JOIN Course c ON m.CourseId = c.Id
WHERE wi.IsActive = 1 AND m.IsActive = 1 AND c.IsActive = 1
ORDER BY c.Title, m.OrderNumber, wi.OrderNumber;

-- View: BlogPostWithMedia  
-- Get blog posts with their multimedia
CREATE VIEW IF NOT EXISTS BlogPostWithMedia AS
SELECT 
    bp.Id,
    bp.Title,
    bp.Content,
    bp.Summary,
    bp.Slug,
    bp.FeaturedImagePath,
    bp.PdfPath,
    bp.VideoPath,
    bp.IsPublished,
    bp.Views,
    u.username as AuthorUsername,
    u.nombre as AuthorName,
    bc.Name as CategoryName,
    bc.Color as CategoryColor,
    (SELECT COUNT(*) FROM MediaFile WHERE ContentType = 'blog' AND ContentId = bp.Id) as MediaFileCount
FROM BlogPost bp
JOIN user u ON bp.AuthorId = u.id
LEFT JOIN BlogCategory bc ON bp.CategoryId = bc.Id
WHERE bp.IsPublished = 1
ORDER BY bp.PublishedAt DESC;

-- View: EventWithMedia
-- Get events with their multimedia
CREATE VIEW IF NOT EXISTS EventWithMedia AS
SELECT 
    e.Id,
    e.Title,
    e.Description,
    e.ImagePath,
    e.StartDateTime,
    e.EndDateTime,
    e.Location,
    e.MaxAttendees,
    e.CurrentAttendees,
    u.username as OrganizerUsername,
    u.nombre as OrganizerName,
    (SELECT COUNT(*) FROM MediaFile WHERE ContentType = 'event' AND ContentId = e.Id) as MediaFileCount
FROM Event e
JOIN user u ON e.OrganizerId = u.id
WHERE e.IsActive = 1
ORDER BY e.StartDateTime;

-- =====================================================
-- END OF CONTEXTUAL MULTIMEDIA SCHEMA
-- =====================================================