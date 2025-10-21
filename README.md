# Centro Cultural Víctor Jara - Plataforma Web Educativa

> **Estado**: ✅ **SISTEMA COMPLETAMENTE FUNCIONAL** (Octubre 2025)

## 📌 Resumen Ejecutivo

Plataforma web educativa offline-first para el Centro Cultural Víctor Jara en Bogotá, diseñada para funcionar en redes locales mesh sin dependencia de internet.

### 🎯 Objetivo

Crear una plataforma educativa y cultural que permita:
- ✅ Gestión de material educativo organizado en módulos
- ✅ Sistema de blog y noticias del centro
- ✅ Calendario de eventos con recurrencia
- ✅ Biblioteca digital con recursos multimedia
- ✅ Autenticación con roles diferenciados
- ✅ Sistema multimedia contextual integrado

---

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js** 18+ (para frontend)
- **.NET 8 SDK** (opcional para backend)
- **SQLite** (incluido)

### Ejecutar el Proyecto

#### Frontend (Principal)
```bash
cd Front/
npm install
npm run dev
```
**Disponible en**: http://localhost:5173

#### Backend (Opcional)
```bash
cd Back/
dotnet restore
dotnet run
```
**Disponible en**: http://localhost:5251

---

## 🛠️ Stack Tecnológico

### Frontend (Principal)
- **SvelteKit 5** - Framework web moderno y reactivo
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 4** - Framework CSS utility-first
- **Vite 7** - Build tool ultrarrápido

### Backend (Opcional)
- **.NET 8** - APIs REST complementarias
- **Entity Framework Core** - ORM para SQLite
- **ASP.NET Core** - Framework web

### Base de Datos
- **SQLite** - Base de datos local embebida
- **Ubicación**: `Data/ccpvj.db`
- **Foreign Keys**: Habilitadas
- **Tablas**: 16 tablas activas

### Autenticación
- **JWT (JSON Web Tokens)** - Tokens de autenticación
- **Algoritmo**: HS256
- **Expiración**: Configurable (default 7 días)
- **Storage**: localStorage (frontend)

---

## 📁 Estructura del Proyecto

```
ccpvj/
├── Front/                      # 🎨 Frontend SvelteKit (Principal)
│   ├── src/
│   │   ├── routes/            # Páginas y API endpoints (36 APIs)
│   │   └── lib/
│   │       ├── components/    # Componentes Svelte
│   │       ├── services/      # Servicios HTTP (13 servicios)
│   │       └── server/        # Utilidades server-side
│   └── package.json
│
├── Back/                       # 🔧 Backend .NET (Opcional)
│   ├── CentroCultural.API/          # Controllers (10 controllers)
│   ├── CentroCultural.Application/  # Services y DTOs
│   ├── CentroCultural.Domain/       # Entities (13 entidades)
│   ├── CentroCultural.Infrastructure/ # DbContext y servicios
│   └── Data/
│       └── media/             # Archivos multimedia organizados
│
├── Data/                       # 🗄️ Base de Datos y Scripts
│   ├── ccpvj.db               # Base de datos SQLite
│   └── sqlite3.exe            # CLI de SQLite
│
├── Documentation/              # 📚 Documentación Técnica
│   ├── README.md              # Documentación general
│   ├── DATABASE_SCHEMA.md     # Esquema de BD
│   ├── PROJECT_STRUCTURE.md   # Estructura del proyecto
│   ├── CLAUDE.md              # Contexto para IA
│   ├── ANALYTICS_IMPLEMENTATION.md # Sistema de analytics
│   ├── CONFIGURATION.md       # Variables de entorno
│   └── DEPLOYMENT_UBUNTU_STEPBYSTEP.md # Guía de despliegue
│
├── ARCHITECTURE_MAP.md         # 🏗️ Mapa arquitectónico completo
└── README.md                   # Este archivo
```

---

## ✅ Módulos Funcionales

### 1. 📚 Material de Apoyo (Sistema Educativo)

Sistema jerárquico para gestionar cursos educativos:

```
Material de Apoyo (Curso)
  ├── Módulo 1
  │   ├── Post 1 (con multimedia)
  │   └── Post 2 (con multimedia)
  └── Módulo 2
      └── Posts con elementos modulares
```

**Rutas**:
- `/material-apoyo` - Lista de materiales
- `/material-apoyo/create` - Crear material
- `/material-apoyo/[id]` - Ver/editar material
- `/modules/[id]` - Ver módulo

**APIs**: 7 endpoints completos

### 2. 📝 Blog y Noticias

Sistema de publicación con elementos modulares:

**Características**:
- Posts con slug SEO-friendly
- Sistema de publicación (draft/published)
- Posts destacados y recientes
- Contador de vistas
- Relación con eventos
- Elementos modulares (texto, imagen, video)

**Rutas**:
- `/blog` - Lista de posts
- `/blog/create` - Crear post
- `/blog/[slug]` - Ver post

**APIs**: 5 endpoints completos

### 3. 📅 Eventos y Calendario

Gestión de eventos con soporte para recurrencia:

**Características**:
- Eventos simples y recurrentes
- Patrones: diario, semanal, mensual, anual
- Eventos de todo el día
- Tipos configurables
- Relación con blog posts

**Rutas**:
- `/calendar` - Calendario de eventos
- `/calendar/create` - Crear evento
- `/calendar/event/[id]` - Ver/editar evento

### 4. 📚 Biblioteca Digital

Sistema de gestión de recursos con filtros avanzados:

**Características**:
- Subida de archivos multimedia
- Colecciones organizadas
- Filtros: autor, categoría, idioma, año, tags
- Contadores de descargas y visualizaciones
- Items destacados

**Rutas**:
- `/library` - Lista de recursos
- `/library/create` - Subir recurso
- `/library/[id]` - Ver recurso

**APIs**: 13 endpoints completos

---

## 🎥 Sistema Multimedia

### Estructura de Archivos

```
Back/Data/media/
├── material-apoyo/              # Material educativo
│   └── {material-id}/
│       ├── banner.jpg
│       └── modules/{module-id}/posts/{post-id}/
│           ├── images/
│           ├── videos/
│           └── audio/
│
├── blog/                        # Blog y noticias
│   └── {blog-post-id}/
│       ├── featured-image.jpg
│       ├── images/
│       └── videos/
│
├── library/                     # Biblioteca (estructura simple)
│   └── {item-id}_{timestamp}_{filename}.ext
│
└── content/                     # Otros contenidos
```

### Formatos Soportados

- **Imágenes** (20MB): JPEG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF
- **Videos** (500MB): MP4, WebM, AVI, MOV
- **Audio** (100MB): MP3, WAV, OGG, M4A
- **Documentos** (100MB): PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT

### Limpieza Automática

- ✅ Eliminación en cascada (DELETE CASCADE)
- ✅ Limpieza de archivos huérfanos
- ✅ Limpieza automática al reemplazar archivos
- ✅ Endpoint manual: `POST /api/cleanup/media`

---

## 🔐 Sistema de Autenticación

### Método: JWT (JSON Web Tokens)

```typescript
// Login
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

// Response
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "administrador"
  }
}

// Uso en requests
Headers: {
  "Authorization": "Bearer eyJhbGc..."
}
```

### Roles y Permisos

| Rol | Permisos | Autenticación |
|-----|----------|---------------|
| **asistente** | Solo lectura | No requerida |
| **colaborador** | Crear/editar contenido propio | Requerida |
| **administrador** | Acceso completo | Requerida |

---

## 🔌 APIs Disponibles

### Total de Endpoints: 36 APIs REST

#### Autenticación (3)
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/validate
```

#### Material Educativo (7)
```
GET    /api/material-apoyo
POST   /api/material-apoyo
GET    /api/material-apoyo/[id]
PUT    /api/material-apoyo/[id]
DELETE /api/material-apoyo/[id]
GET    /api/material-apoyo/modules
GET    /api/material-apoyo/modules/[id]
```

#### Blog (5)
```
GET    /api/blog
POST   /api/blog
GET    /api/blog/featured
GET    /api/blog/recent
GET    /api/blog/slug/[slug]
```

#### Biblioteca Digital (13)
```
GET    /api/digitallibrary/items
POST   /api/digitallibrary/items
GET    /api/digitallibrary/items/[id]
GET    /api/digitallibrary/items/[id]/download
GET    /api/digitallibrary/collections
GET    /api/digitallibrary/filters/authors
GET    /api/digitallibrary/filters/categories
... y más
```

#### Multimedia (6)
```
POST   /api/upload/images
POST   /api/upload/videos
POST   /api/upload/blog/[blogPostId]
POST   /api/upload/library/[itemId]
POST   /api/upload/posts/[postId]
GET    /media/[...path]
```

Ver **`ARCHITECTURE_MAP.md`** para documentación completa de APIs.

---

## 🗄️ Base de Datos

### Información General

- **Motor**: SQLite 3
- **Archivo**: `Data/ccpvj.db`
- **Foreign Keys**: Habilitadas (`PRAGMA foreign_keys = ON`)
- **Tablas**: 16 tablas activas
- **Timestamps**: Unix epoch (INTEGER)

### Tablas Principales

#### Autenticación
- `Rol` - Roles del sistema (3 roles)
- `Usuario` - Usuarios con credenciales

#### Material Educativo
- `material_apoyo` - Material educativo principal
- `modulo` - Módulos del material
- `module_post` - Posts/contenido
- `post_element` - Elementos modulares

#### Blog
- `blog_post` - Posts del blog
- `blog_post_element` - Elementos del blog
- `blog_post_event` - Relación blog-eventos

#### Eventos
- `event` - Eventos con recurrencia

#### Biblioteca
- `library_item` - Recursos de biblioteca
- `library_collection` - Colecciones
- `library_item_collection` - Relación N:M

#### Analytics (Octubre 2025)
- `visitor_tracking` - Seguimiento de visitas
- `download_tracking` - Seguimiento de descargas

Ver **`Documentation/DATABASE_SCHEMA.md`** para esquemas completos.

---

## 🚨 Credenciales de Prueba

```
Usuario: admin
Contraseña: admin123
Rol: administrador
```

**Nota**: Cambiar en producción.

---

## 📝 Comandos Útiles

### Frontend

```bash
cd Front/

# Desarrollo
npm install              # Instalar dependencias
npm run dev              # Servidor desarrollo (puerto 5173)

# Build y Testing
npm run build            # Build producción
npm run preview          # Preview de build
npm run test             # Tests unitarios (Vitest)
npm run test:e2e         # Tests E2E (Playwright)

# Calidad de código
npm run check            # Type checking
npm run format           # Formateo (Prettier)
npm run lint             # Linting (ESLint)

# Storybook
npm run storybook        # Desarrollo de componentes
```

### Backend

```bash
cd Back/

# Desarrollo
dotnet restore           # Restaurar dependencias
dotnet run               # Ejecutar (puerto 5251)

# Build y Testing
dotnet build             # Compilar
dotnet build --configuration Release  # Build producción
dotnet test              # Ejecutar tests
```

### Base de Datos

```bash
# Acceder a SQLite CLI (cuando no esté en uso)
sqlite3 Data/ccpvj.db

# Comandos útiles
.tables                  # Listar tablas
.schema table_name       # Ver esquema
PRAGMA foreign_keys = ON; # Habilitar FK
PRAGMA integrity_check;  # Verificar integridad
```

---

## 📚 Documentación Completa

### Documentos Principales

| Documento | Descripción |
|-----------|-------------|
| **[ARCHITECTURE_MAP.md](ARCHITECTURE_MAP.md)** | Mapa arquitectónico completo y detallado |
| **[Documentation/README.md](Documentation/README.md)** | Documentación técnica general |
| **[Documentation/DATABASE_SCHEMA.md](Documentation/DATABASE_SCHEMA.md)** | Esquema completo de base de datos |
| **[Documentation/PROJECT_STRUCTURE.md](Documentation/PROJECT_STRUCTURE.md)** | Estructura organizacional del código |
| **[Documentation/CLAUDE.md](Documentation/CLAUDE.md)** | Contexto técnico para desarrollo con IA |
| **[Documentation/ANALYTICS_IMPLEMENTATION.md](Documentation/ANALYTICS_IMPLEMENTATION.md)** | Sistema de métricas y analytics |
| **[Documentation/CONFIGURATION.md](Documentation/CONFIGURATION.md)** | Variables de entorno y configuración |
| **[Documentation/DEPLOYMENT_UBUNTU_STEPBYSTEP.md](Documentation/DEPLOYMENT_UBUNTU_STEPBYSTEP.md)** | Guía paso a paso para despliegue |

### Documentos Específicos

| Documento | Descripción |
|-----------|-------------|
| **[Front/README.md](Front/README.md)** | Frontend SvelteKit - Guía completa |
| **[Back/README.md](Back/README.md)** | Backend .NET - Guía completa |

---

## 🎯 Características Destacadas

### ✅ Completamente Funcional

- 4 módulos principales operativos
- 36 endpoints API funcionales
- Sistema de autenticación JWT completo
- Multimedia con limpieza automática
- DELETE CASCADE implementado
- Analytics con tracking de visitas y descargas

### ✅ Arquitectura Moderna

- Frontend-first con SvelteKit 5
- Backend opcional .NET 8
- Base de datos SQLite embebida
- TypeScript para type safety
- Componentización con Svelte

### ✅ Diseño Offline-First

- Preparado para redes locales mesh
- Base de datos local SQLite
- Sin dependencia de internet
- Multimedia almacenada localmente

### ✅ Sistema Multimedia Robusto

- Upload contextual organizado
- Múltiples formatos soportados
- Limpieza automática de archivos
- Servicio de archivos integrado

---

## 🔄 Flujo de Desarrollo

### 1. Desarrollo Local

```bash
# Terminal 1: Backend (opcional)
cd Back/ && dotnet run

# Terminal 2: Frontend (principal)
cd Front/ && npm run dev

# Navegar a: http://localhost:5173
```

### 2. Agregar Funcionalidad

1. **Frontend**: Agregar ruta en `Front/src/routes/`
2. **API**: Crear endpoint en `Front/src/routes/api/`
3. **Backend (opcional)**: Agregar controller en `Back/CentroCultural.API/Controllers/`
4. **Base de Datos**: Agregar/modificar entidad en `Back/CentroCultural.Domain/Entities/`

### 3. Testing

```bash
# Frontend
cd Front/
npm run test          # Unit tests
npm run test:e2e      # E2E tests

# Backend
cd Back/
dotnet test
```

### 4. Deploy

Ver **`Documentation/DEPLOYMENT_UBUNTU_STEPBYSTEP.md`** para guía completa.

---

## 🚀 Próximas Mejoras

### Corto Plazo
- [ ] Aumentar cobertura de testing
- [ ] Optimización de consultas BD
- [ ] Cache de recursos frecuentes
- [ ] Documentación de usuario final

### Mediano Plazo
- [ ] Sistema de notificaciones
- [ ] Búsqueda global full-text
- [ ] Dashboard de analytics mejorado
- [ ] Sistema de comentarios

### Largo Plazo
- [ ] PWA completo con Service Workers
- [ ] Sincronización multi-dispositivo
- [ ] Red mesh completamente distribuida
- [ ] Modo offline total

---

## 🤝 Contribuir

El proyecto está abierto a contribuciones:

1. Fork del repositorio
2. Crear branch feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

**Importante**:
- Seguir convenciones de código existentes
- Agregar tests para nueva funcionalidad
- Actualizar documentación según corresponda

---

## 📞 Información del Proyecto

**Nombre**: Centro Cultural Víctor Jara
**Ubicación**: Bogotá, Colombia
**Propósito**: Plataforma educativa comunitaria offline-first

**Estado Actual**: ✅ **SISTEMA COMPLETAMENTE FUNCIONAL**
**Última Actualización**: Octubre 2025

---

## 📄 Licencia

Proyecto desarrollado para el Centro Cultural Víctor Jara - Bogotá, Colombia.

---

*Para documentación técnica detallada, consultar [ARCHITECTURE_MAP.md](ARCHITECTURE_MAP.md)*
