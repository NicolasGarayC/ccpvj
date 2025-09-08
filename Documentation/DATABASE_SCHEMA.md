# 🗄️ Centro Cultural Víctor Jara - Database Schema Reference

## Overview
This document describes the complete database schema for the Centro Cultural Víctor Jara project, combining both frontend (SvelteKit/Drizzle) and backend (.NET) requirements.

## Table Structure

### 🔐 Authentication & User Management

#### `user` (Primary Frontend Table)
- **Purpose**: Main user authentication for SvelteKit
- **Key Fields**: `id` (TEXT), `username`, `password_hash`, `role`
- **Used by**: Frontend session management, login system

#### `session` (Frontend Sessions)  
- **Purpose**: Cookie-based session management
- **Key Fields**: `id`, `user_id`, `expires_at`
- **Used by**: SvelteKit authentication hooks

#### `Usuario` (Backend Compatibility)
- **Purpose**: .NET backend user management  
- **Key Fields**: `IdUsuario` (INTEGER), `NombreUsuario`, `Contrasena`, `IdRol`
- **Used by**: .NET API controllers

#### `Rol` (User Roles)
- **Purpose**: Role-based access control
- **Key Fields**: `IdRol`, `NombreRol`, `Descripcion`
- **Roles**: Administrador, Educador, Estudiante, Moderador

### 📚 Educational Content

#### `Course` (Educational Courses)
- **Purpose**: Store course/workshop information
- **Key Fields**: `Id` (GUID), `Title`, `Description`, `EducatorId`
- **Features**: Active status, featured flag, educator relationship

#### `Module` (Course Modules)
- **Purpose**: Course lessons/modules
- **Key Fields**: `Id` (GUID), `Title`, `Content`, `CourseId`, `OrderNumber`
- **Features**: Ordered content, belongs to course

### 📁 Multimedia Management

#### `MediaEntity` (File Storage)
- **Purpose**: Store multimedia files metadata
- **Key Fields**: `Id`, `FileName`, `RelativePath`, `Type`, `SizeBytes`
- **Types**: Image (1), Video (2), Audio (3), Document (4)
- **Features**: Thumbnail support, duration tracking, metadata JSON

#### `UploadStatus` (Upload Tracking)
- **Purpose**: Track file upload progress
- **Key Fields**: `UploadId`, `Status`, `Progress`, `MediaId`
- **Statuses**: pending, processing, completed, error

### 🔑 JWT Token Management

#### `RefreshToken` (Token Refresh)
- **Purpose**: JWT refresh token storage
- **Key Fields**: `Id`, `Token`, `ExpiresAt`, `UserId`
- **Features**: Revocation support, user relationship

#### `TokenBlacklist` (Revoked Tokens)
- **Purpose**: Blacklisted JWT tokens
- **Key Fields**: `Id`, `TokenJti`, `ExpiresAt`, `UserId`
- **Features**: Prevents reuse of revoked tokens

### 📝 Content Management

#### `BlogPost` (Blog Articles)
- **Purpose**: Blog posts and news articles
- **Key Fields**: `Id`, `Title`, `Content`, `Slug`, `AuthorId`
- **Features**: Publishing status, featured posts, view counter

#### `BlogCategory` (Content Categories)
- **Purpose**: Categorize blog content
- **Key Fields**: `Id`, `Name`, `Description`, `Color`
- **Features**: Color coding for UI

### 📅 Events & Calendar

#### `Event` (Cultural Events)
- **Purpose**: Manage cultural center events
- **Key Fields**: `Id`, `Title`, `StartDateTime`, `EndDateTime`, `OrganizerId`
- **Features**: Attendee limits, registration requirements

#### `EventRegistration` (Event Sign-ups)
- **Purpose**: Track event registrations
- **Key Fields**: `Id`, `EventId`, `UserId`, `Status`
- **Features**: Registration status tracking

## Usage Examples

### Authentication Flow
```sql
-- Check user credentials
SELECT id, username, password_hash, role FROM user WHERE username = ?;

-- Create session
INSERT INTO session (id, user_id, expires_at) VALUES (?, ?, ?);

-- Validate session
SELECT u.*, s.expires_at FROM user u 
JOIN session s ON u.id = s.user_id 
WHERE s.id = ? AND s.expires_at > strftime('%s', 'now');
```

### Course Management
```sql
-- Get active courses with educator info
SELECT c.*, u.nombre as educator_name FROM Course c
JOIN user u ON c.EducatorId = u.id
WHERE c.IsActive = 1;

-- Get course modules in order
SELECT * FROM Module WHERE CourseId = ? AND IsActive = 1 ORDER BY OrderNumber;
```

### Media Management
```sql
-- Get media files by type
SELECT * FROM MediaEntity WHERE Type = 1; -- Images only

-- Track upload progress
SELECT Status, Progress, ErrorMessage FROM UploadStatus WHERE UploadId = ?;
```

## Indexes for Performance

All critical queries are optimized with indexes:
- User authentication: `username`
- Session validation: `user_id`, `expires_at`
- Course queries: `EducatorId`, `IsActive`
- Media queries: `Type`, `CreatedBy`
- Token management: `ExpiresAt`, `TokenJti`

## Data Types in SQLite

- **TEXT**: Strings, GUIDs stored as text
- **INTEGER**: Numbers, booleans (0/1), Unix timestamps
- **REAL**: Floating point numbers (progress percentages)

## Maintenance Queries

### Cleanup Expired Data
```sql
-- Clean expired sessions
DELETE FROM session WHERE expires_at < strftime('%s', 'now');

-- Clean expired refresh tokens  
DELETE FROM RefreshToken WHERE ExpiresAt < strftime('%s', 'now');

-- Clean expired blacklisted tokens
DELETE FROM TokenBlacklist WHERE ExpiresAt < strftime('%s', 'now');
```

### Statistics Queries
```sql
-- User count by role
SELECT role, COUNT(*) FROM user GROUP BY role;

-- Course statistics
SELECT IsActive, COUNT(*) as count FROM Course GROUP BY IsActive;

-- Media storage usage
SELECT Type, COUNT(*) as files, SUM(SizeBytes) as total_size FROM MediaEntity GROUP BY Type;
```

## Integration Notes

### Frontend (SvelteKit)
- Uses `user` and `session` tables primarily
- Drizzle ORM handles type safety
- Session-based authentication with cookies

### Backend (.NET)  
- Uses `Usuario` and `Rol` tables for compatibility
- Entity Framework manages relationships
- JWT-based authentication with refresh tokens

### NGINX Integration
- Media files served directly from filesystem
- Upload paths configured in NGINX
- Database stores only metadata, not file content

## File Locations
- **Database**: `/home/user/ccpvj/Data/ccpvj.db`
- **Media Files**: `/home/user/ccpvj/Data/media/`
- **Backups**: `/home/user/ccpvj/Data/backups/`

This schema is designed for your offline mesh network deployment with minimal resource usage and optimal performance for community use.