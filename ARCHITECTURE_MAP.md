# 🏗️ Centro Cultural Víctor Jara - Mapa Arquitectónico Completo

> **Última actualización**: Octubre 2025
> **Estado**: ✅ Sistema completamente funcional y operativo

---

## 📋 Índice

1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Arquitectura del Backend](#-arquitectura-del-backend-net-8)
4. [Arquitectura del Frontend](#-arquitectura-del-frontend-sveltekit-5)
5. [Base de Datos](#-base-de-datos-sqlite)
6. [Sistema de Autenticación](#-sistema-de-autenticación)
7. [APIs y Endpoints](#-apis-y-endpoints)
8. [Sistema Multimedia](#-sistema-multimedia)
9. [Módulos Funcionales](#-módulos-funcionales)
10. [Flujos de Trabajo](#-flujos-de-trabajo)

---

## 🎯 Resumen Ejecutivo

### Descripción
Plataforma web educativa **offline-first** para el Centro Cultural Víctor Jara en Bogotá, diseñada para funcionar en redes locales mesh sin dependencia de internet.

### Características Principales
- ✅ **4 Módulos Operativos**: Material de Apoyo, Blog, Eventos, Biblioteca Digital
- ✅ **Sistema Multimedia Contextual**: Upload, servicio y limpieza automática
- ✅ **Autenticación JWT**: Sistema completo con roles diferenciados
- ✅ **DELETE CASCADE**: Eliminación en cascada con limpieza de archivos
- ✅ **36+ Endpoints API**: Frontend-first con backend opcional
- ✅ **Arquitectura Híbrida**: SvelteKit + .NET (opcional)

### Estado Actual
```
Backend (.NET):      ✅ Funcional y operativo
Frontend (Svelte):   ✅ Funcional y operativo
Base de Datos:       ✅ SQLite con 16 tablas activas
Autenticación:       ✅ JWT con refresh tokens
Multimedia:          ✅ Sistema completo implementado
APIs:                ✅ 36 endpoints funcionales
```

---

## 🛠️ Stack Tecnológico

### Frontend
```yaml
Framework:        SvelteKit 5 (latest)
Lenguaje:         TypeScript 5.0
Estilos:          Tailwind CSS 4.0
Build Tool:       Vite 7.0
Testing:          Vitest 3.2 + Playwright
Storybook:        9.1 (componentes)
Puerto:           5173 (desarrollo)
```

### Backend (Opcional)
```yaml
Framework:        .NET 8
Lenguaje:         C# 12
ORM:              Entity Framework Core
API:              REST (ASP.NET Core)
Puerto:           5251
```

### Base de Datos
```yaml
Motor:            SQLite 3
Archivo:          Data/ccpvj.db
Foreign Keys:     Habilitadas (PRAGMA foreign_keys = ON)
Timestamps:       Unix epoch (INTEGER)
```

### Autenticación
```yaml
Tipo:             JWT (JSON Web Tokens)
Algoritmo:        HS256
Storage:          localStorage (frontend)
Expiración:       Configurable (default: 7 días)
Roles:            asistente, colaborador, administrador
```

---

## 🏗️ Arquitectura del Backend (.NET 8)

### Estructura de Capas

```
Back/
├── CentroCultural.API/              # 📡 Capa de Presentación (Controllers)
│   ├── Controllers/
│   │   ├── SimpleAuthController.cs         # Autenticación JWT
│   │   ├── MaterialApoyoController.cs      # Material educativo
│   │   ├── BlogController.cs               # Sistema de blog
│   │   ├── BlogPostElementController.cs    # Elementos de blog
│   │   ├── CalendarController.cs           # Eventos y calendario
│   │   ├── DigitalLibraryController.cs     # Biblioteca digital
│   │   ├── PostElementController.cs        # Elementos de posts
│   │   ├── UploadController.cs             # Subida de archivos
│   │   ├── AnalyticsController.cs          # Métricas y analytics
│   │   └── UserManagementController.cs     # Gestión de usuarios
│   └── Program.cs                          # Configuración principal
│
├── CentroCultural.Application/      # 📦 Capa de Aplicación (Servicios)
│   ├── Services/
│   │   ├── MaterialApoyoService.cs         # Lógica de material educativo
│   │   ├── BlogService.cs                  # Lógica de blog
│   │   ├── BlogPostElementService.cs       # Lógica de elementos blog
│   │   ├── CalendarService.cs              # Lógica de eventos
│   │   ├── DigitalLibraryService.cs        # Lógica de biblioteca
│   │   ├── PostElementService.cs           # Lógica de posts
│   │   └── AnalyticsService.cs             # Lógica de analytics
│   ├── Interfaces/
│   │   ├── IMaterialApoyoService.cs
│   │   ├── IBlogService.cs
│   │   ├── IBlogPostElementService.cs
│   │   ├── ICalendarService.cs
│   │   ├── IDigitalLibraryService.cs
│   │   ├── IPostElementService.cs
│   │   └── IAnalyticsService.cs
│   ├── DTOs/                               # Data Transfer Objects
│   └── Configuration/
│       └── ApplicationServiceRegistration.cs
│
├── CentroCultural.Domain/           # 🎯 Capa de Dominio (Entidades)
│   ├── Entities/
│   │   ├── Usuario.cs                      # Entidad de usuarios
│   │   ├── Rol.cs                          # Entidad de roles
│   │   ├── MaterialApoyo.cs                # Material educativo
│   │   ├── Modulo.cs                       # Módulos de material
│   │   ├── ModulePost.cs                   # Posts de módulos
│   │   ├── PostElement.cs                  # Elementos de posts
│   │   ├── BlogPost.cs                     # Posts de blog
│   │   ├── BlogPostElement.cs              # Elementos de blog
│   │   ├── BlogPostEvent.cs                # Relación blog-eventos
│   │   ├── Event.cs                        # Eventos
│   │   ├── LibraryItem.cs                  # Items de biblioteca
│   │   ├── LibraryCollection.cs            # Colecciones de biblioteca
│   │   └── LibraryItemCollection.cs        # Relación items-colecciones
│   ├── Enums/                              # Enumeraciones
│   └── Exceptions/                         # Excepciones personalizadas
│
├── CentroCultural.Infrastructure/   # 🔧 Capa de Infraestructura
│   ├── Data/
│   │   └── ApplicationDbContext.cs         # DbContext de EF Core
│   ├── Services/
│   │   ├── JwtService.cs                   # Generación y validación JWT
│   │   └── OrphanFileCleanupService.cs     # Limpieza de archivos
│   └── Configuration/
│       └── InfrastructureServiceRegistration.cs
│
└── Data/                            # 📁 Archivos de datos
    ├── media/                              # Archivos multimedia
    │   ├── material-apoyo/                 # Multimedia de material educativo
    │   ├── blog/                           # Multimedia de blog
    │   ├── library/                        # Archivos de biblioteca
    │   └── content/                        # Otros contenidos
    └── ccpvj.db                            # Base de datos SQLite
```

### Controladores API (.NET)

| Controlador | Ruta Base | Descripción |
|------------|-----------|-------------|
| `SimpleAuthController` | `/api/auth` | Autenticación JWT (login/logout) |
| `MaterialApoyoController` | `/api/material-apoyo` | CRUD de material educativo |
| `BlogController` | `/api/blog` | CRUD de posts de blog |
| `BlogPostElementController` | `/api/blog-elements` | Elementos modulares de blog |
| `CalendarController` | `/api/calendar` | Gestión de eventos |
| `DigitalLibraryController` | `/api/library` | Biblioteca digital |
| `PostElementController` | `/api/post-elements` | Elementos de posts |
| `UploadController` | `/api/upload` | Subida de archivos |
| `AnalyticsController` | `/api/analytics` | Métricas del sistema |
| `UserManagementController` | `/api/users` | Gestión de usuarios |

### Entidades del Dominio

#### Autenticación
- **Usuario**: Usuarios del sistema con credenciales
- **Rol**: Roles del sistema (asistente, colaborador, administrador)

#### Material Educativo
- **MaterialApoyo**: Cursos o material educativo principal
- **Modulo**: Módulos dentro de un material
- **ModulePost**: Posts/contenido de un módulo
- **PostElement**: Elementos modulares de un post (título, texto, imagen, video, audio)

#### Blog
- **BlogPost**: Posts del blog/noticias
- **BlogPostElement**: Elementos modulares del blog
- **BlogPostEvent**: Relación N:M entre blog y eventos

#### Eventos
- **Event**: Eventos del calendario (con recurrencia)

#### Biblioteca
- **LibraryItem**: Items de la biblioteca (PDFs, videos, etc.)
- **LibraryCollection**: Colecciones de recursos
- **LibraryItemCollection**: Relación N:M items-colecciones

---

## 🎨 Arquitectura del Frontend (SvelteKit 5)

### Estructura de Directorios

```
Front/
├── src/
│   ├── routes/                          # 🛣️ Rutas y páginas
│   │   ├── +layout.svelte                  # Layout principal
│   │   ├── +layout.server.ts               # Lógica servidor del layout
│   │   ├── +page.svelte                    # Homepage
│   │   │
│   │   ├── auth/                           # 🔐 Autenticación
│   │   │   └── login/
│   │   │       └── +page.svelte
│   │   │
│   │   ├── material-apoyo/                 # 📚 Material educativo
│   │   │   ├── +page.svelte                # Lista de materiales
│   │   │   ├── create/                     # Crear material
│   │   │   └── [id]/                       # Detalle y edición
│   │   │       ├── +page.svelte
│   │   │       └── +page.ts
│   │   │
│   │   ├── modules/                        # 📖 Módulos
│   │   │   └── [id]/
│   │   │       └── +page.svelte
│   │   │
│   │   ├── blog/                           # 📝 Blog
│   │   │   ├── +page.svelte                # Lista de posts
│   │   │   ├── create/                     # Crear post
│   │   │   └── [slug]/                     # Detalle por slug
│   │   │       └── +page.svelte
│   │   │
│   │   ├── calendar/                       # 📅 Eventos
│   │   │   ├── +page.svelte                # Calendario
│   │   │   ├── create/                     # Crear evento
│   │   │   └── event/
│   │   │       └── [id]/
│   │   │
│   │   ├── library/                        # 📚 Biblioteca
│   │   │   ├── +page.svelte                # Lista de recursos
│   │   │   ├── create/                     # Subir recurso
│   │   │   ├── edit/                       # Editar recursos
│   │   │   └── [id]/                       # Detalle de recurso
│   │   │
│   │   ├── dashboard/                      # 🎛️ Panel admin
│   │   │   ├── +page.svelte
│   │   │   └── users/                      # Gestión de usuarios
│   │   │
│   │   ├── admin/                          # 👨‍💼 Administración
│   │   │   └── analytics/                  # Analytics
│   │   │
│   │   ├── media/                          # 🖼️ Servicio de archivos
│   │   │   └── [...path]/
│   │   │       └── +server.ts
│   │   │
│   │   └── api/                            # 🔌 API Endpoints (36)
│   │       ├── auth/                       # Autenticación
│   │       │   ├── login/+server.ts
│   │       │   ├── logout/+server.ts
│   │       │   └── validate/+server.ts
│   │       ├── material-apoyo/             # Material educativo
│   │       │   ├── +server.ts
│   │       │   ├── [id]/+server.ts
│   │       │   ├── all/+server.ts
│   │       │   ├── featured/+server.ts
│   │       │   ├── statistics/+server.ts
│   │       │   └── modules/
│   │       │       ├── +server.ts
│   │       │       └── [id]/+server.ts
│   │       ├── blog/                       # Blog
│   │       │   ├── +server.ts
│   │       │   ├── [id]/+server.ts
│   │       │   ├── featured/+server.ts
│   │       │   ├── recent/+server.ts
│   │       │   └── slug/
│   │       │       └── [slug]/+server.ts
│   │       ├── digitallibrary/             # Biblioteca
│   │       │   ├── items/
│   │       │   │   ├── +server.ts
│   │       │   │   └── [id]/
│   │       │   │       ├── +server.ts
│   │       │   │       ├── download/+server.ts
│   │       │   │       └── view/+server.ts
│   │       │   ├── collections/
│   │       │   │   ├── +server.ts
│   │       │   │   └── [id]/+server.ts
│   │       │   ├── filters/
│   │       │   │   ├── authors/+server.ts
│   │       │   │   ├── categories/+server.ts
│   │       │   │   ├── languages/+server.ts
│   │       │   │   ├── tags/+server.ts
│   │       │   │   └── years/+server.ts
│   │       │   └── stats/+server.ts
│   │       ├── upload/                     # Subida de archivos
│   │       │   ├── images/+server.ts
│   │       │   ├── videos/+server.ts
│   │       │   ├── blog/[blogPostId]/+server.ts
│   │       │   ├── library/[itemId]/+server.ts
│   │       │   └── posts/[postId]/+server.ts
│   │       ├── cleanup/                    # Limpieza de archivos
│   │       │   └── media/+server.ts
│   │       ├── blogcategory/               # Categorías blog
│   │       │   └── +server.ts
│   │       └── post-elements-stub/         # Elementos de posts
│   │           └── +server.ts
│   │
│   └── lib/                             # 📚 Bibliotecas compartidas
│       ├── components/                     # Componentes Svelte
│       │   ├── auth/
│       │   │   └── SessionExpiredModal.svelte
│       │   ├── blog/
│       │   │   ├── BlogEditor.svelte
│       │   │   ├── BlogEventRelation.svelte
│       │   │   ├── BlogPostCard.svelte
│       │   │   ├── BlogPostForm.svelte
│       │   │   ├── BlogPostList.svelte
│       │   │   ├── BlogPostModal.svelte
│       │   │   └── MediaUploader.svelte
│       │   ├── material-apoyo/
│       │   │   └── MaterialApoyoCard.svelte
│       │   ├── library/
│       │   │   ├── DigitalLibraryCard.svelte
│       │   │   └── DigitalLibraryFilters.svelte
│       │   ├── calendar/                   # Componentes de eventos
│       │   ├── course/                     # Componentes de cursos
│       │   ├── upload/                     # Componentes de upload
│       │   ├── users/                      # Componentes de usuarios
│       │   └── common/                     # Componentes comunes
│       │
│       ├── services/                       # 🔌 Servicios HTTP
│       │   ├── base/
│       │   │   └── baseHttpService.ts      # Servicio base HTTP
│       │   ├── auth/
│       │   │   └── jwtService.ts           # Servicio JWT
│       │   ├── blog/
│       │   │   ├── blogService.ts
│       │   │   └── blogPostElementService.ts
│       │   ├── analytics/
│       │   │   └── analyticsService.ts
│       │   ├── users/
│       │   │   └── userManagementService.ts
│       │   ├── calendar/
│       │   │   └── calendarService.ts
│       │   ├── materialApoyoService.ts
│       │   ├── modulePostService.ts
│       │   ├── postElementService.ts
│       │   ├── digitalLibraryService.ts
│       │   └── contextualUploadService.ts
│       │
│       ├── server/                         # 🖥️ Utilidades servidor
│       │   └── utils/
│       │       ├── mediaCleanup.ts         # Limpieza de archivos
│       │       └── paths.ts                # Manejo de rutas
│       │
│       ├── stores/                         # 📦 Stores globales
│       │   └── authStore.ts                # Store de autenticación
│       │
│       ├── types/                          # 📝 Tipos TypeScript
│       ├── utils/                          # 🔧 Utilidades
│       ├── config/                         # ⚙️ Configuración
│       └── assets/                         # 🎨 Recursos estáticos
│
├── static/                              # Archivos estáticos públicos
├── tests/                               # Tests E2E
└── stories/                             # Storybook stories
```

### Componentes por Módulo

#### Autenticación (1 componente)
- `SessionExpiredModal.svelte`: Modal de sesión expirada

#### Blog (8 componentes)
- `BlogEditor.svelte`: Editor de posts
- `BlogEventRelation.svelte`: Relación blog-eventos
- `BlogPostCard.svelte`: Tarjeta de post
- `BlogPostForm.svelte`: Formulario de post
- `BlogPostList.svelte`: Lista de posts
- `BlogPostModal.svelte`: Modal de post
- `MediaUploader.svelte`: Subidor de multimedia

#### Material Educativo (1 componente)
- `MaterialApoyoCard.svelte`: Tarjeta de material

#### Biblioteca (2 componentes)
- `DigitalLibraryCard.svelte`: Tarjeta de recurso
- `DigitalLibraryFilters.svelte`: Filtros de búsqueda

### Servicios Frontend

| Servicio | Archivo | Descripción |
|----------|---------|-------------|
| **JwtService** | `auth/jwtService.ts` | Autenticación JWT, manejo de tokens |
| **BaseHttpService** | `base/baseHttpService.ts` | Servicio HTTP base con interceptors |
| **BlogService** | `blog/blogService.ts` | Lógica de blog |
| **BlogPostElementService** | `blog/blogPostElementService.ts` | Elementos de blog |
| **MaterialApoyoService** | `materialApoyoService.ts` | Material educativo |
| **ModulePostService** | `modulePostService.ts` | Posts de módulos |
| **PostElementService** | `postElementService.ts` | Elementos de posts |
| **CalendarService** | `calendar/calendarService.ts` | Eventos y calendario |
| **DigitalLibraryService** | `digitalLibraryService.ts` | Biblioteca digital |
| **ContextualUploadService** | `contextualUploadService.ts` | Subida contextual |
| **AnalyticsService** | `analytics/analyticsService.ts` | Métricas y analytics |
| **UserManagementService** | `users/userManagementService.ts` | Gestión de usuarios |

---

## 🗄️ Base de Datos (SQLite)

### Información General

```yaml
Archivo:              Data/ccpvj.db
Motor:                SQLite 3
Foreign Keys:         Habilitadas (PRAGMA foreign_keys = ON)
Tablas Activas:       16 tablas
Convención:           snake_case
Timestamps:           Unix epoch (INTEGER)
Integridad:           ✅ Verificada (PRAGMA integrity_check)
```

### Esquema de Tablas (16 tablas)

#### 1. Autenticación (2 tablas)

**`Rol`** - Roles del sistema
```sql
CREATE TABLE "Rol" (
    "IdRol" INTEGER PRIMARY KEY AUTOINCREMENT,
    "NombreRol" TEXT NOT NULL,
    "Descripcion" TEXT
);
-- Roles: Asistente, Colaborador, Administrador
```

**`Usuario`** - Usuarios del sistema
```sql
CREATE TABLE "Usuario" (
    "IdUsuario" INTEGER PRIMARY KEY AUTOINCREMENT,
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

#### 2. Material Educativo (4 tablas)

**`material_apoyo`** - Material educativo principal
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
```

**`modulo`** - Módulos de un material
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
```

**`module_post`** - Posts/contenido de módulos
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
    FOREIGN KEY (module_id) REFERENCES modulo(id) ON DELETE CASCADE
);
```

**`post_element`** - Elementos modulares de posts
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
```

#### 3. Blog (3 tablas)

**`blog_post`** - Posts del blog
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
    status TEXT DEFAULT 'draft'
);
```

**`blog_post_element`** - Elementos de blog
```sql
CREATE TABLE blog_post_element (
    id TEXT PRIMARY KEY,
    blog_post_id TEXT NOT NULL,
    element_type TEXT NOT NULL,
    content TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    metadata TEXT,
    order_number INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (blog_post_id) REFERENCES blog_post(id) ON DELETE CASCADE
);
```

**`blog_post_event`** - Relación blog-eventos (N:M)
```sql
CREATE TABLE blog_post_event (
    id TEXT PRIMARY KEY,
    blog_post_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    relation_type TEXT NOT NULL DEFAULT 'Related',
    relation_description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT NOT NULL,
    FOREIGN KEY (blog_post_id) REFERENCES blog_post(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE
);
```

#### 4. Eventos (1 tabla)

**`event`** - Eventos y calendario
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
    recurrence_pattern TEXT,
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_end_date INTEGER,
    recurrence_days_of_week TEXT,
    related_project_id TEXT,
    related_blog_post_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    organizer_id TEXT NOT NULL
);
```

#### 5. Biblioteca Digital (3 tablas)

**`library_item`** - Items de biblioteca
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
    tags TEXT, -- JSON array
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

**`library_collection`** - Colecciones
```sql
CREATE TABLE library_collection (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    color_theme TEXT,
    order_number INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);
```

**`library_item_collection`** - Relación N:M
```sql
CREATE TABLE library_item_collection (
    id TEXT PRIMARY KEY,
    library_item_id TEXT NOT NULL,
    library_collection_id TEXT NOT NULL,
    order_number INTEGER DEFAULT 0,
    added_by TEXT,
    added_at INTEGER NOT NULL,
    FOREIGN KEY (library_item_id) REFERENCES library_item(id) ON DELETE CASCADE,
    FOREIGN KEY (library_collection_id) REFERENCES library_collection(id) ON DELETE CASCADE,
    UNIQUE(library_item_id, library_collection_id)
);
```

#### 6. Analytics (3 tablas - Octubre 2025)

**`visitor_tracking`** - Seguimiento de visitas
```sql
CREATE TABLE visitor_tracking (
    id TEXT PRIMARY KEY,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    page_visited TEXT NOT NULL,
    visited_at INTEGER NOT NULL,
    session_id TEXT
);
```

**`download_tracking`** - Seguimiento de descargas
```sql
CREATE TABLE download_tracking (
    id TEXT PRIMARY KEY,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    downloaded_at INTEGER NOT NULL,
    ip_address TEXT,
    user_id TEXT
);
```

### Relaciones de Foreign Keys

```
Usuario
  ↓ IdRol
Rol

material_apoyo
  ↓ id
modulo
  ↓ id
module_post
  ↓ id
post_element

blog_post
  ↓ id                    ↓ id
blog_post_element    blog_post_event
                         ↓ event_id
                     event

library_item ←→ library_item_collection ←→ library_collection
```

### Índices Implementados

Cada tabla tiene índices optimizados para:
- Búsquedas por ID
- Filtros por estado (is_active, is_featured)
- Ordenamiento (order_number, created_at)
- Relaciones (foreign keys)

---

## 🔐 Sistema de Autenticación

### Arquitectura JWT

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Cliente   │────────▶│   Backend    │────────▶│  Base Datos  │
│  (Browser)  │◀────────│   (API)      │◀────────│   (SQLite)   │
└─────────────┘         └──────────────┘         └──────────────┘
      │                        │
      │  1. POST /api/auth/login
      │     {username, password}
      │───────────────────────▶│
      │                        │  2. Verificar credenciales
      │                        │──────────────────────────▶│
      │                        │◀──────────────────────────│
      │                        │  3. Generar JWT
      │  4. {token, user}      │
      │◀───────────────────────│
      │                        │
      │  5. Guardar en localStorage
      │
      │  6. Requests con Bearer token
      │     Authorization: Bearer {token}
      │───────────────────────▶│
      │                        │  7. Validar JWT
      │                        │  8. Verificar expiración
      │  9. Response           │
      │◀───────────────────────│
```

### Flujo de Autenticación

#### 1. Login
```typescript
// Frontend: jwtService.ts
async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success && data.token) {
        this.setToken(data.token);
        this.setUser(data.user);
    }

    return data;
}
```

```csharp
// Backend: SimpleAuthController.cs
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request) {
    // 1. Buscar usuario en base de datos
    var user = await GetUserFromDatabase(request.username);

    // 2. Verificar contraseña
    if (!VerifyPassword(request.password, user.Contrasena)) {
        return Unauthorized(new { success = false });
    }

    // 3. Generar token JWT
    var token = _jwtService.GenerateToken(
        user.IdUsuario,
        user.NombreUsuario,
        user.Role
    );

    return Ok(new {
        success = true,
        token = token,
        user = new { id, username, role }
    });
}
```

#### 2. Validación de Token

```typescript
// Frontend: Verificar autenticación
isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Verificar expiración
    if (this.isTokenExpired(token)) {
        this.removeToken();
        authModalStore.showSessionExpired();
        return false;
    }

    return true;
}
```

#### 3. Autorización por Roles

```typescript
// Frontend: Verificar permisos
canManageContent(): boolean {
    const user = this.getUser();
    return user?.role === 'administrador' ||
           user?.role === 'colaborador';
}

isAdmin(): boolean {
    return this.getUser()?.role === 'administrador';
}
```

### Roles y Permisos

| Rol | Permisos | Descripción |
|-----|----------|-------------|
| **asistente** | Solo lectura | Acceso público sin autenticación |
| **colaborador** | Crear/Editar propio | Puede gestionar su propio contenido |
| **administrador** | Acceso completo | Control total del sistema |

### Storage de Tokens

```typescript
// localStorage (persistente)
localStorage.setItem('jwt_token', token);
localStorage.setItem('jwt_user', JSON.stringify(user));

// Limpieza automática
- Al cerrar navegador (opcional)
- Al expirar token
- Al hacer logout
```

---

## 🔌 APIs y Endpoints

### Resumen de Endpoints

```
Total de Endpoints:        36 APIs REST
Backend .NET:              10 Controllers
Frontend SvelteKit:        36 API Routes
Métodos soportados:        GET, POST, PUT, DELETE
Formato de datos:          JSON
Autenticación:             JWT Bearer Token
```

### Frontend API Routes (36 endpoints)

#### Autenticación (3 endpoints)
```
POST   /api/auth/login          # Login con JWT
POST   /api/auth/logout         # Logout y revocación de token
GET    /api/auth/validate       # Validar token actual
```

#### Material Educativo (7 endpoints)
```
GET    /api/material-apoyo                # Listar todo el material
POST   /api/material-apoyo                # Crear material
GET    /api/material-apoyo/all            # Obtener todo (sin paginación)
GET    /api/material-apoyo/featured       # Material destacado
GET    /api/material-apoyo/statistics     # Estadísticas
GET    /api/material-apoyo/[id]           # Obtener por ID
PUT    /api/material-apoyo/[id]           # Actualizar
DELETE /api/material-apoyo/[id]           # Eliminar (cascade)

# Módulos
GET    /api/material-apoyo/modules        # Listar módulos
POST   /api/material-apoyo/modules        # Crear módulo
GET    /api/material-apoyo/modules/[id]   # Obtener módulo
PUT    /api/material-apoyo/modules/[id]   # Actualizar módulo
DELETE /api/material-apoyo/modules/[id]   # Eliminar módulo (cascade)
```

#### Blog (5 endpoints)
```
GET    /api/blog                  # Listar posts
POST   /api/blog                  # Crear post
GET    /api/blog/featured         # Posts destacados
GET    /api/blog/recent           # Posts recientes
GET    /api/blog/slug/[slug]      # Obtener por slug
GET    /api/blog/[id]             # Obtener por ID
PUT    /api/blog/[id]             # Actualizar
DELETE /api/blog/[id]             # Eliminar (cascade)
```

#### Biblioteca Digital (13 endpoints)
```
# Items
GET    /api/digitallibrary/items          # Listar items
POST   /api/digitallibrary/items          # Crear item
GET    /api/digitallibrary/items/[id]     # Obtener item
PUT    /api/digitallibrary/items/[id]     # Actualizar item
DELETE /api/digitallibrary/items/[id]     # Eliminar item
GET    /api/digitallibrary/items/[id]/view      # Ver (incrementa contador)
POST   /api/digitallibrary/items/[id]/download  # Descargar (incrementa contador)

# Colecciones
GET    /api/digitallibrary/collections            # Listar colecciones
POST   /api/digitallibrary/collections            # Crear colección
GET    /api/digitallibrary/collections/[id]       # Obtener colección
PUT    /api/digitallibrary/collections/[id]       # Actualizar colección
DELETE /api/digitallibrary/collections/[id]       # Eliminar colección

# Filtros
GET    /api/digitallibrary/filters/authors        # Obtener autores únicos
GET    /api/digitallibrary/filters/categories     # Obtener categorías únicas
GET    /api/digitallibrary/filters/languages      # Obtener idiomas únicos
GET    /api/digitallibrary/filters/tags           # Obtener tags únicos
GET    /api/digitallibrary/filters/years          # Obtener años únicos

# Estadísticas
GET    /api/digitallibrary/stats          # Estadísticas generales
```

#### Upload (6 endpoints)
```
POST   /api/upload/images                     # Subir imagen genérica
POST   /api/upload/videos                     # Subir video genérico
POST   /api/upload/blog/[blogPostId]          # Subir multimedia de blog
POST   /api/upload/library/[itemId]           # Subir archivo de biblioteca
POST   /api/upload/posts/[postId]             # Subir multimedia de post
```

#### Otros (2 endpoints)
```
POST   /api/cleanup/media             # Limpieza manual de archivos huérfanos
GET    /api/blogcategory              # Categorías de blog
POST   /api/post-elements-stub        # Stub de elementos
```

#### Servicio de Archivos (1 endpoint)
```
GET    /media/[...path]               # Servir archivos multimedia
```

### Backend .NET Controllers (10 controllers)

| Controller | Base Route | Endpoints | Descripción |
|------------|-----------|-----------|-------------|
| `SimpleAuthController` | `/api/auth` | 2 | Autenticación JWT |
| `MaterialApoyoController` | `/api/material-apoyo` | ~8 | Material educativo |
| `BlogController` | `/api/blog` | ~6 | Sistema de blog |
| `BlogPostElementController` | `/api/blog-elements` | ~4 | Elementos de blog |
| `CalendarController` | `/api/calendar` | ~6 | Eventos |
| `DigitalLibraryController` | `/api/library` | ~10 | Biblioteca |
| `PostElementController` | `/api/post-elements` | ~4 | Elementos de posts |
| `UploadController` | `/api/upload` | ~4 | Subida de archivos |
| `AnalyticsController` | `/api/analytics` | ~3 | Analytics |
| `UserManagementController` | `/api/users` | ~5 | Usuarios |

### Respuestas API Estándar

#### Éxito (200 OK)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

#### Error (4xx / 5xx)
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": ["detalle 1", "detalle 2"]
}
```

#### Lista con paginación
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 50,
    "totalPages": 5
  }
}
```

---

## 🎥 Sistema Multimedia

### Estructura de Directorios

```
Back/Data/media/
├── material-apoyo/              # Material educativo
│   └── {material-id}/
│       ├── banner.jpg           # Banner del material
│       └── modules/
│           └── {module-id}/
│               └── posts/
│                   └── {post-id}/
│                       ├── images/
│                       ├── videos/
│                       └── audio/
│
├── blog/                        # Sistema de blog
│   └── {blog-post-id}/
│       ├── featured-image.jpg
│       ├── images/
│       ├── videos/
│       └── documents/
│
├── library/                     # Biblioteca digital (estructura simple)
│   └── {item-id}_{timestamp}_{filename}.{ext}
│
├── content/                     # Otros contenidos
│   └── Arte y Música/
│
└── user-content/                # Contenido de usuarios
    └── profiles/
        └── {user-id}/
            └── avatar.jpg
```

### Formatos Soportados

#### Imágenes (límite: 20MB)
- JPEG/JPG, PNG, GIF, WebP
- SVG, AVIF, BMP, TIFF

#### Videos (límite: 500MB directo / 5GB nginx)
- MP4, WebM, AVI, MOV

#### Audio (límite: 100MB)
- MP3, WAV, OGG, M4A

#### Documentos (límite: 100MB)
- PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT

### Flujo de Upload

```
1. Cliente selecciona archivo
   ↓
2. Frontend valida formato y tamaño
   ↓
3. POST /api/upload/{tipo}/{id}
   ↓
4. Backend valida y guarda archivo
   ↓
5. Actualiza BD con file_path
   ↓
6. Retorna URL de acceso
   ↓
7. Cliente muestra archivo
```

### Limpieza Automática

#### Al reemplazar archivo
```typescript
// Elimina archivo anterior automáticamente
if (existingFilePath) {
    await deleteMediaFile(existingFilePath);
}
await saveNewFile(newFile);
```

#### Al eliminar contenido
```typescript
// DELETE en cascada elimina archivos asociados
DELETE FROM material_apoyo WHERE id = '...'
→ Elimina material + módulos + posts + TODOS los archivos
```

#### Limpieza manual
```typescript
POST /api/cleanup/media
{
    "cleanOrphaned": true,    // Archivos sin referencia en BD
    "cleanTemp": true,        // Archivos temporales antiguos
    "dryRun": false          // Simular sin borrar
}
```

### Utilidades de Limpieza

```typescript
// Front/src/lib/server/utils/mediaCleanup.ts

deleteMediaFile(path: string): Promise<void>
deleteMediaFiles(paths: string[]): Promise<void>
replaceMediaFile(oldPath: string, newFile: File): Promise<string>
cleanOrphanedFiles(): Promise<string[]>
cleanTempFiles(maxAgeHours: number): Promise<string[]>
mediaFileExists(path: string): Promise<boolean>
getMediaFileSize(path: string): Promise<number>
```

---

## 📦 Módulos Funcionales

### 1. Material Educativo (Material de Apoyo)

#### Descripción
Sistema jerárquico para gestionar cursos educativos organizados en módulos y posts.

#### Jerarquía
```
Material de Apoyo (Curso)
  ├── Módulo 1
  │   ├── Post 1
  │   │   ├── Elemento: Título
  │   │   ├── Elemento: Texto
  │   │   ├── Elemento: Imagen
  │   │   └── Elemento: Video
  │   └── Post 2
  └── Módulo 2
```

#### Entidades
- **MaterialApoyo**: Curso principal
- **Modulo**: Lecciones agrupadas
- **ModulePost**: Contenido específico
- **PostElement**: Elementos modulares (título, texto, multimedia)

#### Rutas Frontend
```
/material-apoyo                 # Lista de materiales
/material-apoyo/create          # Crear material
/material-apoyo/[id]            # Ver/editar material
/modules/[id]                   # Ver módulo
```

#### APIs
```
GET    /api/material-apoyo
GET    /api/material-apoyo/[id]
POST   /api/material-apoyo
PUT    /api/material-apoyo/[id]
DELETE /api/material-apoyo/[id]  # CASCADE: elimina módulos, posts, elementos, archivos
```

### 2. Blog y Noticias

#### Descripción
Sistema de publicación de contenido con elementos modulares y relación con eventos.

#### Características
- Posts con slug único (SEO-friendly)
- Sistema de publicación (draft/published)
- Posts destacados
- Contador de vistas
- Relación N:M con eventos
- Elementos modulares (texto, imágenes, videos)

#### Entidades
- **BlogPost**: Post del blog
- **BlogPostElement**: Elementos del post
- **BlogPostEvent**: Relación con eventos

#### Rutas Frontend
```
/blog                    # Lista de posts
/blog/create             # Crear post
/blog/[slug]             # Ver post (por slug)
```

#### APIs
```
GET    /api/blog
GET    /api/blog/slug/[slug]
GET    /api/blog/featured
GET    /api/blog/recent
POST   /api/blog
PUT    /api/blog/[id]
DELETE /api/blog/[id]  # CASCADE: elimina elementos y archivos
```

### 3. Eventos y Calendario

#### Descripción
Sistema de gestión de eventos con soporte para recurrencia.

#### Características
- Eventos simples y recurrentes
- Patrones de recurrencia (diario, semanal, mensual)
- Eventos de todo el día
- Relación con blog posts
- Tipos de evento configurables

#### Entidades
- **Event**: Evento del calendario

#### Rutas Frontend
```
/calendar                # Vista de calendario
/calendar/create         # Crear evento
/calendar/event/[id]     # Ver/editar evento
```

#### Campos Principales
```typescript
{
    title: string
    description: string
    start_date_time: number (unix)
    end_date_time: number (unix)
    is_all_day: boolean
    location: string
    event_type: string
    is_recurring: boolean
    recurrence_pattern: string  // Daily, Weekly, Monthly
    recurrence_days_of_week: string  // "1,3,5" para Lun,Mie,Vie
    related_blog_post_id: string
}
```

### 4. Biblioteca Digital

#### Descripción
Sistema de gestión de recursos digitales (PDFs, videos, documentos) con colecciones y filtros avanzados.

#### Características
- Subida de archivos multimedia
- Colecciones organizadas
- Filtros avanzados (autor, categoría, idioma, año, tags)
- Contador de descargas y visualizaciones
- Items destacados

#### Entidades
- **LibraryItem**: Recurso de biblioteca
- **LibraryCollection**: Colección de recursos
- **LibraryItemCollection**: Relación N:M

#### Rutas Frontend
```
/library                 # Lista de recursos
/library/create          # Subir recurso
/library/edit/[id]       # Editar recurso
/library/[id]            # Ver recurso
```

#### APIs
```
GET    /api/digitallibrary/items
GET    /api/digitallibrary/items/[id]
POST   /api/digitallibrary/items
PUT    /api/digitallibrary/items/[id]
DELETE /api/digitallibrary/items/[id]

GET    /api/digitallibrary/filters/authors
GET    /api/digitallibrary/filters/categories
GET    /api/digitallibrary/stats
```

#### Filtros Disponibles
- Autor
- Categoría y subcategoría
- Idioma
- Año
- Tags
- Tipo de archivo (video, audio, document, image)

---

## 🔄 Flujos de Trabajo

### Flujo de Creación de Material Educativo

```
1. Usuario autenticado (colaborador/admin)
   ↓
2. Navega a /material-apoyo/create
   ↓
3. Completa formulario:
   - Título
   - Descripción
   - Banner (imagen)
   ↓
4. POST /api/material-apoyo
   ↓
5. Sistema crea registro en BD
   ↓
6. Redirige a /material-apoyo/[id]
   ↓
7. Crear módulos:
   - POST /api/material-apoyo/modules
   ↓
8. Para cada módulo, crear posts:
   - POST /api/material-apoyo/modules/[id]/posts
   ↓
9. Para cada post, agregar elementos:
   - Subir imágenes: POST /api/upload/posts/[postId]
   - Subir videos: POST /api/upload/posts/[postId]
   - Agregar textos: en content del post
```

### Flujo de Publicación de Blog Post

```
1. Usuario autenticado (colaborador/admin)
   ↓
2. Navega a /blog/create
   ↓
3. Completa formulario:
   - Título
   - Subtítulo
   - Slug (auto-generado)
   - Contenido (elementos)
   ↓
4. Agrega elementos modulares:
   - Títulos
   - Textos
   - Imágenes (upload)
   - Videos (upload)
   ↓
5. Guarda como draft:
   POST /api/blog { is_published: false }
   ↓
6. Previsualiza
   ↓
7. Publica:
   PUT /api/blog/[id] { is_published: true }
   ↓
8. Post visible en /blog y homepage
```

### Flujo de Subida a Biblioteca

```
1. Usuario autenticado (colaborador/admin)
   ↓
2. Navega a /library/create
   ↓
3. Selecciona archivo (PDF, video, etc.)
   ↓
4. Valida formato y tamaño en frontend
   ↓
5. Completa metadatos:
   - Título
   - Descripción
   - Autor
   - Categoría
   - Tags
   - Idioma
   - Año
   ↓
6. POST /api/digitallibrary/items
   - Sube archivo
   - Guarda en Back/Data/media/library/
   - Crea registro en BD
   ↓
7. Opcionalmente agrega a colección:
   POST /api/digitallibrary/collections/[id]/items
   ↓
8. Item disponible en /library
```

### Flujo de Autenticación

```
1. Usuario visita /auth/login
   ↓
2. Ingresa username y password
   ↓
3. POST /api/auth/login
   ↓
4. Backend valida credenciales:
   - Busca en tabla Usuario
   - Verifica contraseña
   - Obtiene rol desde tabla Rol
   ↓
5. Backend genera JWT token:
   - Incluye: userId, username, role
   - Expiración: 7 días
   ↓
6. Frontend guarda token:
   - localStorage.setItem('jwt_token', token)
   - localStorage.setItem('jwt_user', user)
   ↓
7. Todas las requests usan header:
   Authorization: Bearer {token}
   ↓
8. Backend valida token en cada request
   ↓
9. Si token expira:
   - Frontend detecta expiración
   - Muestra SessionExpiredModal
   - Limpia localStorage
   - Redirige a /auth/login
```

### Flujo de Eliminación en Cascada

```
Ejemplo: DELETE material de apoyo

1. Usuario admin hace DELETE
   ↓
2. DELETE /api/material-apoyo/[id]
   ↓
3. Backend ejecuta:
   - DELETE FROM material_apoyo WHERE id = '...'
   ↓
4. SQLite ejecuta CASCADE:
   - DELETE FROM modulo WHERE material_apoyo_id = '...'
   - DELETE FROM module_post WHERE module_id IN (...)
   - DELETE FROM post_element WHERE post_id IN (...)
   ↓
5. Backend limpia archivos:
   - Lee todos los file_path de registros eliminados
   - Ejecuta deleteMediaFiles(paths)
   - Elimina archivos físicos del disco
   ↓
6. Retorna respuesta exitosa
   ↓
7. Frontend actualiza lista
```

---

## 📝 Comandos Útiles

### Frontend

```bash
# Desarrollo
cd Front/
npm install
npm run dev              # http://localhost:5173

# Build
npm run build            # Compilar para producción
npm run preview          # Preview de build

# Testing
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright E2E tests

# Calidad de código
npm run check            # TypeScript type checking
npm run format           # Prettier formatting
npm run lint             # ESLint

# Storybook
npm run storybook        # Iniciar Storybook
```

### Backend

```bash
# Desarrollo
cd Back/
dotnet restore
dotnet run               # http://localhost:5251

# Build
dotnet build             # Compilar proyecto
dotnet build --configuration Release

# Testing
dotnet test              # Ejecutar tests

# Database
# La base de datos SQLite se conecta automáticamente
# No requiere migraciones con Entity Framework
```

### Base de Datos

```bash
# Acceder a SQLite (si el archivo no está bloqueado)
sqlite3 Data/ccpvj.db

# Comandos SQLite útiles
.tables                  # Listar tablas
.schema table_name       # Ver esquema de tabla
PRAGMA foreign_keys = ON;  # Habilitar foreign keys
PRAGMA foreign_key_check;  # Verificar integridad FK
PRAGMA integrity_check;    # Verificar integridad BD
```

---

## 🚀 Próximas Mejoras

### Corto Plazo
- [ ] Testing integral (unit + E2E)
- [ ] Optimización de rendimiento
- [ ] Cache de consultas frecuentes
- [ ] Documentación de usuario

### Mediano Plazo
- [ ] Sistema de notificaciones
- [ ] Dashboard de analytics mejorado
- [ ] Búsqueda global full-text
- [ ] Sistema de comentarios

### Largo Plazo
- [ ] Modo offline completo (Service Workers)
- [ ] Sincronización multi-dispositivo
- [ ] Red mesh local
- [ ] PWA (Progressive Web App)

---

## 📞 Información de Contacto

**Proyecto**: Centro Cultural Víctor Jara
**Ubicación**: Bogotá, Colombia
**Estado**: ✅ Sistema completamente funcional (Octubre 2025)

---

*Documento generado automáticamente mediante análisis del codebase*
*Última actualización: Octubre 2025*
