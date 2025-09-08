# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Centro Cultural Víctor Jara** platform - an offline-capable web application designed for a community cultural center in Bogotá. The project uses **contextual multimedia architecture** where all media files MUST belong to specific content (no independent multimedia).

**Key Architectural Principle**: **NO INDEPENDENT MULTIMEDIA** - Every file belongs to specific content:
- **Educational**: Course → Module → WorkItem (with contextual images/videos)
- **Blog**: Articles with contextual featured images, PDFs, videos
- **Events**: Cultural events with promotional posters/images

The project consists of a bilingual (Spanish/English) frontend built with SvelteKit 5 and optional .NET 8 backend, optimized for mesh networking and minimal resource consumption.

## Common Development Commands

### Frontend (SvelteKit 5 + TypeScript)
```bash
cd Front/
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run check            # Run TypeScript/Svelte checks
npm run format           # Format code with Prettier
npm run lint             # Check formatting
npm run test:unit        # Run unit tests with Vitest
npm run test:e2e         # Run Playwright e2e tests
npm run storybook        # Start Storybook component development
```

### Database (Drizzle ORM + SQLite) - Contextual Schema
```bash
cd Front/
# Initialize contextual database
../init_contextual_database.sh    # Use contextual schema with WorkItems

# Standard Drizzle commands
npm run db:generate      # Generate migrations
npm run db:push          # Push contextual schema changes
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio GUI
npm run db:seed          # Seed database with test users
```

### Backend (.NET 8)
```bash
cd Back/
dotnet run               # Start API server (port 5000)
dotnet build             # Build solution
dotnet test              # Run tests
dotnet ef migrations add <name>  # Create EF migration
dotnet ef database update       # Apply migrations
```

## Architecture Overview

### Contextual Multimedia System
**CRITICAL**: All multimedia MUST be contextual - never independent
```
Educational Flow:
Course (Matemáticas, Física, Sociales, Economía)
  ├── Module (Lessons)
      └── WorkItem (with title, description, long text, image, video)

Blog Flow:
BlogPost → contextual multimedia (featured image, PDF, video)

Event Flow:
Event → contextual poster/promotional image
```

### Frontend Architecture (SvelteKit 5) - Primary Stack
- **Framework**: SvelteKit 5 with TypeScript and Tailwind CSS 4.0
- **Database**: Drizzle ORM with SQLite (`/home/user/ccpvj/Data/ccpvj.db`)
- **Authentication**: Session-based auth using @oslojs/crypto (cookies)
- **Schema**: Contextual multimedia schema with WorkItem entity
- **Internationalization**: Paraglide.js for Spanish/English support
- **Components**: Component-driven development with Storybook
- **Testing**: Vitest for unit tests, Playwright for e2e

### Backend Architecture (.NET 8 - Optional/Legacy)
```
CentroCultural.API/          # Controllers, Program.cs, API configuration
CentroCultural.Application/  # Services, DTOs, Business logic interfaces
CentroCultural.Domain/       # Entities, Enums, Domain exceptions (WorkItem added)
CentroCultural.Infrastructure/ # Data access, JWT services, Middleware
```

**Key Features Implemented:**
- SvelteKit session-based authentication (Primary)
- .NET JWT authentication (Optional/Legacy)
- Contextual multimedia upload system
- WorkItem entity for educational content
- Course management system with hierarchical structure
- Background services for contextual cleanup

## Important File Locations

### Frontend Key Files (Contextual)
- `Front/src/lib/server/db/schema.ts` - **CONTEXTUAL** database schema (user, Course, Module, WorkItem, MediaFile)
- `Front/src/lib/server/auth.ts` - Session-based authentication logic
- `Front/src/hooks.server.ts` - SvelteKit server hooks with session validation
- `Front/src/routes/+layout.server.ts` - Layout server data with user context
- `Front/src/routes/api/auth/` - Authentication API endpoints
- `Front/src/routes/auth/login/` - Functional login page
- `Front/src/routes/dashboard/` - Protected dashboard page
- `Front/drizzle.config.ts` - Database configuration pointing to contextual DB

### Backend Key Files
- `Back/CentroCultural.API/Program.cs` - API startup configuration
- `Back/CentroCultural.Infrastructure/Data/ApplicationDbContext.cs` - EF Core context
- `Back/CentroCultural.API/Controllers/` - REST API endpoints
- `Back/CentroCultural.Application/Services/` - Business logic services

### Configuration Files (Contextual)
- `database_tables_contextual_fixed.sql` - **CONTEXTUAL** SQL schema with WorkItems
- `init_contextual_database.sh` - Database initialization script
- `CONTEXTUAL_MULTIMEDIA_GUIDE.md` - Complete contextual implementation guide
- `Front/package.json` - Frontend dependencies and scripts
- `Infraestructure/nginx/` - NGINX configurations for contextual uploads
- `Back/Back.csproj` - Backend dependencies (optional)
- `tests/Back.Tests/Back.Tests.csproj` - Test project configuration

## Development Workflow

### Running the Contextual Stack
1. **Initialize Database**: `./init_contextual_database.sh` (creates contextual schema)
2. **Frontend (Primary)**: `cd Front && npm run dev` (runs on http://localhost:5173)
3. **Backend (Optional)**: `cd Back && dotnet run` (runs on http://localhost:5000)
4. **NGINX (Production)**: Use configurations from `Infraestructure/nginx/`
5. **Database**: SQLite with contextual schema at `/home/user/ccpvj/Data/ccpvj.db`

### API Endpoints (Contextual)

**Frontend SvelteKit APIs (Primary):**
- `POST /api/auth/login` - Session-based authentication 
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/status` - Check authentication status
- `GET /api/test-auth` - Test database connectivity

**Contextual Upload APIs (To Implement):**
- `POST /api/upload/workitems` - Upload for work items (images, videos)
- `POST /api/upload/blog` - Upload for blog posts (images, PDFs, videos)
- `POST /api/upload/events` - Upload for events (promotional images)
- `POST /api/upload/courses` - Upload for courses (banners, thumbnails)

**Backend .NET APIs (Optional/Legacy):**
- `POST /api/auth/login` - JWT authentication
- `POST /api/auth/refresh` - JWT refresh tokens
- Course management endpoints

### Testing Strategy (Contextual)
- **Frontend**: Unit tests with Vitest, E2E with Playwright
- **Backend**: XUnit test project structure created at `tests/Back.Tests/`
- **Database**: Drizzle Kit for contextual schema management and migrations
- **Contextual Tests**: Verify no orphaned files, contextual integrity

## Special Considerations (Contextual Architecture)

### Contextual Multimedia Principles
- **NEVER Independent**: All multimedia MUST belong to specific content
- **Content Types**: 'course', 'workitem', 'blog', 'event' only
- **Media Types**: 'image', 'video', 'pdf', 'audio' only
- **Integrity**: Foreign key constraints prevent orphaned files
- **Cleanup**: Automatic deletion when parent content is removed

### Resource Optimization
- **Critical Priority**: Minimize CPU/processing usage (not storage)
- **NGINX Integration**: Direct contextual file serving by content type
- **SQLite**: Lightweight database with contextual schema
- **Directory Structure**: Organized by content context for efficiency

### Mesh Networking Design (Contextual)
- **Offline-First**: Application designed for mesh network deployment
- **Distributed**: Each node maintains independent contextual SQLite database
- **Minimal Resources**: Contextual cleanup prevents storage bloat
- **Content Sync**: Hierarchical structure enables efficient synchronization

### Educational Content Structure
- **Subjects**: Matemáticas, Física, Sociales, Economía
- **Hierarchy**: Course → Module → WorkItem (with contextual media)
- **WorkItems**: Title, Description, LongText, ImagePath, VideoPath
- **Contextual Media**: Each work item has specific educational content

### Security Features (Contextual)
- **Session Authentication**: Cookie-based secure authentication
- **Contextual Validation**: Upload must specify valid ContentType + ContentId
- **User Authorization**: Only authenticated users can upload content
- **Integrity Checks**: Database constraints prevent invalid relationships
- **Cleanup Automation**: Background services for contextual cleanup