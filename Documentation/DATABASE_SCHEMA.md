# 🗄️ Centro Cultural Víctor Jara - Esquema de Base de Datos

> **Última Actualización**: Octubre 2025
> **Estado**: ✅ **LIMPIO Y FUNCIONAL**

## 📊 Información General

- **Motor**: SQLite 3
- **Archivo**: `Data/ccpvj.db`
- **ORM Backend**: Entity Framework Core (.NET 8)
- **Foreign Keys**: **HABILITADAS** con `PRAGMA foreign_keys = ON`
- **Convención**: snake_case en BD, PascalCase en entidades C#
- **Timestamps**: Unix timestamps (INTEGER) en todas las tablas
- **Integridad**: Verificada (`PRAGMA integrity_check`)

## 📈 Resumen de Tablas

| Categoría | Cantidad | Tablas |
|-----------|----------|--------|
| **Autenticación** | 2 | Rol, Usuario |
| **Material Educativo** | 4 | material_apoyo, modulo, module_post, post_element |
| **Blog** | 3 | blog_post, blog_post_element, blog_post_event |
| **Eventos** | 1 | event |
| **Biblioteca** | 3 | library_item, library_collection, library_item_collection |
| **Analytics** | 2 | visitor_tracking, download_tracking |
| **TOTAL** | **15 tablas** | **Sistema completamente funcional** |

---

## 🏗️ Esquemas de Tablas

### 👤 Sistema de Autenticación (2 tablas)

#### `Rol` - Roles del Sistema

```sql
CREATE TABLE "Rol" (
    "IdRol" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "NombreRol" TEXT NOT NULL,
    "Descripcion" TEXT
);
```

**Datos seeded**:
- IdRol 1: "Asistente" - Solo lectura
- IdRol 2: "Colaborador" - Crear/editar contenido propio
- IdRol 3: "Administrador" - Acceso completo

**Entidad**: `CentroCultural.Domain.Entities.Rol`

---

#### `Usuario` - Usuarios del Sistema

```sql
CREATE TABLE "Usuario" (
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

CREATE INDEX idx_usuario_nombre ON Usuario(NombreUsuario);
CREATE INDEX idx_usuario_rol ON Usuario(IdRol);
CREATE INDEX idx_usuario_activo ON Usuario(EsActivo);
```

**Entidad**: `CentroCultural.Domain.Entities.Usuario`

**Campos**:
- `IdUsuario`: ID autoincremental
- `NombreUsuario`: Único, usado para login
- `Contrasena`: Hash de contraseña (almacenado en texto plano actualmente)
- `IdRol`: FK a tabla Rol (default: 3 = Asistente)
- `EsActivo`: Estado del usuario (1 = activo, 0 = inactivo)

---

### 📚 Sistema Educativo (Material de Apoyo) - 4 tablas

#### `material_apoyo` - Material Educativo Principal

```sql
CREATE TABLE material_apoyo (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_path TEXT,
    is_active INTEGER DEFAULT 1 NOT NULL,
    is_featured INTEGER DEFAULT 0 NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    educator_id TEXT NOT NULL,
    educator_name TEXT
);

CREATE INDEX idx_material_apoyo_educator ON material_apoyo(educator_id);
CREATE INDEX idx_material_apoyo_active ON material_apoyo(is_active);
CREATE INDEX idx_material_apoyo_featured ON material_apoyo(is_featured);
CREATE INDEX idx_material_apoyo_created ON material_apoyo(created_at);
```

**Entidad**: `CentroCultural.Domain.Entities.MaterialApoyo`

**Campos**:
- `id`: UUID como TEXT PRIMARY KEY
- `title`: Título del material educativo
- `description`: Descripción del material
- `image_path`: Ruta del banner/imagen principal
- `is_active`: Estado (1 = activo, 0 = inactivo)
- `is_featured`: Destacado (1 = sí, 0 = no)
- `created_at`, `updated_at`: Unix timestamps
- `educator_id`: ID del educador (puede ser TEXT o INTEGER)
- `educator_name`: Nombre del educador (agregado recientemente)

---

#### `modulo` - Módulos de Material Educativo

```sql
CREATE TABLE modulo (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    material_apoyo_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (material_apoyo_id) REFERENCES material_apoyo(id) ON DELETE CASCADE
);

CREATE INDEX idx_modulo_material_apoyo ON modulo(material_apoyo_id);
CREATE INDEX idx_modulo_order ON modulo(material_apoyo_id, order_number);
CREATE INDEX idx_modulo_active ON modulo(is_active);
CREATE INDEX idx_modulo_created ON modulo(created_at);
```

**Entidad**: `CentroCultural.Domain.Entities.Modulo`

**Relación**: Cada módulo pertenece a un material de apoyo

**DELETE CASCADE**: Al eliminar material_apoyo, se eliminan todos sus módulos

---

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
    updated_at INTEGER,
    FOREIGN KEY (module_id) REFERENCES modulo(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Usuario(IdUsuario)
);

CREATE INDEX idx_module_post_module ON module_post(module_id);
CREATE INDEX idx_module_post_author ON module_post(author_id);
CREATE INDEX idx_module_post_order ON module_post(module_id, order_number);
CREATE INDEX idx_module_post_active ON module_post(is_active);
CREATE INDEX idx_module_post_created ON module_post(created_at);
```

**Entidad**: `CentroCultural.Domain.Entities.ModulePost`

**Multimedia contextual**: Soporta imagen, video y audio

**DELETE CASCADE**: Al eliminar módulo, se eliminan todos sus posts

---

#### `post_element` - Elementos Modulares de Posts

```sql
CREATE TABLE post_element (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    element_type TEXT NOT NULL, -- 'title', 'text', 'image', 'video', 'audio'
    content TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    order_number INTEGER NOT NULL,
    metadata TEXT, -- JSON
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (post_id) REFERENCES module_post(id) ON DELETE CASCADE
);

CREATE INDEX idx_post_element_post_id ON post_element(post_id);
CREATE INDEX idx_post_element_type ON post_element(element_type);
CREATE INDEX idx_post_element_order ON post_element(post_id, order_number);
CREATE INDEX idx_post_element_active ON post_element(is_active);
CREATE INDEX idx_post_element_created ON post_element(created_at);
```

**Entidad**: `CentroCultural.Domain.Entities.PostElement`

**Tipos de elementos**:
- `title`: Título/encabezado
- `text`: Texto/párrafo
- `image`: Imagen (file_path)
- `video`: Video (file_path)
- `audio`: Audio (file_path)

**DELETE CASCADE**: Al eliminar post, se eliminan todos sus elementos

---

### 📝 Sistema de Blog (3 tablas)

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
    tags TEXT, -- JSON array
    status TEXT DEFAULT 'draft',
    FOREIGN KEY (author_id) REFERENCES Usuario(IdUsuario)
);

CREATE UNIQUE INDEX idx_blog_post_slug ON blog_post(slug);
CREATE INDEX idx_blog_post_author ON blog_post(author_id);
CREATE INDEX idx_blog_post_published ON blog_post(is_published);
CREATE INDEX idx_blog_post_featured ON blog_post(is_featured);
CREATE INDEX idx_blog_post_active ON blog_post(is_active);
CREATE INDEX idx_blog_post_created ON blog_post(created_at);
CREATE INDEX idx_blog_post_views ON blog_post(views);
```

**Entidad**: `CentroCultural.Domain.Entities.BlogPost`

**Servicio**: `CentroCultural.Application.Services.BlogService`

**Campos clave**:
- `slug`: URL amigable única
- `is_published`: 0 = draft, 1 = publicado
- `views`: Contador de visualizaciones
- `tags`: Array JSON de tags
- `status`: 'draft', 'published', 'archived'

---

#### `blog_post_element` - Elementos Modulares del Blog

```sql
CREATE TABLE blog_post_element (
    id TEXT PRIMARY KEY,
    blog_post_id TEXT NOT NULL,
    element_type TEXT NOT NULL, -- 'title', 'text', 'image', 'video', 'audio', 'document'
    content TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    order_number INTEGER NOT NULL DEFAULT 0,
    metadata TEXT, -- JSON
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (blog_post_id) REFERENCES blog_post(id) ON DELETE CASCADE
);

CREATE INDEX idx_blog_post_element_blog_post_id ON blog_post_element(blog_post_id);
CREATE INDEX idx_blog_post_element_type ON blog_post_element(element_type);
CREATE INDEX idx_blog_post_element_order ON blog_post_element(blog_post_id, order_number);
CREATE INDEX idx_blog_post_element_active ON blog_post_element(is_active);
CREATE INDEX idx_blog_post_element_created ON blog_post_element(created_at);
```

**Entidad**: `CentroCultural.Domain.Entities.BlogPostElement`

**Servicio**: `CentroCultural.Application.Services.BlogPostElementService`

**DELETE CASCADE**: Al eliminar blog post, se eliminan todos sus elementos

---

#### `blog_post_event` - Relaciones Blog-Eventos (N:M)

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

CREATE INDEX idx_blog_post_event_blog_post ON blog_post_event(blog_post_id);
CREATE INDEX idx_blog_post_event_event ON blog_post_event(event_id);
CREATE INDEX idx_blog_post_event_type ON blog_post_event(relation_type);
CREATE INDEX idx_blog_post_event_active ON blog_post_event(is_active);
CREATE INDEX idx_blog_post_event_created ON blog_post_event(created_at);
CREATE INDEX idx_blog_post_event_order ON blog_post_event(display_order);
```

**Entidad**: `CentroCultural.Domain.Entities.BlogPostEvent`

**Propósito**: Vincular posts del blog con eventos relacionados

---

### 📅 Sistema de Eventos (1 tabla)

#### `event` - Eventos Culturales

```sql
CREATE TABLE event (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date_time INTEGER NOT NULL,
    end_date_time INTEGER,
    is_all_day INTEGER DEFAULT 0,
    location TEXT,
    event_type TEXT NOT NULL DEFAULT 'General',
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    is_recurring INTEGER DEFAULT 0,
    recurrence_pattern TEXT, -- 'Daily', 'Weekly', 'Monthly', 'Yearly'
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_end_date INTEGER,
    recurrence_days_of_week TEXT, -- '1,3,5' para Lun, Mie, Vie
    related_project_id TEXT,
    related_blog_post_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    organizer_id TEXT NOT NULL
);

CREATE INDEX idx_event_organizer ON event(organizer_id);
CREATE INDEX idx_event_start_time ON event(start_date_time);
CREATE INDEX idx_event_active ON event(is_active);
CREATE INDEX idx_event_type ON event(event_type);
CREATE INDEX idx_event_featured ON event(is_featured);
CREATE INDEX idx_event_recurring ON event(is_recurring);
CREATE INDEX idx_event_created ON event(created_at);
```

**Entidad**: `CentroCultural.Domain.Entities.Event`

**Servicio**: `CentroCultural.Application.Services.CalendarService`

**Características**:
- **Eventos recurrentes**: Soporta patrones diarios, semanales, mensuales, anuales
- **Eventos de todo el día**: Campo `is_all_day`
- **Relaciones**: Puede vincularse con blog posts
- **Tipos configurables**: `event_type` (General, Clase, Taller, Conferencia, etc.)

---

### 📚 Sistema de Biblioteca Digital (3 tablas)

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
    file_type TEXT NOT NULL, -- 'video', 'audio', 'document', 'image'
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    tags TEXT, -- JSON array
    language TEXT, -- 'es', 'en', etc.
    year INTEGER,
    category TEXT,
    subcategory TEXT,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0
);

CREATE INDEX idx_library_item_title ON library_item(title);
CREATE INDEX idx_library_item_author ON library_item(author);
CREATE INDEX idx_library_item_file_type ON library_item(file_type);
CREATE INDEX idx_library_item_category ON library_item(category);
CREATE INDEX idx_library_item_language ON library_item(language);
CREATE INDEX idx_library_item_year ON library_item(year);
CREATE INDEX idx_library_item_active ON library_item(is_active);
CREATE INDEX idx_library_item_featured ON library_item(is_featured);
CREATE INDEX idx_library_item_created ON library_item(created_at);
CREATE INDEX idx_library_item_downloads ON library_item(download_count);
CREATE INDEX idx_library_item_views ON library_item(view_count);
```

**Entidad**: `CentroCultural.Domain.Entities.LibraryItem`

**Servicio**: `CentroCultural.Application.Services.DigitalLibraryService`

**Tipos de archivo soportados**:
- `video`: MP4, WebM, AVI, MOV
- `audio`: MP3, WAV, OGG, M4A
- `document`: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- `image`: JPEG, PNG, GIF, WebP, SVG

---

#### `library_collection` - Colecciones de Biblioteca

```sql
CREATE TABLE library_collection (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    color_theme TEXT, -- Código de color hexadecimal
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    created_by TEXT NOT NULL,
    order_number INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0
);

CREATE INDEX idx_library_collection_name ON library_collection(name);
CREATE INDEX idx_library_collection_order ON library_collection(order_number);
CREATE INDEX idx_library_collection_active ON library_collection(is_active);
CREATE INDEX idx_library_collection_featured ON library_collection(is_featured);
CREATE INDEX idx_library_collection_created ON library_collection(created_at);
```

**Entidad**: `CentroCultural.Domain.Entities.LibraryCollection`

**Propósito**: Agrupar recursos de biblioteca por temática

---

#### `library_item_collection` - Relación Items-Colecciones (N:M)

```sql
CREATE TABLE library_item_collection (
    id TEXT PRIMARY KEY,
    library_item_id TEXT NOT NULL,
    library_collection_id TEXT NOT NULL,
    order_number INTEGER DEFAULT 0,
    added_at INTEGER NOT NULL,
    added_by TEXT,
    FOREIGN KEY (library_item_id) REFERENCES library_item(id) ON DELETE CASCADE,
    FOREIGN KEY (library_collection_id) REFERENCES library_collection(id) ON DELETE CASCADE,
    UNIQUE(library_item_id, library_collection_id)
);

CREATE INDEX idx_library_item_collection_item ON library_item_collection(library_item_id);
CREATE INDEX idx_library_item_collection_collection ON library_item_collection(library_collection_id);
CREATE INDEX idx_library_item_collection_order ON library_item_collection(order_number);
CREATE INDEX idx_library_item_collection_added ON library_item_collection(added_at);
```

**Entidad**: `CentroCultural.Domain.Entities.LibraryItemCollection`

**Propósito**: Tabla de unión many-to-many entre items y colecciones

**UNIQUE constraint**: Evita duplicados de mismo item en misma colección

---

### 📊 Sistema de Analytics (2 tablas) - Octubre 2025

#### `visitor_tracking` - Seguimiento de Visitantes

```sql
CREATE TABLE visitor_tracking (
    id TEXT PRIMARY KEY,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    page_visited TEXT NOT NULL,
    visited_at INTEGER NOT NULL,
    session_id TEXT
);

CREATE INDEX idx_visitor_tracking_date ON visitor_tracking(visited_at);
CREATE INDEX idx_visitor_tracking_ip ON visitor_tracking(ip_address);
CREATE INDEX idx_visitor_tracking_session ON visitor_tracking(session_id);
CREATE INDEX idx_visitor_tracking_page ON visitor_tracking(page_visited);
```

**Servicio**: `CentroCultural.Application.Services.AnalyticsService`

**Propósito**: Rastrear visitantes únicos y páginas visitadas

**Nota**: No tiene FK a Usuario para permitir tracking anónimo

---

#### `download_tracking` - Seguimiento de Descargas

```sql
CREATE TABLE download_tracking (
    id TEXT PRIMARY KEY,
    resource_type TEXT NOT NULL, -- 'library_item', 'blog', 'material_apoyo'
    resource_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    downloaded_at INTEGER NOT NULL,
    ip_address TEXT,
    user_id TEXT
);

CREATE INDEX idx_download_tracking_date ON download_tracking(downloaded_at);
CREATE INDEX idx_download_tracking_resource ON download_tracking(resource_type, resource_id);
CREATE INDEX idx_download_tracking_ip ON download_tracking(ip_address);
CREATE INDEX idx_download_tracking_file ON download_tracking(file_name);
```

**Servicio**: `CentroCultural.Application.Services.AnalyticsService`

**Propósito**: Rastrear descargas de archivos multimedia

**Tipos de recursos**:
- `library_item`: Descargas de biblioteca digital
- `blog`: Multimedia de blog
- `material_apoyo`: Recursos educativos

---

## 🔗 Diagrama de Relaciones

```
Rol (1) ←──── (n) Usuario
                  ↓
                  └─→ author_id en: module_post, blog_post

material_apoyo (1) ←──── (n) modulo (1) ←──── (n) module_post (1) ←──── (n) post_element
                                                     ↓
                                                     └─→ author_id → Usuario

blog_post (1) ←──── (n) blog_post_element
    ↓
    └─→ blog_post_event (n:m) ←→ event

library_item (n) ←──→ library_item_collection (n:m) ←──→ library_collection (n)

visitor_tracking (sin FK)
download_tracking (sin FK)
```

---

## 🔧 Características Técnicas

### Foreign Keys

**Habilitadas globalmente**: `PRAGMA foreign_keys = ON`

**Relaciones con CASCADE DELETE**:
- `modulo` → `material_apoyo` (ON DELETE CASCADE)
- `module_post` → `modulo` (ON DELETE CASCADE)
- `post_element` → `module_post` (ON DELETE CASCADE)
- `blog_post_element` → `blog_post` (ON DELETE CASCADE)
- `blog_post_event` → `blog_post`, `event` (ON DELETE CASCADE)
- `library_item_collection` → `library_item`, `library_collection` (ON DELETE CASCADE)

**Efecto**: Al eliminar material_apoyo, se eliminan automáticamente sus módulos, posts y elementos

---

### Índices

Todas las tablas tienen índices optimizados para:
- **Búsquedas**: IDs, títulos, slugs
- **Filtros**: is_active, is_featured, tipos
- **Ordenamiento**: order_number, created_at, fechas
- **Relaciones**: Foreign keys
- **Performance**: Campos frecuentemente consultados

---

### Timestamps

**Formato**: Unix epoch (INTEGER)

**Campos comunes**:
- `created_at`: Timestamp de creación (obligatorio)
- `updated_at`: Timestamp de última actualización (opcional)

**Conversión en backend**:
```csharp
// C# → SQLite
long unixTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

// SQLite → C#
DateTime dateTime = DateTimeOffset.FromUnixTimeSeconds(unixTime).DateTime;
```

---

### Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| **Tablas BD** | snake_case | `material_apoyo`, `blog_post` |
| **Columnas BD** | snake_case | `created_at`, `is_active` |
| **Entidades C#** | PascalCase | `MaterialApoyo`, `BlogPost` |
| **Propiedades C#** | PascalCase | `CreatedAt`, `IsActive` |
| **Foreign Keys** | snake_case_id | `material_apoyo_id`, `blog_post_id` |

---

## 🔍 Verificación de Integridad

### Comandos SQLite

```sql
-- Verificar integridad de la base de datos
PRAGMA integrity_check;

-- Verificar foreign keys
PRAGMA foreign_key_check;

-- Listar todas las tablas
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Ver esquema de una tabla
.schema table_name

-- Contar registros por tabla
SELECT
    'Rol' as tabla, COUNT(*) as registros FROM Rol
UNION ALL SELECT 'Usuario', COUNT(*) FROM Usuario
UNION ALL SELECT 'material_apoyo', COUNT(*) FROM material_apoyo
UNION ALL SELECT 'modulo', COUNT(*) FROM modulo
UNION ALL SELECT 'module_post', COUNT(*) FROM module_post
UNION ALL SELECT 'post_element', COUNT(*) FROM post_element
UNION ALL SELECT 'blog_post', COUNT(*) FROM blog_post
UNION ALL SELECT 'blog_post_element', COUNT(*) FROM blog_post_element
UNION ALL SELECT 'blog_post_event', COUNT(*) FROM blog_post_event
UNION ALL SELECT 'event', COUNT(*) FROM event
UNION ALL SELECT 'library_item', COUNT(*) FROM library_item
UNION ALL SELECT 'library_collection', COUNT(*) FROM library_collection
UNION ALL SELECT 'library_item_collection', COUNT(*) FROM library_item_collection
UNION ALL SELECT 'visitor_tracking', COUNT(*) FROM visitor_tracking
UNION ALL SELECT 'download_tracking', COUNT(*) FROM download_tracking;
```

---

## 📝 Notas Importantes

### ⚠️ Seguridad

- **Contraseñas**: Actualmente almacenadas en texto plano
  - **RECOMENDACIÓN**: Implementar BCrypt o similar para producción
- **SQL Injection**: Entity Framework provee protección
  - **IMPORTANTE**: Validar inputs en APIs

### 🎯 Performance

- **Índices**: Optimizados para consultas frecuentes
- **Foreign Keys**: Mejoran integridad pero pueden afectar escrituras
- **Unix Timestamps**: Más eficientes que TEXT para fechas

### 🔄 Migraciones

- **Entity Framework**: No usa migraciones tradicionales
- **Cambios de esquema**: Aplicar manualmente con ALTER TABLE
- **Backup**: Siempre respaldar antes de cambios de esquema

---

## 📚 Referencias

- **Documentación SQLite**: https://www.sqlite.org/docs.html
- **Entity Framework Core**: https://docs.microsoft.com/ef/core/
- **Foreign Keys en SQLite**: https://www.sqlite.org/foreignkeys.html

---

*Última revisión: Octubre 2025*
*Esquema verificado y funcional*
