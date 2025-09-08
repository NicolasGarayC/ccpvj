# Centro Cultural Víctor Jara - Platform

Una plataforma web completa para centros culturales comunitarios, diseñada para funcionar offline con arquitectura MESH y gestión contextual de multimedia.

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico Principal
- **Frontend**: SvelteKit 5 + TypeScript + TailwindCSS 4.0
- **Backend**: .NET 8 (ASP.NET Core) con arquitectura en capas
- **Base de Datos**: SQLite con Drizzle ORM (Frontend) + Entity Framework (Backend)
- **Servidor Web**: NGINX para proxy inverso y multimedia
- **Autenticación**: Sistema JWT integrado con refresh tokens y renovación automática

### Principio Arquitectónico Central
**🎯 MULTIMEDIA CONTEXTUAL**: Todos los archivos multimedia pertenecen a contenido específico - NO existe multimedia independiente.

```
📚 Sistema Educativo:
Course → Module → WorkItem → [imagen contextual, video tutorial]

📝 Blog:
BlogPost → [imagen destacada, PDF descargable, video embebido]

🎪 Eventos:
Event → [poster promocional, imágenes]
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ y npm/pnpm
- .NET 8 SDK (opcional)
- SQLite

### Configuración de Desarrollo

1. **Clonar e Inicializar**:
```bash
git clone <repository>
cd ccpvj
./init_contextual_database.sh  # Crear base de datos contextual
```

2. **Frontend (Primario)**:
```bash
cd Front/
npm install
npm run dev  # http://localhost:5173
```

3. **Backend (Opcional)**:
```bash
cd Back/
dotnet restore
dotnet run   # http://localhost:5000
```

## 📋 Sistema de Gestión de Contenido

### 🎓 Sistema Educativo Completo

#### Jerarquía de Contenido
1. **Cursos** - Materias principales (Matemáticas, Física, Sociales, Economía)
2. **Módulos** - Lecciones organizadas dentro de cada curso
3. **WorkItems** - Contenido específico con multimedia contextual

#### Características Implementadas
- ✅ **CRUD Completo**: Crear, editar, eliminar cursos, módulos y contenido
- ✅ **Multimedia Contextual**: Imágenes y videos específicos por WorkItem
- ✅ **Reordenamiento**: Drag & drop para organizar módulos y contenido
- ✅ **Búsqueda Avanzada**: Filtros por materia, estado, destacados
- ✅ **Paginación**: Manejo eficiente de grandes volúmenes de contenido
- ✅ **Roles y Permisos**: Control de acceso basado en roles

### 📝 Sistema de Blog

#### Funcionalidades
- ✅ **Posts con Multimedia**: Imágenes destacadas, PDFs, videos contextuales
- ✅ **Categorización**: Organización por categorías
- ✅ **Sistema de Publicación**: Borradores y posts publicados
- ✅ **Editor Integrado**: Formularios con carga multimedia
- ✅ **Vista Pública**: Acceso sin autenticación para lectura

### 👥 Sistema de Roles y Permisos

#### Roles Implementados
1. **🔍 Asistente** (Rol por defecto)
   - ✅ Solo lectura de todo el contenido
   - ✅ No requiere autenticación
   - ❌ No puede crear/editar contenido

2. **✏️ Colaborador**
   - ✅ Puede crear, editar y eliminar contenido
   - ✅ Solo puede editar su propio contenido
   - ✅ Puede crear nuevos usuarios (Asistentes y Colaboradores)
   - ✅ Requiere autenticación

3. **👑 Administrador**
   - ✅ Acceso completo al sistema
   - ✅ Puede editar contenido de cualquier usuario
   - ✅ Gestión completa de usuarios y roles
   - ✅ Puede crear otros Administradores
   - ✅ Acceso a estadísticas y panel administrativo

#### Gestión de Usuarios
- **🚫 Registro Público Deshabilitado**: Solo Administradores y Colaboradores pueden crear nuevos usuarios
- **🔐 Sistema Jerarquico**: Los Colaboradores no pueden crear Administradores
- **📊 Panel de Gestión**: Interface completa para administrar usuarios (/dashboard/users)

## 🛠️ Componentes Desarrollados

### 🎓 Componentes de Cursos
- **CourseList** - Lista de cursos con filtros y búsqueda
- **CourseCard** - Tarjeta individual de curso con acciones
- **CourseForm** - Formulario crear/editar cursos
- **SearchFilters** - Filtros avanzados de búsqueda
- **ModuleList** - Lista de módulos con drag & drop
- **ModuleCard** - Tarjeta de módulo con estadísticas
- **ModuleForm** - Formulario gestión de módulos
- **WorkItemList** - Lista de contenido por módulo
- **WorkItemCard** - Tarjeta de contenido con multimedia
- **WorkItemForm** - Editor de contenido con carga de archivos

### 📝 Componentes de Blog
- **BlogList** - Lista de posts con acciones por rol
- **BlogPostCard** - Tarjeta de post con botones contextuales
- **BlogEditor** - Editor completo con validación de roles
- **MediaUploader** - Componente de carga multimedia contextual

### 🔐 Componentes de Administración
- **UserList** - Lista de usuarios con filtros, búsqueda y paginación
- **UserForm** - Formulario crear/editar usuarios con validación en tiempo real
- **UserManagement** - Panel completo de gestión de usuarios (/dashboard/users)

### 🧩 Componentes Comunes
- **Pagination** - Paginación reutilizable
- **MediaUploader** - Carga contextual de archivos multimedia

## 📚 API Endpoints

### 🔐 Autenticación
```
POST   /api/auth/login         - Login con JWT y refresh tokens
POST   /api/auth/logout        - Cerrar sesión (revoca tokens)
POST   /api/auth/logout-all    - Cerrar sesión en todos los dispositivos
POST   /api/auth/refresh       - Renovar access token
GET    /api/auth/status        - Estado de autenticación actual
```

### 🎓 Cursos
```
GET    /api/course                    - Listar cursos (paginado)
GET    /api/course/all                - Todos los cursos
GET    /api/course/featured           - Cursos destacados
GET    /api/course/{id}               - Curso específico
GET    /api/course/{id}/modules       - Módulos de curso
POST   /api/course                    - Crear curso [Colaborador+]
PUT    /api/course/{id}               - Actualizar curso [Colaborador+]
DELETE /api/course/{id}               - Eliminar curso [Colaborador+]
GET    /api/course/my-courses         - Mis cursos [Colaborador+]
GET    /api/course/subjects           - Materias disponibles
GET    /api/course/statistics         - Estadísticas [Admin]
```

### 📋 Módulos
```
GET    /api/course/modules/{id}       - Módulo específico
POST   /api/course/modules            - Crear módulo [Colaborador+]
PUT    /api/course/modules/{id}       - Actualizar módulo [Colaborador+]
DELETE /api/course/modules/{id}       - Eliminar módulo [Colaborador+]
PATCH  /api/course/modules/{id}/reorder - Reordenar [Colaborador+]
```

### 📝 WorkItems (Contenido)
```
GET    /api/workitem/module/{moduleId}    - WorkItems por módulo
GET    /api/workitem/{id}                 - WorkItem específico
GET    /api/workitem/{id}/media           - Media del WorkItem
POST   /api/workitem                      - Crear WorkItem [Colaborador+]
PUT    /api/workitem/{id}                 - Actualizar [Colaborador+]
DELETE /api/workitem/{id}                 - Eliminar [Colaborador+]
POST   /api/workitem/{id}/reorder         - Reordenar [Colaborador+]
GET    /api/workitem/course/{courseId}/all - Todos los WorkItems del curso
```

### 📝 Blog
```
GET    /api/blog                      - Posts públicos
GET    /api/blog/{id}                 - Post específico
GET    /api/blog/slug/{slug}          - Post por slug
POST   /api/blog                      - Crear post [Colaborador+]
PUT    /api/blog/{id}                 - Actualizar post [Colaborador+]
DELETE /api/blog/{id}                 - Eliminar post [Colaborador+]
POST   /api/blog/{id}/publish         - Publicar [Colaborador+]
POST   /api/blog/{id}/unpublish       - Despublicar [Colaborador+]
```

### 👥 Gestión de Usuarios
```
GET    /api/usermanagement              - Listar usuarios (paginado) [Admin+]
GET    /api/usermanagement/{id}         - Usuario específico [Admin+]
GET    /api/usermanagement/me           - Usuario actual
POST   /api/usermanagement              - Crear usuario [Admin+]
PUT    /api/usermanagement/{id}         - Actualizar usuario [Admin+]
DELETE /api/usermanagement/{id}         - Eliminar usuario [Admin]
PATCH  /api/usermanagement/{id}/status  - Activar/desactivar [Admin+]
PATCH  /api/usermanagement/{id}/role    - Cambiar rol [Admin+]
POST   /api/usermanagement/{id}/reset-password - Resetear contraseña [Admin+]
GET    /api/usermanagement/roles        - Roles disponibles [Admin+]
GET    /api/usermanagement/statistics   - Estadísticas usuarios [Admin]
GET    /api/usermanagement/can-manage   - Verificar permisos gestión
GET    /api/usermanagement/check-username/{username} - Verificar disponibilidad
```

### 📁 Multimedia Contextual
```
POST   /api/upload/course/{id}/images     - Imagen para curso
POST   /api/upload/workitem/{id}/images   - Imagen para WorkItem
POST   /api/upload/workitem/{id}/videos   - Video para WorkItem
POST   /api/upload/blog/{id}/images       - Imagen para blog
POST   /api/upload/blog/{id}/videos       - Video para blog
POST   /api/upload/blog/{id}/documents    - PDF para blog
```

## 🗂️ Estructura del Proyecto

```
ccpvj/
├── 🎨 Front/                          # SvelteKit 5 Frontend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/           # Componentes UI
│   │   │   │   ├── course/          # Componentes de cursos
│   │   │   │   ├── blog/            # Componentes de blog
│   │   │   │   ├── admin/           # Componentes administrativos
│   │   │   │   ├── users/           # Componentes gestión usuarios
│   │   │   │   └── common/          # Componentes reutilizables
│   │   │   ├── services/            # Servicios API
│   │   │   │   ├── course/          # Servicios de cursos
│   │   │   │   ├── blog/            # Servicios de blog
│   │   │   │   ├── users/           # Servicios gestión usuarios
│   │   │   │   └── authService.ts   # Servicio autenticación JWT
│   │   │   ├── utils/               # Utilidades
│   │   │   │   └── roleUtils.ts     # Sistema de roles
│   │   │   └── server/              # Lógica servidor
│   │   │       ├── auth.ts          # Autenticación sesiones (legacy)
│   │   │       └── db/              # Esquema base de datos
│   │   └── routes/
│   │       ├── api/                 # API endpoints
│   │       ├── courses/             # Páginas de cursos
│   │       ├── blog/                # Páginas de blog
│   │       ├── dashboard/           # Panel de control
│   │       │   └── users/           # Panel gestión usuarios
│   │       └── auth/                # Autenticación
├── ⚙️ Back/                          # Backend .NET 8
│   ├── CentroCultural.API/          # Controllers y configuración
│   ├── CentroCultural.Application/  # Servicios y lógica negocio
│   ├── CentroCultural.Domain/       # Entidades y reglas dominio
│   └── CentroCultural.Infrastructure/ # Acceso datos y servicios
├── 🗄️ Data/                         # Base de datos y archivos
│   ├── ccpvj.db                     # SQLite database
│   └── media/                       # Archivos multimedia contextuales
│       ├── courses/                 # Imágenes de cursos
│       ├── workitems/               # Multimedia de WorkItems
│       ├── blog/                    # Archivos de blog
│       └── temp/                    # Uploads temporales
├── 🏗️ Infraestructure/             # Configuración servidor
│   └── nginx/                       # NGINX configs
├── 🧪 tests/                        # Pruebas
├── 📚 Documentation/                # Documentación
└── 📋 Scripts/                      # Scripts utilidad
```

## 🎯 Características Principales

### ✅ Implementado y Funcional

#### 🎓 Sistema Educativo
- **Gestión Completa**: CRUD de Cursos, Módulos y WorkItems
- **Multimedia Contextual**: Carga de imágenes y videos específicos
- **Organización**: Drag & drop para reordenar contenido
- **Búsqueda**: Filtros avanzados y paginación
- **Permisos**: Control por roles (Asistente, Colaborador, Administrador)

#### 📝 Sistema de Blog
- **Editor Completo**: Formularios con carga multimedia contextual
- **Gestión de Estados**: Borradores, publicados, destacados
- **Acceso Público**: Lectura sin autenticación
- **Categorización**: Organización por categorías

#### 👥 Gestión de Usuarios
- **Roles Diferenciados**: Asistente (lectura), Colaborador (edición+creación usuarios), Administrador (completo)
- **Control Granular**: Usuarios solo editan su contenido (excepto Admins)
- **Panel Administrativo**: Gestión completa de usuarios con interfaz dedicada
- **Registro Controlado**: Solo Admin/Colaboradores pueden crear nuevos usuarios
- **Validación en Tiempo Real**: Verificación de username disponible mientras escribes

#### 📁 Multimedia Contextual
- **Sin Archivos Huérfanos**: Toda multimedia pertenece a contenido específico
- **Validación Estricta**: Imposible subir archivos sin contexto
- **Limpieza Automática**: Eliminación en cascada cuando se borra contenido
- **Organización**: Estructura de directorios por tipo de contenido

#### 🔐 Seguridad
- **Autenticación JWT Integrada**: Sistema unificado con refresh tokens
- **Renovación Automática**: Tokens renovados transparentemente al expirar
- **Logout Seguro**: Revocación de tokens con blacklist en backend
- **Almacenamiento Seguro**: Access tokens en localStorage, refresh tokens en cookies httpOnly
- **Permisos Granulares**: Validación en frontend y backend
- **Tiempo de Vida**: Access tokens (15 min), Refresh tokens (7 días)

### 🔄 En Desarrollo

#### 📅 Sistema de Eventos
- Gestión de eventos culturales
- Imágenes promocionales contextuales
- Sistema de inscripciones

#### 🌐 Red MESH
- Sincronización entre nodos
- Funcionamiento completamente offline
- Distribución de contenido

## 🧪 Testing

### Frontend
```bash
cd Front/
npm run test:unit      # Pruebas unitarias (Vitest)
npm run test:e2e       # Pruebas E2E (Playwright)
npm run check          # Verificación TypeScript/Svelte
```

### Backend
```bash
cd Back/
dotnet test            # Pruebas unitarias
```

## 🚀 Despliegue

### Desarrollo
```bash
# Frontend
cd Front/ && npm run dev

# Backend (opcional)
cd Back/ && dotnet run
```

### Producción
```bash
# Build Frontend
cd Front/ && npm run build

# Build Backend
cd Back/ && dotnet publish -c Release

# NGINX
# Configurar archivos en Infraestructure/nginx/
```

## 📖 Documentación Adicional

- **[CLAUDE.md](./Documentation/CLAUDE.md)** - Guía completa para desarrollo
- **[README Técnico](./Documentation/README.md)** - Contexto técnico detallado
- **[Configuración NGINX](./Infraestructure/nginx/)** - Configuraciones servidor
- **[Scripts Base de Datos](./Data/scripts/)** - Scripts SQL y inicialización

## 🤝 Contribución

Este proyecto está diseñado para centros culturales comunitarios. Las contribuciones deben mantener:

1. **Arquitectura Contextual**: Multimedia siempre vinculada a contenido
2. **Roles Diferenciados**: Respeto al sistema de permisos
3. **Eficiencia de Recursos**: Mínimo consumo de CPU/procesamiento
4. **Offline-First**: Funcionamiento sin conexión a internet

## 📄 Licencia

Proyecto desarrollado para Centro Cultural Víctor Jara - Bogotá, Colombia.

## 🏗️ Estado del Proyecto

**🟢 Producción Lista**: Frontend completo con autenticación JWT, gestión de cursos, blog y sistema de usuarios
**🟢 Backend Integrado**: APIs JWT con refresh tokens, gestión de usuarios y multimedia contextual
**🟢 Autenticación Segura**: Sistema JWT profesional con renovación automática y logout seguro
**🟡 NGINX**: Configuraciones preparadas para despliegue
**🔵 MESH**: Infraestructura documentada, implementación pendiente

---

**Desarrollado con ❤️ para la comunidad cultural de Bogotá**