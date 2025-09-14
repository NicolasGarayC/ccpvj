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

### ⚠️ Needs Development
- **Blog System**: Partial implementation, needs completion
- **File Upload**: Contextual upload system not implemented
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

**❌ Upload APIs** (not implemented):
- `/api/upload/*` - No upload functionality exists

**✅ Auth APIs** (working):
- `POST /api/auth/login` - ✅ Session management working
- `POST /api/auth/logout` - ✅ Session cleanup working
- `GET /api/auth/me` - ✅ User info retrieval

## Development Priorities

1. **Complete blog system** - Finish blog post management
2. **Add contextual upload** - File upload system missing
3. **Testing coverage** - Add comprehensive tests
4. **Frontend-backend integration** - Connect remaining components
5. **Performance optimization** - Cache and optimize queries

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