# CLAUDE.md

This file provides technical context to Claude Code when working with this repository.

## Project Technical Overview

**Centro Cultural Víctor Jara** - SvelteKit 5 web platform for community cultural center (Bogotá).
**Current Status**: ✅ CORE FUNCTIONALITY WORKING - APIs functional, database unified, roles corrected.

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

### ✅ Working Modules
- **Course System**: ✅ APIs functional, database unified
- **Authentication**: ✅ Session management working
- **Database**: ✅ SQLite connection stable, foreign keys enabled
- **Role System**: ✅ Unified roles (asistente, colaborador, administrador)
- **Multimedia System**: ✅ Upload/serving/cleanup system fully implemented
- **File Cleanup**: ✅ Automatic cleanup on replace/delete operations

### ⚠️ Needs Development
- **Blog System**: Partial implementation, needs completion
- **Multimedia Integration**: Extend cleanup system to blog, library, user profiles
- **Frontend Integration**: Some components need backend connection
- **Testing**: No comprehensive test coverage

### 🔧 Recently Fixed
- **Schema Conflicts**: ✅ Resolved duplicate table issues
- **Role Inconsistencies**: ✅ Unified to lowercase roles
- **API Endpoints**: ✅ Working with correct database schema
- **Foreign Keys**: ✅ All references working properly

## API Endpoints Status

**✅ Course APIs** (functional):
- `GET/POST /api/courses` - ✅ Working with unified schema
- `GET /api/courses/all` - ✅ Returns course list with educator info
- `GET /api/courses/featured` - ✅ Functional
- `GET /api/courses/subjects` - ✅ Returns available subjects
- `GET /api/courses/[id]` - ✅ Course details with modules
- `POST /api/courses/modules` - ✅ Module creation working
- `POST /api/courses/workitems` - ✅ WorkItem creation working
- `PUT/DELETE` endpoints - ✅ With proper role validation

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

1. **Complete blog system** - Finish blog post management with multimedia cleanup
2. **Extend multimedia cleanup** - Integrate with library, user profiles, CMS content
3. **Testing coverage** - Add comprehensive tests
4. **Frontend-backend integration** - Connect remaining components
5. **Performance optimization** - Cache and optimize queries

## Multimedia System (Recently Implemented)

### ✅ **Current Coverage**
- **Post Elements**: ✅ Automatic cleanup on upload/delete
- **Module Posts**: ✅ Complete cleanup when post deleted
- **File Serving**: ✅ Development (`/media/`) + production (nginx)
- **Admin Cleanup**: ✅ Manual cleanup endpoint with dry-run mode

### ⚠️ **Extension Required**
- **Blog Posts**: Integrate multimedia cleanup
- **Library Resources**: PDF/document cleanup
- **User Avatars**: Profile image cleanup
- **CMS Content**: Static page media cleanup

### 📁 **File Structure**
```
Data/media/
├── image/     # All images (posts, blog, profiles, etc)
├── video/     # All videos
├── audio/     # All audio files
├── document/  # All documents (PDFs, Office files, text files)
└── temp/      # Nginx temporary uploads
    ├── images/
    ├── videos/
    ├── audio/
    └── documents/
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

**⚠️ Current Status**: Core functionality is now working after fixing schema conflicts and role inconsistencies.