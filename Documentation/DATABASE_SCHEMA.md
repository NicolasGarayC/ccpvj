# 🗄️ Centro Cultural Víctor Jara - Esquema de Base de Datos

## Estado Actual: **FUNCIONAL con Esquemas Unificados** ✅

### 📊 **Información General**
- **Base de Datos**: SQLite (`D:/ccpvj/Data/ccpvj.db` - 278KB)
- **ORMs**: Drizzle (frontend principal) + Entity Framework (.NET opcional)
- **Foreign Keys**: **HABILITADAS** con `PRAGMA foreign_keys = ON`
- **Roles**: `asistente`, `colaborador`, `administrador` (minúsculas)

---

## 🏗️ **Estructura de Tablas (13 tablas)**

### 👤 **Autenticación y Usuarios**

#### `user` - Tabla Principal de Usuarios
```sql
CREATE TABLE user (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre TEXT,
    apellido TEXT,
    telefono TEXT,
    role TEXT NOT NULL DEFAULT 'asistente',  -- asistente, colaborador, administrador
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```
**Estado**: ✅ **Funcional** - 2 usuarios registrados con roles actualizados

#### `session` - Sesiones Activas
```sql
CREATE TABLE session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```
**Estado**: ✅ **Funcional** - Manejo de sesiones SvelteKit

---

### 📚 **Sistema Educativo (Unificado)**

#### `course` - Cursos (Schema Drizzle)
```sql
CREATE TABLE course (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject TEXT NOT NULL,           -- Matemáticas, Física, Sociales, Economía
    image_path TEXT,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    educator_id TEXT NOT NULL,       -- FK → user.id
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (educator_id) REFERENCES user(id)
);
```
**Estado**: ✅ **Funcional** - 1 curso de prueba creado

#### `module` - Módulos (Schema Drizzle)
```sql
CREATE TABLE module (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    course_id TEXT NOT NULL,         -- FK → course.id
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
);
```
**Estado**: ✅ **Funcional** - Tabla creada después de arreglar conflictos

#### `work_item` - Elementos de Trabajo (Schema Drizzle)
```sql
CREATE TABLE work_item (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    long_text TEXT,                  -- Contenido educativo detallado
    image_path TEXT,                 -- Multimedia contextual
    video_path TEXT,                 -- Video educativo
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    module_id TEXT NOT NULL,         -- FK → module.id
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (module_id) REFERENCES module(id) ON DELETE CASCADE
);
```
**Estado**: ✅ **Funcional** - 1 work item de prueba creado

#### **⚠️ Tablas Legacy (.NET) - COEXISTEN**
- `Module` (mayúscula) - Schema .NET con campos diferentes
- `WorkItem` (mayúscula) - Schema .NET legacy

---

### 📝 **Sistema Blog**

#### `BlogPost` - Posts del Blog
```sql
CREATE TABLE BlogPost (
    Id TEXT PRIMARY KEY,
    Title TEXT NOT NULL,
    Content TEXT NOT NULL,
    Summary TEXT,
    Slug TEXT UNIQUE NOT NULL,
    IsPublished INTEGER DEFAULT 0,
    IsFeatured INTEGER DEFAULT 0,
    Views INTEGER DEFAULT 0,
    AuthorId TEXT NOT NULL,          -- FK → user.id
    CategoryId TEXT,                 -- FK → BlogCategory.Id
    FeaturedImagePath TEXT,          -- Multimedia contextual
    PdfPath TEXT,                    -- Documentos contextuales
    VideoPath TEXT,                  -- Videos contextuales
    CreatedAt INTEGER NOT NULL,
    UpdatedAt INTEGER,
    PublishedAt INTEGER
);
```

#### `BlogCategory` - Categorías de Blog
```sql
CREATE TABLE BlogCategory (
    Id TEXT PRIMARY KEY,
    Name TEXT UNIQUE NOT NULL,
    Description TEXT,
    Color TEXT DEFAULT '#6B7280',
    CreatedAt INTEGER NOT NULL
);
```

---

### 📅 **Sistema de Eventos**

#### `Event` - Eventos Culturales
```sql
CREATE TABLE Event (
    Id TEXT PRIMARY KEY,
    Title TEXT NOT NULL,
    Description TEXT,
    StartDateTime INTEGER NOT NULL,
    EndDateTime INTEGER NOT NULL,
    Location TEXT,
    MaxAttendees INTEGER,
    CurrentAttendees INTEGER DEFAULT 0,
    IsActive INTEGER DEFAULT 1,
    RequiresRegistration INTEGER DEFAULT 0,
    OrganizerId TEXT NOT NULL,       -- FK → user.id
    ImagePath TEXT,                  -- Poster del evento
    CreatedAt INTEGER NOT NULL,
    UpdatedAt INTEGER
);
```

#### `EventRegistration` - Inscripciones
```sql
CREATE TABLE EventRegistration (
    Id TEXT PRIMARY KEY,
    EventId TEXT NOT NULL,           -- FK → Event.Id
    UserId TEXT NOT NULL,            -- FK → user.id
    RegistrationDate INTEGER NOT NULL,
    Status TEXT DEFAULT 'confirmed',
    Notes TEXT,
    UNIQUE(EventId, UserId)
);
```

---

### 📁 **Sistema Multimedia Contextual**

#### `MediaFile` - Archivos Multimedia
```sql
CREATE TABLE MediaFile (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    FileName TEXT NOT NULL,
    RelativePath TEXT NOT NULL,
    FileSize INTEGER DEFAULT 0,
    MimeType TEXT NOT NULL,
    UploadedBy TEXT NOT NULL,        -- FK → user.id
    UploadedAt INTEGER NOT NULL,
    ContentType TEXT NOT NULL,       -- 'course', 'workitem', 'blog', 'event'
    ContentId TEXT NOT NULL,         -- ID del contenido relacionado
    MediaType TEXT NOT NULL,         -- 'image', 'video', 'pdf', 'audio'
    CHECK (ContentType IN ('course', 'workitem', 'blog', 'event')),
    CHECK (MediaType IN ('image', 'video', 'pdf', 'audio'))
);
```

#### `UploadStatus` - Estado de Subidas
```sql
CREATE TABLE UploadStatus (
    UploadId TEXT PRIMARY KEY,
    Status TEXT DEFAULT 'pending',
    ErrorMessage TEXT,
    MediaFileId INTEGER,             -- FK → MediaFile.Id
    Progress REAL DEFAULT 0.0,
    FileName TEXT NOT NULL,
    UserId TEXT NOT NULL,
    TargetContentType TEXT NOT NULL,
    TargetContentId TEXT NOT NULL,
    TargetMediaType TEXT NOT NULL,
    CreatedAt INTEGER NOT NULL,
    CompletedAt INTEGER
);
```

---

## 🔗 **Relaciones y Foreign Keys**

### **Jerarquía Principal**
```
user (educador)
    ↓
course (curso)
    ↓
module (módulo)
    ↓
work_item (elemento de trabajo)
```

### **Sistema Blog**
```
user (autor) → BlogPost ← BlogCategory
```

### **Sistema Eventos**
```
user (organizador) → Event ← EventRegistration → user (participante)
```

### **Multimedia Contextual**
```
user (uploader) → MediaFile → ContentType (course|blog|event|workitem)
```

---

## 🔧 **Problemas Resueltos**

### ✅ **Lo que se Arregló:**
1. **Tabla `module` faltante** - Creada para compatibilidad Drizzle
2. **Foreign Keys rotas** - Todas las referencias verificadas
3. **Roles inconsistentes** - Unificados a minúsculas
4. **Esquemas duplicados** - Coexisten sin conflictos

### ⚠️ **Consideraciones Actuales:**
- **Coexistencia**: Tablas `Module`/`module` y `WorkItem`/`work_item` coexisten
- **Prioridad**: Frontend usa schema Drizzle (minúsculas)
- **Backend**: .NET schema (mayúsculas) disponible pero opcional

---

## 📊 **Estado de Datos**

```sql
-- Registros actuales
user:        2 usuarios (admin + colaborador)
course:      1 curso de prueba
module:      1 módulo de prueba
work_item:   1 elemento de prueba
BlogPost:    0 posts
Event:       0 eventos
MediaFile:   0 archivos
```

---

## 🚨 **Advertencias para Desarrollo**

### **⚠️ CRÍTICO: No Duplicar Tablas**
Antes de crear cualquier tabla o columna:

1. **Verificar existencia**: Usar `.tables` y `PRAGMA table_info(nombre)`
2. **Revisar nomenclaturas**: Tanto minúsculas como mayúsculas
3. **Evaluar compatibilidad**: ¿Se puede usar tabla existente?
4. **Documentar decisión**: Explicar por qué se crea nueva vs usar existente

### **Reglas de Nomenclatura**
- **Frontend/Drizzle**: `minúsculas_con_guiones`
- **Backend/.NET**: `MayúsculasCamelCase`
- **Roles**: SIEMPRE minúsculas (`asistente`, `colaborador`, `administrador`)

---

## 🔍 **Comandos de Verificación**

```bash
# Ver todas las tablas
sqlite3 ccpvj.db ".tables"

# Ver estructura de tabla específica
sqlite3 ccpvj.db "PRAGMA table_info(user);"

# Verificar foreign keys
sqlite3 ccpvj.db "PRAGMA foreign_key_check;"

# Contar registros
sqlite3 ccpvj.db "SELECT COUNT(*) FROM course;"
```

**📝 Última actualización**: Después de unificar esquemas y corregir problemas críticos de foreign keys.