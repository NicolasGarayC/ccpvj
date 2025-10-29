# CLAUDE.md

This file provides technical context to Claude Code when working with this repository.

## Project Technical Overview

**Centro Cultural Víctor Jara** - SvelteKit 5 web platform for community cultural center (Bogotá).
**Current Status**: ✅ ALL MODULES CORRECTED - System fully functional.

**Key Architectural Concept**: Contextual multimedia (no independent files - all media belongs to specific content).

## Technology Stack

 - **Frontend**: SvelteKit 5 + TypeScript + Tailwind CSS (APIs internas)
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
npm run format           # Prettier formatting
npm run test             # Run unit + e2e tests
```

### Database
```bash
# SQLite database located at: Data/ccpvj.db
# Environment: DATABASE_URL="file:Data/ccpvj.db"
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
│   └── server/               # Utilidades server (media cleanup, paths)
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

### ✅ All Modules Corrected
**COMPLETED**: All modules have been corrected with the same pattern as courses:

#### **✅ Blog System Module**
- **Status**: ✅ CORRECTED
- **Backend**: BlogPost entity with proper mapping attributes
- **Services**: BlogService with correct date conversions
- **DTOs**: Proper unix timestamp handling implemented

#### **✅ Events System Module**
- **Status**: ✅ CORRECTED
- **Backend**: Event entity with proper mapping attributes
- **Services**: EventService with correct date handling
- **DTOs**: Unix timestamp conversions implemented

#### **✅ Library/Media System Module**
- **Status**: ✅ CORRECTED
- **Backend**: MediaFile entity with proper mapping
- **Services**: Media services with correct date handling
- **DTOs**: All conversion issues resolved

### 🔧 All Corrections Completed (October 2025)
- **All Entities**: ✅ Proper `[Table]` and `[Column]` attributes
- **All Services**: ✅ Correct unix timestamp handling
- **All DTOs**: ✅ Proper date conversions
- **DELETE Operations**: ✅ Complete cascade deletion with multimedia cleanup for all modules

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
- `POST /api/upload/images` - ✅ Image upload with auto-cleanup (200MB direct, 50MB nginx)
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

### 🔄 **Current Priorities**
1. **Testing coverage** - Add comprehensive tests
2. **Frontend-backend integration** - Connect remaining components
3. **Performance optimization** - Cache and optimize queries

## 🎥 **DEFINITIVE MULTIMEDIA SYSTEM** (October 2025)

### ✅ **Status: FULLY IMPLEMENTED WITH GENERIC STRUCTURE**

**CRITICAL**: This is the FINAL media structure. DO NOT change without extreme justification.

### 🏗️ **DEFINITIVE Generic Media Structure**

```
Back/Data/media/
├── library/                          # Digital Library - SIMPLE structure (all files here)
├── material-apoyo/                   # Material de Apoyo
│   └── {course-id}/
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

#### **🖼️ Image Formats** (200MB direct / 50MB nginx)
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
- Los servicios de frontend viven ahora bajo `Front/src/lib/application/services/**` (material-apoyo, calendar, blog, library, etc.). Revisa cada módulo dentro de esta carpeta según el feature a depurar.

### APIs (Need Debugging)
- `Front/src/routes/api/courses/+server.ts` - Main course API
- `Front/src/routes/api/auth/` - Authentication endpoints

### Frontend Pages
- `Front/src/routes/courses/+page.svelte` - Course listing (visual works, data fails)
- `Front/src/routes/+page.svelte` - Homepage (works visually)

## Testing & Debugging Notes

- **Database**: Inspecciona con `sqlite3 Data/ccpvj.db` o tu herramienta favorita
- **Dev Server**: `npm run dev` starts at http://localhost:5173
- **Logs**: Check browser console + terminal for errors
- **Database File**: Located at `Data/ccpvj.db` (278KB)

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
- `course` (snake_case) & `Course` (.NET legacy) - USE `course`
- `module` (snake_case) & `Module` (.NET) - USE `module`
- `work_item` (snake_case) & `WorkItem` (.NET) - USE `work_item`
- `MediaFile` & `MediaEntity` - USE `MediaFile`

### **Role Validation Rules**
- **Database roles**: `asistente`, `colaborador`, `administrador` (lowercase ONLY)
- **Code validation**: NEVER use `Colaborador` or `Administrador` (uppercase)
- **User role field**: Always use `user.role` not `user.nombreRol`

### **Schema Priority**
- **Primary**: Esquema snake_case compartido (frontend + backend)
- **Secondary**: Esquema .NET (PascalCase) - solo para compatibilidad legacy

**✅ Current Status**: All modules corrected and functional.

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
- **Primary**: `course` (snake_case - principal)
- **Secondary**: `module` (snake_case - principal)
- **Posts**: `ModulePosts` (Entity Framework mapping hacia `work_item`)
- **Legacy**: `Course`, `Module`, `WorkItem` (.NET schema - PascalCase) - disponibles pero no principales

---
