# 🗄️ Centro Cultural Víctor Jara - Esquema de Base de Datos

## Estado Actual: **LIMPIO Y FUNCIONAL** ✅

### 📊 **Información General**
- **Base de Datos**: SQLite (`D:/ccpvj/Data/ccpvj.db`)
- **ORM Backend**: Entity Framework Core (.NET 9)
- **Foreign Keys**: **HABILITADAS** con `PRAGMA foreign_keys = ON`
- **Convención**: snake_case en BD, PascalCase en entidades C#
- **Timestamps**: Unix timestamps (INTEGER) en todas las tablas

### 🧹 **Limpieza Realizada (Octubre 2025)**

#### **Tablas Eliminadas**
- ❌ MediaEntity - Sistema de medios obsoleto
- ❌ MediaFile - Reemplazado por paths contextuales
- ❌ UploadStatus - Sistema de subidas obsoleto
- ❌ session - Sesiones legacy
- ❌ BlogPost_backup, BlogPostEvent_backup, Event_backup - Backups temporales
- ❌ WorkItem - Sistema de trabajo eliminado

#### **Servicios y Código Limpiado**
- ✅ Eliminados endpoints no utilizados del frontend
- ✅ Removidas interfaces sin implementación (IMediaService, IBlogEventRelationService, etc.)
- ✅ Limpiados registros huérfanos en post_element (22 registros eliminados)
- ✅ Corregidas foreign keys rotas en course table

#### **Resultado**
- **Antes**: 21 tablas (7 obsoletas/backups)
- **Ahora**: 14 tablas funcionales
- **Reducción**: 33% menos tablas
- **Integridad**: `PRAGMA integrity_check` - OK
- **Foreign Keys**: `PRAGMA foreign_key_check` - Sin errores

---

## 🏗️ **Estructura de Tablas (14 tablas)**

### 👤 **Sistema de Autenticación**

#### `Rol` - Tabla de Roles
```sql
CREATE TABLE IF NOT EXISTS "Rol" (
    "IdRol" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "NombreRol" TEXT NOT NULL,
    "Descripcion" TEXT
);
```
**Roles disponibles**: `asistente`, `colaborador`, `administrador` (minúsculas)
**Registros**: 3 roles definidos

#### `Usuario` - Tabla Principal de Usuarios
```sql
CREATE TABLE IF NOT EXISTS "Usuario" (
    "IdUsuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "NombreUsuario" TEXT NOT NULL UNIQUE,
    "Contrasena" TEXT NOT NULL,
    "FechaRegistro" TEXT NOT NULL,
    "Nombre" TEXT,
    "Apellido" TEXT,
    "Telefono" TEXT,
    "IdRol" INTEGER NOT NULL DEFAULT 3,
    "EsActivo" INTEGER NOT NULL DEFAULT 1,
    "FechaCreacion" TEXT NOT NULL DEFAULT (datetime('now')),
    "FechaActualizacion" TEXT,
    FOREIGN KEY ("IdRol") REFERENCES "Rol" ("IdRol")
);
```
**Registros**: 2+ usuarios activos
**Entidad Backend**: `CentroCultural.Domain.Entities.Usuario`

---

### 📚 **Sistema Educativo (Cursos)**

#### `course` - Cursos Educativos
```sql
CREATE TABLE IF NOT EXISTS "course" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_path TEXT,
    is_active INTEGER DEFAULT 1 NOT NULL,
    is_featured INTEGER DEFAULT 0 NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    educator_id INTEGER NOT NULL
);

-- Índices
CREATE INDEX idx_course_educator ON course(educator_id);
CREATE INDEX idx_course_active ON course(is_active);
CREATE INDEX idx_course_featured ON course(is_featured);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.Course`
**Servicio**: `CentroCultural.Application.Services.CourseService`
**Mapeo**: `[Table("course")]` con atributos `[Column]`

#### `module` - Módulos de Cursos
```sql
CREATE TABLE module (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    course_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_module_course_new ON module(course_id);
CREATE INDEX idx_module_order_new ON module(course_id, order_number);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.Module`
**Relación**: Cada módulo pertenece a un curso

#### `module_post` - Posts/Contenido de Módulos
```sql
CREATE TABLE module_post (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT,
    image_path TEXT,
    video_path TEXT,
    audio_path TEXT,
    order_number INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    module_id TEXT NOT NULL,
    author_id INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER
);

-- Índices
CREATE INDEX idx_module_post_module ON module_post(module_id);
CREATE INDEX idx_module_post_author ON module_post(author_id);
CREATE INDEX idx_module_post_order ON module_post(module_id, order_number);
CREATE INDEX idx_module_post_active ON module_post(is_active);
CREATE INDEX idx_module_post_created ON module_post(created_at);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.ModulePost`
**Multimedia**: Soporta imagen, video y audio contextuales

#### `post_element` - Elementos Modulares de Posts
```sql
CREATE TABLE post_element (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    element_type TEXT NOT NULL, -- 'title', 'text', 'image', 'video', 'audio'
    content TEXT, -- Para título y texto
    file_path TEXT, -- Para archivos multimedia
    file_name TEXT, -- Nombre original del archivo
    file_size INTEGER, -- Tamaño del archivo en bytes
    mime_type TEXT, -- Tipo MIME del archivo
    order_number INTEGER NOT NULL, -- Orden dentro del post
    metadata TEXT, -- JSON para datos adicionales (alt text, caption, etc.)
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (post_id) REFERENCES module_post(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_post_element_post_id ON post_element(post_id);
CREATE INDEX idx_post_element_type ON post_element(element_type);
CREATE INDEX idx_post_element_order ON post_element(post_id, order_number);
CREATE INDEX idx_post_element_active ON post_element(is_active);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.PostElement`
**Servicio**: `CentroCultural.Application.Services.PostElementService`
**Propósito**: Sistema modular para componer posts con múltiples elementos ordenados

---

### 📝 **Sistema Blog**

#### `blog_post` - Posts del Blog
```sql
CREATE TABLE blog_post (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    slug TEXT NOT NULL UNIQUE,
    is_published INTEGER NOT NULL DEFAULT 0,
    is_featured INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    order_number INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    published_at INTEGER,
    author_id INTEGER NOT NULL DEFAULT 1,
    category_id TEXT,
    tags TEXT
);

-- Índices
CREATE INDEX IX_blog_post_author ON blog_post(author_id);
CREATE INDEX IX_blog_post_category ON blog_post(category_id);
CREATE INDEX IX_blog_post_published ON blog_post(is_published);
CREATE INDEX IX_blog_post_slug ON blog_post(slug);
CREATE INDEX IX_blog_post_featured ON blog_post(is_featured);
CREATE INDEX IX_blog_post_created ON blog_post(created_at);
CREATE INDEX IX_blog_post_active ON blog_post(is_active);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.BlogPost`
**Servicio**: `CentroCultural.Application.Services.BlogService`
**Sistema Modular**: Usa blog_post_element para contenido

#### `blog_post_element` - Elementos Modulares del Blog
```sql
CREATE TABLE blog_post_element (
    id TEXT PRIMARY KEY,
    blog_post_id TEXT NOT NULL,
    element_type TEXT NOT NULL, -- title, text, image, video, audio, document
    content TEXT, -- For title and text content
    file_path TEXT, -- For multimedia files
    file_name TEXT, -- Original file name
    file_size INTEGER, -- File size in bytes
    mime_type TEXT, -- MIME type
    order_number INTEGER NOT NULL DEFAULT 0,
    metadata TEXT, -- JSON for additional data (alt text, caption, etc.)
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL, -- Unix timestamp
    updated_at INTEGER, -- Unix timestamp
    FOREIGN KEY (blog_post_id) REFERENCES blog_post(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IX_blog_post_element_blog_post_id ON blog_post_element(blog_post_id);
CREATE INDEX IX_blog_post_element_element_type ON blog_post_element(element_type);
CREATE INDEX IX_blog_post_element_order_number ON blog_post_element(order_number);
CREATE INDEX IX_blog_post_element_is_active ON blog_post_element(is_active);
CREATE INDEX IX_blog_post_element_created_at ON blog_post_element(created_at);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.BlogPostElement`
**Servicio**: `CentroCultural.Application.Services.BlogPostElementService`
**Tipos de elementos**: title, text, image, video, audio, document

---

### 📅 **Sistema de Eventos y Calendario**

#### `event` - Eventos Culturales
```sql
CREATE TABLE event (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date_time INTEGER NOT NULL,
    end_date_time INTEGER,
    is_all_day INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    event_type TEXT NOT NULL DEFAULT 'General',
    is_active INTEGER NOT NULL DEFAULT 1,
    is_featured INTEGER NOT NULL DEFAULT 0,
    max_attendees INTEGER,
    current_attendees INTEGER NOT NULL DEFAULT 0,
    requires_registration INTEGER NOT NULL DEFAULT 0,
    registration_deadline INTEGER,
    image_path TEXT,
    pdf_path TEXT,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurrence_pattern TEXT,
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_end_date INTEGER,
    recurrence_days_of_week TEXT,
    related_course_id TEXT,
    related_blog_post_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    organizer_id TEXT NOT NULL
);

-- Índices
CREATE INDEX idx_event_organizer ON event(organizer_id);
CREATE INDEX idx_event_start_time ON event(start_date_time);
CREATE INDEX idx_event_active ON event(is_active);
CREATE INDEX idx_event_type ON event(event_type);
CREATE INDEX idx_event_featured ON event(is_featured);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.Event`
**Servicio**: `CentroCultural.Application.Services.CalendarService`
**Características**: Eventos recurrentes, inscripciones, multimedia

#### `blog_post_event` - Relaciones Blog-Eventos
```sql
CREATE TABLE blog_post_event (
    id TEXT PRIMARY KEY,
    blog_post_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    relation_type TEXT NOT NULL DEFAULT 'Related',
    relation_description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    created_by TEXT NOT NULL,
    FOREIGN KEY (blog_post_id) REFERENCES blog_post(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
    UNIQUE(blog_post_id, event_id)
);

-- Índices
CREATE INDEX IX_blog_post_event_blog_post_id ON blog_post_event(blog_post_id);
CREATE INDEX IX_blog_post_event_event_id ON blog_post_event(event_id);
CREATE INDEX IX_blog_post_event_relation_type ON blog_post_event(relation_type);
CREATE INDEX IX_blog_post_event_is_active ON blog_post_event(is_active);
CREATE INDEX IX_blog_post_event_created_at ON blog_post_event(created_at);
CREATE INDEX IX_blog_post_event_display_order ON blog_post_event(display_order);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.BlogPostEvent`
**Propósito**: Vincular posts del blog con eventos relacionados

---

### 📚 **Sistema de Biblioteca Digital**

#### `library_item` - Recursos de Biblioteca
```sql
CREATE TABLE library_item (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    uploaded_by TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    tags TEXT,
    language TEXT,
    year INTEGER,
    category TEXT,
    subcategory TEXT,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0
);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.LibraryItem`
**Servicio**: `CentroCultural.Application.Services.DigitalLibraryService`
**Soporta**: Documentos, libros, recursos educativos

#### `library_collection` - Colecciones de Biblioteca
```sql
CREATE TABLE library_collection (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    color_theme TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    created_by TEXT NOT NULL,
    order_number INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0
);
```
**Entidad Backend**: `CentroCultural.Domain.Entities.LibraryCollection`
**Propósito**: Agrupar recursos por temática

#### `library_item_collection` - Relación Items-Colecciones
```sql
CREATE TABLE library_item_collection (
    id TEXT PRIMARY KEY,
    library_item_id TEXT NOT NULL,
    library_collection_id TEXT NOT NULL,
    order_number INTEGER DEFAULT 0,
    added_at INTEGER NOT NULL,
    added_by TEXT,
    FOREIGN KEY (library_item_id) REFERENCES library_item (id),
    FOREIGN KEY (library_collection_id) REFERENCES library_collection (id)
);
```
**Propósito**: Tabla de unión many-to-many entre items y colecciones

---

### 🔧 **Sistema Interno**

#### `__EFMigrationsHistory` - Historial de Migraciones
```sql
CREATE TABLE "__EFMigrationsHistory" (
    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
    "ProductVersion" TEXT NOT NULL
);
```
**Propósito**: Control de versiones de Entity Framework Core
**Estado**: Administrada automáticamente por EF Core

---

## 🔗 **Relaciones y Foreign Keys**

### **Jerarquía Sistema Educativo**
```
course (1) ─── has many ──→ module (n) ─── has many ──→ module_post (n) ─── has many ──→ post_element (n)
   │                           │                              │
   └─ educator_id              └─ course_id                   └─ module_id
```

### **Sistema Blog**
```
Usuario (author) ─── creates ──→ blog_post (1) ─── has many ──→ blog_post_element (n)
                                     │
                                     └─── relates to ──→ event (n) via blog_post_event
```

### **Sistema Eventos**
```
Usuario (organizer) ─── creates ──→ event (1)
                                     │
                                     └─── relates to ──→ blog_post (n) via blog_post_event
```

### **Sistema Biblioteca**
```
library_collection (n) ←─── many-to-many ───→ library_item (n)
                                via library_item_collection
```

---

## 📊 **Estado Actual de Datos**

```sql
-- Conteo de registros (aproximado después de limpieza)
Rol:                      3 roles
Usuario:                  2+ usuarios
course:                   datos de prueba
module:                   datos de prueba
module_post:              datos de prueba
post_element:             4 elementos (limpiados de 26)
blog_post:                1+ posts de prueba
blog_post_element:        2+ elementos
event:                    datos migrados
blog_post_event:          datos migrados
library_item:             datos activos
library_collection:       colecciones activas
library_item_collection:  relaciones activas
```

---

## 🔧 **Servicios Backend Registrados**

### `ApplicationServiceRegistration.cs`
```csharp
services.AddScoped<IBlogService, BlogService>();
services.AddScoped<IBlogPostElementService, BlogPostElementService>();
services.AddScoped<ICourseService, CourseService>();
services.AddScoped<IPostElementService, PostElementService>();
services.AddScoped<IDigitalLibraryService, DigitalLibraryService>();
services.AddScoped<ICalendarService, CalendarService>();
```

**Servicios Activos**: 6 servicios principales
**Patrón**: Dependency Injection con interfaces

---

## 🎯 **Patrones de Diseño Implementados**

### **1. Sistema Modular de Elementos**
- `module_post` + `post_element` para contenido de cursos
- `blog_post` + `blog_post_element` para posts del blog
- Permite composición flexible de contenido ordenado

### **2. Soft Delete**
- Columna `is_active` en todas las tablas principales
- No se eliminan registros físicamente
- Facilita recuperación y auditoría

### **3. Multimedia Contextual**
- Archivos siempre vinculados a contenido específico
- Rutas almacenadas en entidades principales
- Sistema de upload por contexto

### **4. Unix Timestamps**
- Todos los timestamps como INTEGER
- Formato: segundos desde epoch Unix
- Facilita cálculos y comparaciones

---

## 🔍 **Comandos de Verificación**

```bash
# Ver todas las tablas actuales
Data/sqlite3.exe Data/ccpvj.db ".tables"

# Ver estructura de tabla específica
Data/sqlite3.exe Data/ccpvj.db ".schema course"

# Verificar integridad de la BD
Data/sqlite3.exe Data/ccpvj.db "PRAGMA integrity_check;"

# Verificar foreign keys
Data/sqlite3.exe Data/ccpvj.db "PRAGMA foreign_key_check;"

# Contar registros de todas las tablas
Data/sqlite3.exe Data/ccpvj.db "SELECT 'course', COUNT(*) FROM course UNION ALL SELECT 'module', COUNT(*) FROM module;"

# Ver datos de una tabla
Data/sqlite3.exe Data/ccpvj.db "SELECT * FROM blog_post LIMIT 5;"
```

---

## 🚨 **Reglas de Desarrollo**

### **Al Agregar Nuevas Tablas**
1. ✅ Usar snake_case para nombres de tablas/columnas
2. ✅ Agregar `is_active INTEGER DEFAULT 1` para soft delete
3. ✅ Usar `created_at INTEGER` y `updated_at INTEGER` para timestamps
4. ✅ Crear entidad C# con atributos `[Table]` y `[Column]`
5. ✅ Registrar DbSet en ApplicationDbContext
6. ✅ Crear servicio e interface si es necesario
7. ✅ Registrar servicio en ApplicationServiceRegistration

### **Al Modificar Tablas Existentes**
1. ✅ Verificar impacto en foreign keys
2. ✅ Actualizar entidad C# correspondiente
3. ✅ Actualizar servicio si cambian propiedades
4. ✅ Ejecutar `PRAGMA integrity_check` después del cambio

### **Al Eliminar Tablas/Columnas**
1. ✅ Verificar que no hay foreign keys apuntando a ella
2. ✅ Eliminar entidad C# y DbSet correspondiente
3. ✅ Eliminar servicio y registro si existía
4. ✅ Limpiar referencias en código frontend

---

**📝 Última actualización**: Octubre 2025 - Después de limpieza completa del backend y base de datos
**🔍 Verificado**: PRAGMA integrity_check - OK | PRAGMA foreign_key_check - Sin errores
**📦 Estado**: 14 tablas funcionales, sin tablas huérfanas ni backups
