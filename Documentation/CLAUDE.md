# CLAUDE.md

This file provides technical context to Claude Code when working with this repository.

## Project Technical Overview

**Centro Cultural Víctor Jara** - SvelteKit 5 web platform for community cultural center (Bogotá).
**Current Status**: ✅ COURSES MODULE CORRECTED - Blog, Events, Library modules need same corrections.

**Key Architectural Concept**: Contextual multimedia (no independent files - all media belongs to specific content).

## Technology Stack

- **Frontend**: SvelteKit 5 + TypeScript + Tailwind CSS + Drizzle ORM
- **Database**: SQLite (`D:/ccpvj/Data/ccpvj.db`)
- **Backend**: Optional .NET 8 (mostly unused)
- **Authentication**: Cookie-based sessions (SvelteKit primary)

## Development Commands

### Frontend (Primary)
```bash
cd Front/
npm run dev              # Start development server (http://localhost:5173)
npm run build            # Production build
npm run check            # TypeScript checks
npm run db:studio        # Drizzle Studio database GUI
npm run db:push          # Update database schema
```

### Database
```bash
# SQLite database located at: D:/ccpvj/Data/ccpvj.db
# Environment: DATABASE_URL="file:D:/ccpvj/Data/ccpvj.db"
```

## Project Structure

```
Front/src/
├── routes/                    # SvelteKit routes + API endpoints
│   ├── api/courses/          # ⚠️ Course APIs (have errors)
│   ├── auth/login/           # ⚠️ Login page (auth issues)
│   └── courses/              # ⚠️ Course pages (backend fails)
├── lib/
│   ├── components/           # Svelte components (visual only)
│   ├── services/             # ⚠️ API services (connection errors)
│   └── server/               # Database + auth logic
│
Data/
├── ccpvj.db                  # SQLite database (connection issues)
└── scripts/                  # Database setup scripts
```

## Database Schema (SQLite)

**Important**: Foreign keys enabled with `PRAGMA foreign_keys = ON`

### Core Tables
```sql
-- Authentication
user (id TEXT, username TEXT, password_hash TEXT, role TEXT)
session (id TEXT, user_id TEXT, expires_at INTEGER)

-- Educational System
course (id TEXT, title TEXT, subject TEXT, educator_id TEXT, ...)
module (id TEXT, course_id TEXT, title TEXT, order_number INTEGER, ...)
work_item (id TEXT, module_id TEXT, title TEXT, long_text TEXT, image_path TEXT, video_path TEXT, ...)
```

## Current Technical Issues

### ✅ Working Modules (COURSES CORRECTED + DELETE CASCADE FIXED)
- **Course System**: ✅ Backend entities, services, DTOs completely corrected
- **DELETE Operations**: ✅ Cascade deletion with multimedia cleanup implemented
- **Authentication**: ✅ Session management working
- **Database**: ✅ SQLite connection stable, foreign keys enabled
- **Role System**: ✅ Unified roles (asistente, colaborador, administrador)
- **Multimedia System**: ✅ Upload/serving/cleanup system fully implemented
- **File Cleanup**: ✅ Automatic cleanup on replace/delete operations

### ⚠️ CRITICAL: Modules Need Same Corrections as Courses
**URGENTE**: Apply identical corrections pattern to other modules:

#### **🚨 Blog System Module**
- **Status**: ❌ NEEDS SAME FIXES AS COURSES
- **Backend**: BlogPost entity likely missing `[Table]` and `[Column]` attributes
- **Services**: BlogService probably has DateTime/unix timestamp inconsistencies
- **DTOs**: Conversion errors similar to courses (DateTime.FromBinary() issues)
- **Required**: Same mapping and date conversion fixes applied to courses

#### **🚨 Events System Module**
- **Status**: ❌ NEEDS SAME FIXES AS COURSES
- **Backend**: Event entity likely missing database mapping attributes
- **Services**: EventService probably has date handling inconsistencies
- **DTOs**: Same unix timestamp conversion issues
- **Required**: Apply same pattern as CourseService corrections

#### **🚨 Library/Media System Module**
- **Status**: ❌ NEEDS SAME FIXES AS COURSES
- **Backend**: MediaFile entity may need mapping corrections
- **Services**: Media services may have date/author inconsistencies
- **DTOs**: Same pattern of conversion errors expected
- **Required**: Same corrections as applied to WorkItem entity

### 🔧 Recently Fixed (COURSES MODULE COMPLETE)
- **Course Entity**: ✅ Added missing `[Table("course")]` and `[Column]` attributes
- **CourseService**: ✅ Fixed `DateTime.FromBinary()` → `DateTimeOffset.FromUnixTimeSeconds()`
- **WorkItem Entity**: ✅ Changed `UpdatedAt`: DateTime → long, `AuthorId`: int → string
- **WorkItemService**: ✅ Replaced `DateTime.UtcNow` with unix timestamps
- **DTOs**: ✅ Fixed all date conversions between unix timestamps and DateTime
- **DELETE Operations**: ✅ Implemented complete cascade deletion with multimedia cleanup

#### **🗑️ DELETE CASCADE HIERARCHY (FIXED)**
```
Course → Modules → Posts → Multimedia Files
  ├── Course.DeleteCourseAsync(): Deletes all modules, posts, and media
  ├── Module.DeleteModuleAsync(): Deletes all posts and media in module
  └── Post.DeleteWorkItemAsync(): Deletes post and its media files
```

**Key DELETE Features Implemented:**
- ✅ **Complete cascade deletion**: Course → Module → Post → Media
- ✅ **Multimedia cleanup**: Physical files deleted after DB commit
- ✅ **Transaction safety**: DB changes committed before file deletion
- ✅ **Error resilience**: Failed file deletions don't break process
- ✅ **Explicit ordering**: No reliance on DB foreign key cascade
- ✅ **Logging**: Detailed logs for troubleshooting

## API Endpoints Status

**✅ Course APIs** (functional + DELETE cascade):
- `GET/POST /api/courses` - ✅ Working with unified schema
- `GET /api/courses/all` - ✅ Returns course list with educator info
- `GET /api/courses/featured` - ✅ Functional
- `GET /api/courses/subjects` - ✅ Returns available subjects
- `GET /api/courses/[id]` - ✅ Course details with modules
- `POST /api/courses/modules` - ✅ Module creation working
- `POST /api/courses/workitems` - ✅ WorkItem creation working
- `PUT/DELETE` endpoints - ✅ With proper role validation
- `DELETE /api/courses/[id]` - ✅ **CASCADE DELETE** with multimedia cleanup
- `DELETE /api/courses/modules/[id]` - ✅ **CASCADE DELETE** with multimedia cleanup
- `DELETE /api/courses/workitems/[id]` - ✅ **HARD DELETE** with multimedia cleanup

**✅ Upload APIs** (implemented with nginx compatibility):
- `POST /api/upload/images` - ✅ Image upload with auto-cleanup (20MB direct, 50MB nginx)
  - **Formats**: JPG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF
- `POST /api/upload/videos` - ✅ Video upload with auto-cleanup (500MB direct, 5GB nginx)
  - **Formats**: MP4, WebM, AVI, MOV
- `POST /api/upload/audio` - ✅ Audio upload with auto-cleanup (100MB direct, 500MB nginx)
  - **Formats**: MP3, WAV, OGG, M4A
- `POST /api/upload/documents` - ✅ Document upload with auto-cleanup (100MB)
  - **Formats**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- `GET /media/[...path]` - ✅ Static file serving for development
- `POST /api/cleanup` - ✅ Manual cleanup endpoint (admin only)
- `GET /api/cleanup` - ✅ Cleanup statistics endpoint

**✅ Auth APIs** (working):
- `POST /api/auth/login` - ✅ Session management working
- `POST /api/auth/logout` - ✅ Session cleanup working
- `GET /api/auth/me` - ✅ User info retrieval

## Development Priorities

### 🚨 **URGENT: Apply Same Corrections to Other Modules**

1. **Blog System Backend Corrections** - SAME PATTERN AS COURSES:
   - Fix BlogPost entity mapping attributes
   - Correct BlogService date conversions
   - Update DTOs with proper unix timestamp handling

2. **Events System Backend Corrections** - SAME PATTERN AS COURSES:
   - Fix Event entity mapping attributes
   - Correct EventService date conversions
   - Update DTOs with proper unix timestamp handling

3. **Library/Media System Backend Corrections** - SAME PATTERN AS COURSES:
   - Fix MediaFile entity mapping attributes
   - Correct media services date conversions
   - Update DTOs with proper unix timestamp handling

### 🔄 **Secondary Priorities (After Backend Corrections)**
4. **Testing coverage** - Add comprehensive tests
5. **Frontend-backend integration** - Connect remaining components
6. **Performance optimization** - Cache and optimize queries

## 🎥 **DEFINITIVE MULTIMEDIA SYSTEM** (September 2025)

### ✅ **Status: FULLY IMPLEMENTED WITH GENERIC STRUCTURE**

**CRITICAL**: This is the FINAL media structure. DO NOT change without extreme justification.

### 🏗️ **DEFINITIVE Generic Media Structure**

```
Data/media/
├── content/                          # All application content
│   ├── courses/                      # Educational content
│   │   └── {course-id}/
│   │       ├── banner.{ext}          # Course banner image
│   │       └── modules/
│   │           └── {module-id}/
│   │               └── posts/
│   │                   └── {post-id}/
│   │                       ├── images/
│   │                       ├── videos/
│   │                       └── audio/
│   ├── blog/                         # Blog system
│   │   └── posts/
│   │       └── {post-id}/
│   │           ├── featured-image.{ext}
│   │           ├── images/
│   │           ├── videos/
│   │           └── documents/
│   ├── library/                      # Library/Resources
│   │   └── resources/
│   │       └── {resource-id}/
│   │           ├── cover.{ext}
│   │           ├── documents/       # PDFs, docs, etc
│   │           └── media/           # Images, videos
│   └── events/                       # Events system
│       └── {event-id}/
│           ├── poster.{ext}
│           └── gallery/
├── user-content/                     # User-generated content
│   └── profiles/
│       └── {user-id}/
│           └── avatar.{ext}
└── system/                           # System files
    ├── assets/                       # Static assets
    └── temp/                         # Temporary uploads
        ├── images/
        ├── videos/
        ├── audio/
        └── documents/
```

### 🎯 **Structure Benefits**
- **Scalable**: Easy to add new content types
- **Organized**: Clear separation by context
- **Maintainable**: Each module manages its own files
- **Clean**: Automatic cleanup per content type
- **Flexible**: Allows different internal structures

### 📡 **DEFINITIVE API Endpoints**

#### **Content Upload APIs**
```typescript
// Educational Content
POST /api/upload/content/courses/{courseId}/banner
POST /api/upload/content/courses/{courseId}/modules/{moduleId}/posts/{postId}/{mediaType}

// Blog Content
POST /api/upload/content/blog/posts/{postId}/featured
POST /api/upload/content/blog/posts/{postId}/{mediaType}

// Library Content
POST /api/upload/content/library/resources/{resourceId}/cover
POST /api/upload/content/library/resources/{resourceId}/{mediaType}

// Events Content
POST /api/upload/content/events/{eventId}/poster
POST /api/upload/content/events/{eventId}/gallery

// User Content
POST /api/upload/user-content/profiles/{userId}/avatar

// System Cleanup
POST /api/cleanup/media
```

#### **File Serving**
```typescript
GET /media/{path}  // Universal file serving for all content types
```

### 🔒 **CRITICAL IMPLEMENTATION RULES**

#### **Rule 1: Context Validation**
```typescript
// ALWAYS validate that the content exists before allowing upload
if (!await validateContentExists(contentType, contentId)) {
    throw new Error('Content does not exist');
}
```

#### **Rule 2: Automatic Cleanup**
```typescript
// ALWAYS clean up old files when uploading new ones
if (oldFilePath) {
    await cleanupOldFile(oldFilePath);
}
```

#### **Rule 3: Path Construction**
```typescript
// ALWAYS use this pattern for path construction
const relativePath = `content/${contentType}/${contentId}/${mediaType}/${filename}`;
```

#### **Rule 4: File Naming**
```typescript
// ALWAYS use timestamp + sanitized original name
const filename = `${sanitizedName}_${timestamp}${extension}`;
```

### 📋 **File Format Validation**

**File validation is implemented at multiple levels:**

#### **🖼️ Image Formats** (20MB direct / 50MB nginx)
```typescript
const validImageTypes = [
  'image/jpeg',      // JPG/JPEG files
  'image/png',       // PNG with transparency
  'image/gif',       // Animated GIFs
  'image/webp',      // Modern web format
  'image/svg+xml',   // Vector graphics
  'image/avif',      // High-efficiency format
  'image/bmp',       // Bitmap format
  'image/tiff'       // High-quality format
];
```

#### **🎥 Video Formats** (500MB direct / 5GB nginx)
```typescript
const validVideoTypes = [
  'video/mp4',       // Universal web format
  'video/webm',      // Open web format
  'video/avi',       // Traditional format
  'video/mov'        // QuickTime format
];
```

#### **🎵 Audio Formats** (100MB direct / 500MB nginx)
```typescript
const validAudioTypes = [
  'audio/mp3',       // Universal compressed
  'audio/wav',       // Uncompressed quality
  'audio/ogg',       // Open format
  'audio/m4a'        // AAC high-quality
];
```

#### **📄 Document Formats** (100MB)
```typescript
const validDocumentTypes = [
  'application/pdf',                                                               // PDF documents
  'application/msword',                                                           // Word .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',    // Word .docx
  'application/vnd.ms-excel',                                                     // Excel .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',          // Excel .xlsx
  'application/vnd.ms-powerpoint',                                               // PowerPoint .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',  // PowerPoint .pptx
  'text/plain'                                                                   // Text files
];
```

### 🛠️ **Cleanup Utilities**
```typescript
// Available in: Front/src/lib/server/utils/mediaCleanup.ts
import { deleteMediaFile, deleteMediaFiles, replaceMediaFile } from '$lib/server/utils/mediaCleanup';
```

## Key Files to Focus On

### Database & Schema
- `Front/src/lib/server/db/index.ts` - Database connection (has issues)
- `Front/src/lib/server/db/schema.ts` - Table definitions (correct)
- `Front/.env` - Database URL config

### Services (Problematic)
- `Front/src/lib/services/courseService.ts` - Course API calls (fail)
- `Front/src/lib/services/authService.js` - Auth service (buggy)

### APIs (Need Debugging)
- `Front/src/routes/api/courses/+server.ts` - Main course API
- `Front/src/routes/api/auth/` - Authentication endpoints

### Frontend Pages
- `Front/src/routes/courses/+page.svelte` - Course listing (visual works, data fails)
- `Front/src/routes/+page.svelte` - Homepage (works visually)

## Testing & Debugging Notes

- **Database**: Use `npm run db:studio` to inspect SQLite data
- **Dev Server**: `npm run dev` starts at http://localhost:5173
- **Logs**: Check browser console + terminal for errors
- **Database File**: Located at `D:/ccpvj/Data/ccpvj.db` (278KB)

## Important Context for Development

- **No Independent Media**: All files must belong to specific content (courses, blog posts, etc.)
- **Offline-First**: Designed for local network use (mesh networking)
- **Spanish/English**: Bilingual interface planned
- **Community Focus**: Built for cultural center in Bogotá

## 🚨 **CRITICAL DATABASE WARNINGS**

### **⚠️ DO NOT CREATE DUPLICATE TABLES/COLUMNS**

**BEFORE creating ANY table or column, ALWAYS:**

1. **Check existing tables**: Use `sqlite3 ccpvj.db ".tables"` to see all tables
2. **Check table structure**: Use `PRAGMA table_info(table_name)` to see columns
3. **Check BOTH naming conventions**: Look for both `table_name` AND `TableName`
4. **Evaluate existing tables**: Can an existing table serve the purpose?

### **Known Coexisting Tables (DO NOT DUPLICATE)**
- `course` (Drizzle) & `Course` (legacy) - USE `course`
- `module` (Drizzle) & `Module` (.NET) - USE `module`
- `work_item` (Drizzle) & `WorkItem` (.NET) - USE `work_item`
- `MediaFile` & `MediaEntity` - USE `MediaFile`

### **Role Validation Rules**
- **Database roles**: `asistente`, `colaborador`, `administrador` (lowercase ONLY)
- **Code validation**: NEVER use `Colaborador` or `Administrador` (uppercase)
- **User role field**: Always use `user.role` not `user.nombreRol`

### **Schema Priority**
- **Primary**: Drizzle schema (lowercase, snake_case)
- **Secondary**: .NET schema (PascalCase) - legacy compatibility only

**⚠️ Current Status**: COURSES module corrected, other modules need identical fixes.

---

## 🏗️ **COURSE SYSTEM HIERARCHICAL RELATIONSHIP**

### **Data Model Hierarchy**
```
Course (1) ─── has many ──→ Module (n) ─── has many ──→ WorkItem/Post (n)
   │                           │                          │
   │                           │                          ├── ImagePath (media file)
   │                           │                          ├── VideoPath (media file)
   │                           │                          └── AudioPath (media file)
   │                           │
   │                           └── (no media in current schema)
   │
   └── ImagePath (media file)
```

### **Critical Relationship Rules**
1. **Each Course** can have multiple Modules
2. **Each Module** belongs to exactly one Course and can have multiple Posts
3. **Each Post** belongs to exactly one Module and can have multiple media files
4. **Media Files** are tied to specific content (Course banners, Post multimedia)

### **DELETE Operation Requirements (IMPLEMENTED)**
- **DELETE Course**: Must delete all its Modules, all Posts in those Modules, and ALL multimedia files
- **DELETE Module**: Must delete all its Posts and ALL multimedia files in those Posts
- **DELETE Post**: Must delete ALL its multimedia files

### **Database Tables Used**
- **Primary**: `course` (Drizzle schema - snake_case)
- **Secondary**: `module` (Drizzle schema - snake_case)
- **Posts**: `ModulePosts` (Entity Framework mapping to work_item table)
- **Legacy**: `Course`, `Module`, `WorkItem` (.NET schema - PascalCase) - available but not primary

---

## 🔧 **SPECIFIC CORRECTIONS APPLIED TO COURSES (September 2025)**

### **Pattern to Replicate in Other Modules**

#### **1. Entity Mapping Issues Fixed**
```csharp
// BEFORE (broken):
public class Course
{
    public string Id { get; set; }    // Missing mapping attributes
    public string Title { get; set; } // No database column mapping
}

// AFTER (fixed):
[Table("course")]
public class Course
{
    [Column("id")]
    public string Id { get; set; }

    [Column("title")]
    public string Title { get; set; }

    [Column("created_at")]
    public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
}
```

#### **2. Service Date Conversion Issues Fixed**
```csharp
// BEFORE (broken):
CreatedAt = DateTime.FromBinary(course.CreatedAt),  // INCORRECT

// AFTER (fixed):
CreatedAt = DateTimeOffset.FromUnixTimeSeconds(course.CreatedAt).DateTime,
UpdatedAt = course.UpdatedAt.HasValue
    ? DateTimeOffset.FromUnixTimeSeconds(course.UpdatedAt.Value).DateTime
    : null,
```

#### **3. Data Type Inconsistencies Fixed**
```csharp
// BEFORE (broken):
public DateTime? UpdatedAt { get; set; }  // Should be unix timestamp
public int AuthorId { get; set; }         // Should be string

// AFTER (fixed):
[Column("updated_at")]
public long? UpdatedAt { get; set; }      // Unix timestamp

[Column("author_id")]
public string AuthorId { get; set; }      // Matches user.id type
```

#### **4. Service DateTime Usage Fixed**
```csharp
// BEFORE (broken):
post.UpdatedAt = DateTime.UtcNow;  // Should be unix timestamp

// AFTER (fixed):
post.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
```

### **🚨 Critical Files to Fix in Other Modules**

#### **Blog System Files**
- `Back/CentroCultural.Domain/Entities/BlogPost.cs` - Add mapping attributes
- `Back/CentroCultural.Application/Services/BlogService.cs` - Fix date conversions
- `Back/CentroCultural.Application/DTOs/Blog*.cs` - Fix DTO conversions

#### **Events System Files**
- `Back/CentroCultural.Domain/Entities/Event.cs` - Add mapping attributes
- `Back/CentroCultural.Application/Services/EventService.cs` - Fix date conversions
- `Back/CentroCultural.Application/DTOs/Event*.cs` - Fix DTO conversions

#### **Media System Files**
- `Back/CentroCultural.Domain/Entities/MediaFile.cs` - Check mapping attributes
- `Back/CentroCultural.Application/Services/MediaService.cs` - Fix date conversions
- `Back/CentroCultural.Application/DTOs/Media*.cs` - Fix DTO conversions

### **✅ Verification Commands After Corrections**
```bash
# Test backend build
cd Back && dotnet build

# Check database consistency
sqlite3 Data/ccpvj.db "PRAGMA foreign_key_check;"

# Verify API responses
curl http://localhost:5251/api/blog
curl http://localhost:5251/api/events
```

**⚠️ Current Status**: COURSES module fully corrected, others need identical pattern applied.