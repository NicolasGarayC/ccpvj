# 🚀 Centro Cultural Víctor Jara - Contextual Development Setup Guide

## Overview
This guide provides step-by-step instructions to start your application with **contextual multimedia architecture** using your existing NGINX configuration for development and testing.

## 🎯 Contextual Architecture Principles
**CRITICAL**: All multimedia MUST be contextual - never independent
- **Educational Content**: Course → Module → WorkItem (with images/videos)
- **Blog Content**: Articles with featured images, PDFs, videos
- **Event Content**: Events with promotional posters/images
- **NO INDEPENDENT MULTIMEDIA**: Every file belongs to specific content

## Prerequisites
- Ubuntu/Debian Linux system
- Node.js and npm installed
- .NET 8 SDK installed
- Your existing NGINX configurations in `/home/user/ccpvj/Infraestructure/nginx/`

---

## Step 1: Install and Configure Dependencies

### 1.1 Install NGINX (if not already installed)
```bash
sudo apt update
sudo apt install nginx
```

### 1.2 Install Frontend Dependencies
```bash
cd /home/user/ccpvj/Front/

# Install missing dependencies
npm install tsx

# Verify all dependencies are installed
npm install
```

---

## Step 2: Setup Database and Test Data

### 2.1 Create Required Directory Structure
```bash
# Create all required directories as per your NGINX config
sudo mkdir -p /home/user/ccpvj/Back/Data/media/{temp,uploads}/{images,videos,audio}
sudo mkdir -p /home/user/ccpvj/Back/Data/media/temp/uploads/{images,videos,audio}

# Set proper permissions
sudo chown -R $USER:$USER /home/user/ccpvj/Back/Data/
sudo chmod -R 755 /home/user/ccpvj/Back/Data/

# Create NGINX cache directories
sudo mkdir -p /tmp/nginx-cache-static /tmp/nginx-cache-media
sudo chown -R www-data:www-data /tmp/nginx-cache-*
```

### 2.2 Initialize Contextual Database
```bash
# Initialize contextual multimedia database
./init_contextual_database.sh

# Alternative manual setup:
cd /home/user/ccpvj/Front/

# Set DATABASE_URL environment variable  
export DATABASE_URL="file:/home/user/ccpvj/Data/ccpvj.db"

# Quick inspection of current tables
sqlite3 $DATABASE_URL ".tables"

# Optional: import seed data with sqlite3 if needed
# sqlite3 $DATABASE_URL < ./path/to/seed.sql
```

**Database Structure Created:**
- ✅ `user` + `session` tables (authentication)
- ✅ `Course` → `Module` → `WorkItem` (educational hierarchy) 
- ✅ `BlogPost` + `BlogCategory` (content management)
- ✅ `Event` + `EventRegistration` (events)
- ✅ `MediaFile` (contextual multimedia tracking)
- ✅ `UploadStatus` (contextual upload tracking)

---

## Step 3: Configure NGINX with Your Existing Setup

### 3.1 Setup Your NGINX Configuration
```bash
# Use YOUR existing main configuration
sudo cp /home/user/ccpvj/Infraestructure/nginx/nginx.conf /etc/nginx/nginx.conf

# Copy your site configuration
sudo cp /home/user/ccpvj/Infraestructure/nginx/sites-available/centro-cultural.conf /etc/nginx/sites-available/centro-cultural

# Enable your site
sudo ln -sf /etc/nginx/sites-available/centro-cultural /etc/nginx/sites-enabled/centro-cultural

# Disable default site to avoid conflicts
sudo rm -f /etc/nginx/sites-enabled/default
```

### 3.2 Verify Contextual NGINX Configuration
Your NGINX configuration already supports contextual multimedia:

```nginx
# Contextual media serving (already configured)
location ~* \.(jpg|jpeg|png|gif|webp|svg)$ {
    root /home/user/ccpvj/Back/Data/media;  # Serves from contextual directories
    # Will serve from:
    # /media/content/material-apoyo/*, /media/{categoria}/*, /media/blog/*, /media/events/*
}

# Contextual upload endpoints (already configured)
location /upload/images { ... }  # Will be used for contextual uploads
location /upload/videos { ... }  # Will be used for contextual uploads
location /upload/audio { ... }   # Will be used for contextual uploads
```

### 3.3 Modify Frontend Section for Development
```bash
# Open your site configuration for editing
sudo nano /etc/nginx/sites-available/centro-cultural

# Find the "Frontend SPA" section and replace with:
```

```nginx
    # Frontend SPA - DEV MODE (proxy to SvelteKit dev server)
    # For production, replace this with static file serving
    location / {
        # Proxy to SvelteKit development server for hot reloading
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Support WebSocket for hot reloading
        proxy_set_header Connection "upgrade";
        proxy_no_cache 1;
        proxy_cache_bypass 1;
    }
```

### 3.3 Test and Start NGINX
```bash
# Test your configuration
sudo nginx -t

# If test passes, reload NGINX
sudo systemctl reload nginx

# Check NGINX status
sudo systemctl status nginx

# If NGINX is not running, start it
sudo systemctl start nginx
```

---

## Step 4: Start All Services

### 4.1 Terminal 1 - Start SvelteKit Frontend
```bash
cd /home/user/ccpvj/Front/

# Set environment variable for database
export DATABASE_URL="file:/home/user/ccpvj/Data/ccpvj.db"

# Start SvelteKit development server
npm run dev

# This will start on http://localhost:5173
# Leave this terminal running
```

### 4.2 Terminal 2 - Start .NET Backend
```bash
cd /home/user/ccpvj/Back/

# Start .NET backend API
dotnet run

# This will start on http://localhost:5000
# Leave this terminal running
```

### 4.3 Terminal 3 - Test Services
```bash
# Test NGINX is serving content
curl -I http://localhost/

# Test database connectivity through API
curl http://localhost/api/test-auth

# Test direct SvelteKit (bypassing NGINX)
curl http://localhost:5173/api/test-auth

# Test .NET backend directly
curl http://localhost:5000/api/auth/login
```

---

## Step 5: Access and Test Your Application

### 5.1 Access URLs
- **🌐 Main Application**: http://localhost (port 80)
- **🔐 Login Page**: http://localhost/auth/login
- **📊 Dashboard**: http://localhost/dashboard
- **🔌 API Endpoints**: http://localhost/api/*
- **📁 Media Files**: http://localhost/*.{jpg,png,mp4,mp3}
- **🗄️ Database Studio**: http://localhost:4983 (if running)

### 5.2 Test User Credentials (Contextual)
Created by the seed script:
- **👨‍💼 Admin User**:
  - Username: `admin`
  - Password: `admin123`
  - Role: Administrador (can create all content types)

- **👨‍🎓 Student User**:
  - Username: `estudiante` 
  - Password: `student123`
  - Role: Estudiante (limited access)

### 5.3 Test Contextual Database
```bash
# Verify contextual tables exist
sqlite3 /home/user/ccpvj/Data/ccpvj.db ".tables"
# Should show: Course, Module, WorkItem, BlogPost, Event, MediaFile, UploadStatus

# Test contextual views
sqlite3 /home/user/ccpvj/Data/ccpvj.db "SELECT name FROM sqlite_master WHERE type='view';"
# Should show: CourseWithMedia, WorkItemWithMedia, BlogPostWithMedia, EventWithMedia
```

### 5.4 Test Contextual Login Flow
1. Open browser and go to: http://localhost/auth/login
2. Enter credentials (admin/admin123 or estudiante/student123)
3. Click "Iniciar Sesión"
4. Should redirect to dashboard at: http://localhost/dashboard
5. Test logout functionality

### 5.5 Test Contextual API Endpoints
```bash
# Test authentication status
curl http://localhost/api/auth/status

# Test database connectivity  
curl http://localhost/api/test-auth

# Should return contextual database information and table counts
```

---

## Step 6: Test Contextual NGINX Configuration

### 6.1 Test Contextual Media File Serving
```bash
# Create contextual test files in appropriate directories
echo "test material apoyo banner" > /home/user/ccpvj/Back/Data/media/content/material-apoyo/test-banner.jpg
echo "test library document" > /home/user/ccpvj/Back/Data/media/tecnologia/document/test-doc.pdf
echo "test blog image" > /home/user/ccpvj/Back/Data/media/blog/test-article.jpg
echo "test event poster" > /home/user/ccpvj/Back/Data/media/events/test-poster.jpg

# Test contextual media access (direct NGINX serving)
curl -I http://localhost/media/content/material-apoyo/test-banner.jpg
curl -I http://localhost/media/workitems/test-diagram.png
curl -I http://localhost/media/blog/test-article.jpg  
curl -I http://localhost/media/events/test-poster.jpg
```

### 6.2 Test Contextual Upload Endpoints (When Implemented)
```bash
# These endpoints need to be implemented with contextual validation

# Test work item upload (requires ModuleId context)
# curl -X POST -F "file=@test.png" -F "contentType=workitem" -F "contentId=module-001" http://localhost/upload/workitems

# Test blog upload (requires BlogPostId context)  
# curl -X POST -F "file=@test.jpg" -F "contentType=blog" -F "contentId=post-001" http://localhost/upload/blog

# Test event upload (requires EventId context)
# curl -X POST -F "file=@test.jpg" -F "contentType=event" -F "contentId=event-001" http://localhost/upload/events
```

### 6.3 Verify Directory Structure
```bash
# Verify contextual directory structure was created
ls -la /home/user/ccpvj/Back/Data/media/
# Should show: content/, {categorias}/, blog/, events/, temp/

# Verify temp directories for uploads
ls -la /home/user/ccpvj/Back/Data/media/temp/uploads/
# Should show upload temp directories
```

---

## Step 7: Development Workflow

### 7.1 Making Code Changes
1. **Frontend Changes**: Edit files in `/home/user/ccpvj/Front/src/`
   - Changes auto-reload via SvelteKit dev server
   - View changes at http://localhost

2. **Backend Changes**: Edit files in `/home/user/ccpvj/Back/`
   - Stop dotnet with Ctrl+C and restart with `dotnet run`

3. **Database Changes**: After modifying schema in `Front/src/lib/server/db/schema.ts`:
   ```bash
   cd /home/user/ccpvj/Front/
   npm run db:push
   ```

### 7.2 Testing Strategy
- **Always test through NGINX**: Use http://localhost (not direct ports)
- **Check logs**: Monitor both services and NGINX logs
- **Database inspection**: Use `npm run db:studio` to view data

---

## Troubleshooting

### Common Issues and Solutions

#### NGINX fails to start
```bash
# Check for port conflicts
sudo netstat -tlnp | grep :80

# Check NGINX error logs
sudo tail -f /var/log/nginx/error.log

# Check configuration syntax
sudo nginx -t
```

#### Database errors
```bash
# Recreate database completely
rm /home/user/ccpvj/Data/ccpvj.db
cd /home/user/ccpvj/Front/
npm run db:push
npm run db:seed
```

#### SvelteKit won't start
```bash
cd /home/user/ccpvj/Front/
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Permission issues with media directories
```bash
sudo chown -R $USER:$USER /home/user/ccpvj/Data/
sudo chmod -R 755 /home/user/ccpvj/Data/
```

#### Backend connection issues
```bash
# Check if .NET backend is running on port 5000
netstat -tlnp | grep :5000

# Restart backend
cd /home/user/ccpvj/Back/
dotnet run
```

---

## Production Deployment Notes

### Reverting to Production Mode
When ready for production deployment, revert the NGINX frontend configuration:

1. Open `/etc/nginx/sites-available/centro-cultural`
2. Replace the development proxy section with your original static file serving:

```nginx
    # Frontend SPA - PRODUCTION MODE
    location / {
        root /home/user/ccpvj/Front/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache diferenciado por tipo
        location ~* \.(css|js)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            gzip_static on;
        }
        
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, must-revalidate";
            etag on;
        }
        
        # Index.html sin cache (SPA)
        location = /index.html {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
```

3. Build the frontend:
```bash
cd /home/user/ccpvj/Front/
npm run build
```

4. Reload NGINX:
```bash
sudo systemctl reload nginx
```

---

## File Structure Reference

```
/home/user/ccpvj/
├── Front/                          # SvelteKit Frontend
│   ├── src/
│   │   ├── routes/api/auth/        # Authentication API endpoints
│   │   ├── routes/auth/login/      # Login page
│   │   ├── routes/dashboard/       # Dashboard page
│   │   └── lib/server/db/          # Database setup and schema
│   ├── package.json
│   └── dist/                       # Built frontend (production)
├── Back/                           # .NET Backend (optional)
│   ├── CentroCultural.API/
│   ├── CentroCultural.Application/
│   ├── CentroCultural.Domain/
│   └── CentroCultural.Infrastructure/
├── Data/
│   ├── ccpvj.db                    # SQLite database
│   └── media/                      # Media files served by NGINX
│       ├── temp/                   # Temporary uploads
│       └── uploads/                # Final media storage
└── Infraestructure/
    └── nginx/                      # Your NGINX configurations
        ├── nginx.conf
        └── sites-available/centro-cultural.conf
```

---

## 🎉 Success Indicators

Your setup is working correctly when:
- ✅ You can access http://localhost and see the application
- ✅ Login works with test credentials
- ✅ API endpoints respond at http://localhost/api/*
- ✅ Media files are served directly by NGINX
- ✅ Upload endpoints accept files
- ✅ Database operations work correctly

Your existing NGINX configuration is excellent and optimized for your offline mesh network deployment! 🚀
