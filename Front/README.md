# Frontend Centro Cultural Víctor Jara - SvelteKit 5

## 📌 Resumen del Frontend

**Sistema Frontend Principal** para la plataforma del Centro Cultural Víctor Jara construido con **SvelteKit 5** como aplicación web moderna **offline-first**.

### 🎯 Estado Actual
- **✅ OPERATIVO**: Sistema completo con autenticación, cursos, blog, biblioteca
- **✅ INDEPENDIENTE**: Puede operar sin backend usando APIs internas
- **✅ MODERNO**: SvelteKit 5, TypeScript, Tailwind CSS 4.0, Drizzle ORM
- **✅ RESPONSIVE**: Interfaz adaptable para diferentes dispositivos
- **✅ CORRECCIONES APLICADAS**: Compatible con backend corregido (Septiembre 2025)

### 🔧 Compatibilidad con Backend (Septiembre 2025)

#### **Servicios Frontend Compatibles**
- ✅ **Tipos de datos**: Interfaces TypeScript ya manejaban tipos correctos
- ✅ **Conversión de fechas**: DTOs esperaban DateTime (compatible con conversiones backend)
- ✅ **AuthorId**: Servicios ya manejaban string correctamente
- ✅ **APIs**: Endpoints completamente funcionales con backend corregido

#### **Sin Cambios Requeridos**
El frontend ya estaba correctamente implementado y es totalmente compatible con las correcciones aplicadas al backend .NET. Los servicios TypeScript y las interfaces de datos coinciden perfectamente con los DTOs corregidos del backend.

---

## 🛠️ Stack Tecnológico

### **Framework Principal**
- **SvelteKit 5** (latest) - Meta-framework para aplicaciones web modernas
- **Svelte 5.0** - Framework reactivo compilado
- **TypeScript 5.0** - Tipado estático completo
- **Vite 7.0** - Build tool ultrarrápido

### **Estilos y UI**
- **Tailwind CSS 4.0** - Framework CSS utility-first
- **@tailwindcss/forms** - Estilos para formularios
- **@tailwindcss/typography** - Tipografía avanzada
- **Font Awesome 6.4** - Iconografía completa

### **Base de Datos**
- **Drizzle ORM 0.40** - ORM TypeScript type-safe
- **@libsql/client** - Cliente SQLite para el navegador
- **SQLite** - Base de datos local (`D:/ccpvj/Data/ccpvj.db`)

### **Autenticación y Seguridad**
- **@oslojs/crypto** - Utilidades criptográficas
- **@oslojs/encoding** - Codificación segura
- **JWT Authentication** - Tokens JSON Web con refresh automático

### **Testing y QA**
- **Vitest 3.2** - Framework de testing ultrarrápido
- **Playwright** - Testing E2E
- **Storybook 9.1** - Desarrollo de componentes
- **Prettier + ESLint** - Formateo y linting

### **Internacionalización**
- **@inlang/paraglide-js** - i18n moderna (parcialmente configurado)
- **MDSvex** - Markdown en componentes Svelte

---

## 🏗️ Arquitectura del Frontend

```
Front/
├── src/
│   ├── app.html                     # Template HTML base
│   ├── routes/                      # Páginas y APIs SvelteKit
│   │   ├── +layout.svelte          # Layout principal
│   │   ├── +page.svelte             # Homepage
│   │   ├── auth/                    # Autenticación
│   │   ├── courses/                 # Sistema educativo
│   │   ├── blog/                    # Blog y noticias
│   │   ├── library/                 # Biblioteca digital
│   │   ├── calendar/                # Eventos y calendario
│   │   ├── dashboard/               # Panel admin
│   │   └── api/                     # APIs internas (62 endpoints)
│   │
│   └── lib/
│       ├── components/              # Componentes Svelte (30+)
│       │   ├── auth/               # Autenticación
│       │   ├── course/             # Sistema educativo
│       │   ├── blog/               # Blog
│       │   ├── library/            # Biblioteca
│       │   ├── calendar/           # Eventos
│       │   ├── common/             # Compartidos
│       │   └── shared/             # Utilidades
│       │
│       ├── services/               # Servicios de datos (8)
│       │   ├── auth/jwtService.ts  # Autenticación JWT
│       │   ├── courseService.ts    # Gestión de cursos
│       │   ├── blog/               # Servicios blog
│       │   ├── library/            # Servicios biblioteca
│       │   └── calendar/           # Servicios eventos
│       │
│       ├── server/                 # Lógica servidor
│       │   ├── db/                 # Base de datos
│       │   │   ├── schema.ts       # Esquema Drizzle
│       │   │   └── index.ts        # Conexión DB
│       │   └── utils/              # Utilidades servidor
│       │       └── mediaCleanup.ts # Limpieza multimedia
│       │
│       ├── data/                   # Tipos y modelos
│       └── config/                 # Configuración
│
├── static/                         # Archivos estáticos
├── tests/                          # Tests E2E
├── stories/                        # Storybook stories
└── drizzle/                        # Migraciones DB
```

---

## 🔑 Sistema de Autenticación

### **JWT Authentication**
```typescript
// JwtService para autenticación con tokens
class JwtService {
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

  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
```

### **Sistema de Roles**
```typescript
// Roles del sistema
type UserRole = 'asistente' | 'colaborador' | 'administrador';

// Permisos por rol
- asistente: Solo lectura, sin autenticación requerida
- colaborador: Crear y editar contenido propio
- administrador: Control total del sistema
```

### **Rutas de Autenticación**
```
/auth/login              # Página de inicio de sesión
/api/auth/login          # Endpoint login
/api/auth/logout         # Endpoint logout
/api/auth/me             # Usuario actual
/api/auth/status         # Estado de sesión
```

---

## 🌐 APIs Implementadas (62 Endpoints)

### **🔐 Autenticación** (`/api/auth/`)
```
POST   /api/auth/login              # Iniciar sesión
POST   /api/auth/logout             # Cerrar sesión
GET    /api/auth/me                 # Usuario actual
GET    /api/auth/status             # Estado autenticación
POST   /api/auth/register           # Registro usuarios
POST   /api/auth/refresh            # Refresh automático
```

### **📚 Sistema Educativo** (`/api/courses/`)
```
GET    /api/courses                 # Lista cursos (paginado)
GET    /api/courses/all             # Todos los cursos
GET    /api/courses/featured        # Cursos destacados
GET    /api/courses/subjects        # Materias disponibles
GET    /api/courses/my-courses      # Cursos del educador
GET    /api/courses/simple          # Cursos simplificados
GET    /api/courses/[id]            # Detalle curso
POST   /api/courses                 # Crear curso
PUT    /api/courses/[id]            # Actualizar curso
DELETE /api/courses/[id]            # Eliminar curso

# Módulos
GET    /api/courses/modules/[id]    # Detalle módulo
POST   /api/courses/modules         # Crear módulo
PUT    /api/courses/modules/[id]    # Actualizar módulo
DELETE /api/courses/modules/[id]    # Eliminar módulo
PATCH  /api/courses/modules/[id]/reorder # Reordenar módulo

# Posts de Módulos
GET    /api/courses/posts/[id]  # Detalle post
POST   /api/courses/posts       # Crear post
PUT    /api/courses/posts/[id]  # Actualizar post
DELETE /api/courses/posts/[id]  # Eliminar post
PATCH  /api/courses/posts/[id]/reorder # Reordenar post
```

### **📝 Blog y Noticias** (`/api/blog/`)
```
GET    /api/blog                    # Lista posts
GET    /api/blog/[id]               # Detalle post
GET    /api/blog/slug/[slug]        # Post por slug
GET    /api/blog/featured           # Posts destacados
GET    /api/blog/recent             # Posts recientes
POST   /api/blog                    # Crear post
PUT    /api/blog/[id]               # Actualizar post
DELETE /api/blog/[id]               # Eliminar post

# Categorías
GET    /api/blogcategory            # Categorías blog
POST   /api/blogcategory            # Crear categoría
```

### **📁 Multimedia y Upload** (`/api/upload/`)
```
POST   /api/upload/images           # Subir imágenes
POST   /api/upload/videos           # Subir videos
POST   /api/upload/audio            # Subir audio
POST   /api/upload/documents        # Subir documentos
POST   /api/upload/course-images    # Imágenes de cursos
POST   /api/cleanup                 # Limpieza archivos
```

### **📚 Biblioteca Digital** (`/api/library/`)
```
GET    /api/library                 # Recursos biblioteca
GET    /api/library/[id]            # Detalle recurso
GET    /api/library/[id]/download   # Descargar recurso
GET    /api/library/stats           # Estadísticas
POST   /api/library                 # Subir recurso
PUT    /api/library/[id]            # Actualizar recurso
DELETE /api/library/[id]            # Eliminar recurso
```

### **🗓️ Eventos y Calendario** (`/api/calendar/`)
```
GET    /api/calendar                # Eventos
POST   /api/calendar                # Crear evento
PUT    /api/calendar/[id]           # Actualizar evento
DELETE /api/calendar/[id]           # Eliminar evento
```

### **🔧 Utilidades y Debug**
```
GET    /api/debug/db-structure      # Estructura BD
GET    /api/debug/table-structures  # Tablas BD
POST   /api/migrate/fix-course-schema # Migración schema
POST   /api/test/seed-courses       # Datos de prueba
```

---

## 🎨 Componentes Svelte (30+)

### **🔐 Autenticación**
```typescript
// Componentes principales
LoginForm.svelte              # Formulario de login
UserProfile.svelte            # Perfil de usuario
```

### **📚 Sistema Educativo**
```typescript
// Cursos
CourseCard.svelte             # Tarjeta de curso
CourseList.svelte             # Lista de cursos
CourseForm.svelte             # Formulario crear/editar curso
SearchFilters.svelte          # Filtros de búsqueda

// Módulos
ModuleCard.svelte             # Tarjeta de módulo
ModuleList.svelte             # Lista de módulos
ModuleForm.svelte             # Formulario módulo

// Posts de Módulos
PostCard.svelte               # Tarjeta de post
PostList.svelte               # Lista de posts
PostForm.svelte               # Formulario post
PostViewer.svelte             # Visualizador de contenido
```

### **📝 Blog y Noticias**
```typescript
BlogPostCard.svelte           # Tarjeta de post
BlogList.svelte               # Lista de posts
BlogEditor.svelte             # Editor de contenido
MediaUploader.svelte          # Subida de archivos
```

### **📚 Biblioteca Digital**
```typescript
LibraryResourceCard.svelte    # Tarjeta de recurso
LibraryFilters.svelte         # Filtros biblioteca
```

### **🗓️ Eventos y Calendario**
```typescript
CalendarView.svelte           # Vista de calendario
EventForm.svelte              # Formulario eventos
EventList.svelte              # Lista de eventos
UpcomingEventsWidget.svelte   # Widget próximos eventos
```

### **👥 Gestión de Usuarios**
```typescript
UserList.svelte               # Lista de usuarios
UserForm.svelte               # Formulario usuario
RoleManagement.svelte         # Gestión de roles
```

### **🔧 Componentes Comunes**
```typescript
LoadingSpinner.svelte         # Spinner de carga
SuccessToast.svelte           # Notificaciones éxito
ConfirmationModal.svelte      # Modal de confirmación
Pagination.svelte             # Paginación
FeatureCard.svelte            # Tarjeta de características
FileUploader.svelte           # Subida de archivos genérica
```

---

## 🗄️ Base de Datos (Drizzle ORM)

### **Esquema Principal**
```typescript
// Autenticación
user                          # Usuarios del sistema
session                       # Sesiones JWT activas

// Sistema Educativo
course                        # Cursos
module                        # Módulos de cursos
modulePost                    # Posts/contenido de módulos

// Blog y Contenido
blogPost                      # Posts del blog
blogCategory                  # Categorías del blog

// Multimedia
mediaFile                     # Archivos multimedia
uploadStatus                  # Estado de uploads

// Biblioteca
libraryResource               # Recursos de biblioteca

// Eventos
event                         # Eventos del centro
eventRegistration             # Registro a eventos
```

### **Configuración Drizzle**
```typescript
// drizzle.config.ts
export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:/home/user/ccpvj/Data/ccpvj.db'
  },
  verbose: true,
  strict: true
});
```

### **Scripts de Base de Datos**
```bash
npm run db:push              # Actualizar esquema
npm run db:generate          # Generar migraciones
npm run db:migrate           # Ejecutar migraciones
npm run db:studio            # Drizzle Studio GUI
npm run db:seed              # Datos de prueba
```

---

## 📊 Sistema Multimedia Contextual

### **Upload por Tipo**
```typescript
// Tipos soportados
Images: JPG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF (20MB)
Videos: MP4, WebM, AVI, MOV (500MB)
Audio: MP3, WAV, OGG, M4A (100MB)
Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (100MB)
```

### **Estructura de Archivos**
```
Data/media/
├── image/                    # Todas las imágenes
├── video/                    # Todos los videos
├── audio/                    # Todos los audios
├── document/                 # Todos los documentos
└── temp/uploads/             # Temporales nginx
    ├── images/
    ├── videos/
    ├── audio/
    └── documents/
```

### **Limpieza Automática**
```typescript
// MediaCleanup Utils disponibles
import {
  deleteMediaFile,           // Borrar archivo individual
  deleteMediaFiles,          // Borrar múltiples archivos
  replaceMediaFile,          // Reemplazar (limpia anterior)
  cleanOrphanedFiles,        // Limpiar huérfanos
  cleanTempFiles,            // Limpiar temporales
  mediaFileExists,           // Verificar existencia
  getMediaFileSize           // Obtener tamaño
} from '$lib/server/utils/mediaCleanup';
```

### **Endpoints de Limpieza**
```
POST /api/cleanup            # Limpieza manual
{
  "cleanOrphaned": true,     # Archivos no referenciados
  "cleanTemp": true,         # Temporales antiguos
  "tempFileMaxAgeHours": 24,
  "dryRun": false           # true = preview sin borrar
}
```

---

## 🚀 Desarrollo y Scripts

### **Scripts Principales**
```bash
# Desarrollo
npm run dev                  # Servidor desarrollo (http://localhost:5173)
npm run build               # Build de producción
npm run preview             # Preview del build

# Base de Datos
npm run db:push             # Actualizar esquema DB
npm run db:studio           # Drizzle Studio GUI
npm run db:seed             # Insertar datos de prueba

# Testing
npm run test                # Ejecutar todos los tests
npm run test:unit           # Tests unitarios (Vitest)
npm run test:e2e            # Tests E2E (Playwright)

# Calidad de Código
npm run check               # TypeScript checking
npm run format              # Formatear código (Prettier)
npm run lint                # Linting (Prettier check)

# Componentes
npm run storybook           # Storybook dev server
npm run build-storybook     # Build Storybook
```

### **Configuración de Desarrollo**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    tailwindcss(),           # Tailwind CSS 4.0
    sveltekit(),             # SvelteKit plugin
    devtoolsJson(),          # DevTools JSON
    // paraglideVitePlugin() # i18n (deshabilitado)
  ],
  server: {
    watch: {
      ignored: ['**/project.inlang/cache/**']
    }
  }
});
```

---

## 🧪 Testing y Calidad

### **Testing Stack**
```typescript
// Vitest - Testing unitario
test: {
  environment: 'browser',     # Testing en navegador
  browser: {
    enabled: true,
    provider: 'playwright',   # Playwright como browser
    instances: [{ browser: 'chromium' }]
  }
}

// Playwright - Testing E2E
tests/
├── auth.spec.ts            # Tests autenticación
├── courses.spec.ts         # Tests sistema educativo
└── navigation.spec.ts      # Tests navegación
```

### **Storybook - Desarrollo Componentes**
```bash
npm run storybook           # http://localhost:6006
stories/
├── Button.stories.ts       # Historias de componentes
├── CourseCard.stories.ts   # Historias específicas
└── Layout.stories.ts       # Historias de layout
```

### **Calidad de Código**
```json
// prettier.config.js
{
  "useTabs": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"]
}
```

---

## 📱 Rutas y Páginas (21 Páginas)

### **🏠 Públicas**
```
/                            # Homepage
/courses                     # Lista de cursos
/courses/[id]                # Detalle de curso
/blog                        # Blog público
/blog/[slug]                 # Post individual
/library                     # Biblioteca pública
/calendar                    # Eventos públicos
```

### **🔐 Autenticación**
```
/auth/login                  # Inicio de sesión
```

### **✏️ Gestión de Contenido** (Colaborador+)
```
/courses/create              # Crear curso
/courses/[id]/edit           # Editar curso
/blog/create                 # Crear post
/library/create              # Subir recurso
/library/edit/[id]           # Editar recurso
/calendar/create             # Crear evento
```

### **🎯 Páginas Específicas**
```
/modules/[id]                # Detalle de módulo
/calendar/event/[id]         # Detalle de evento
```

### **👑 Administración** (Administrador)
```
/dashboard                   # Panel principal
/dashboard/users             # Gestión usuarios
```

### **🧪 Testing y Desarrollo**
```
/test-course-management      # Pruebas gestión cursos
/test-course-detail          # Pruebas detalle
/test-generic-course         # Pruebas genéricas
```

---

## 🔧 Configuración y Ambiente

### **Configuración SvelteKit**
```javascript
// svelte.config.js
export default {
  preprocess: [vitePreprocess(), mdsvex()],
  kit: {
    adapter: adapter()         // Static adapter para deploy
  },
  extensions: ['.svelte', '.svx'] // Soporte MDX
};
```

### **Variables de Ambiente**
```bash
# .env
DATABASE_URL="file:D:/ccpvj/Data/ccpvj.db"
MEDIA_BASE_PATH="/path/to/media"
NODE_ENV="development"
```

### **Configuración Tailwind**
```typescript
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};
```

---

## 📈 Estado de Desarrollo

### **✅ Completamente Funcional**
- Sistema de autenticación JWT
- CRUD completo de cursos, módulos y posts
- Sistema de blog con categorías
- Biblioteca digital con upload/download
- Sistema de eventos y calendario
- Upload y gestión multimedia contextual
- Base de datos SQLite con Drizzle ORM
- Componentes UI responsivos
- APIs internas completas (62 endpoints)

### **⚠️ En Desarrollo**
- Cobertura de testing completa
- Internacionalización (Paraglide configurado pero deshabilitado)
- Optimización de rendimiento
- PWA capabilities

### **🔄 Integración**
- **Backend .NET**: APIs complementarias opcionales
- **Base de Datos**: Esquema unificado entre ORMs
- **Multimedia**: Sistema de limpieza compartido
- **Autenticación**: Cookies compatibles entre sistemas

---

## 🚨 Importantes para Desarrolladores

### **Rutas API Internas**
- Todas las rutas `/api/*` son **internas de SvelteKit**
- No confundir con backend .NET opcional
- Sistema auto-suficiente con base de datos propia

### **Multimedia**
- **Siempre** usar utilidades de `mediaCleanup.ts`
- **Nunca** crear sistemas upload independientes
- **Validar** tipos de archivo antes de procesar
- **Limpiar** archivos anteriores al reemplazar

### **Base de Datos**
- Usar **Drizzle Studio** para inspección: `npm run db:studio`
- **Foreign keys** habilitados automáticamente
- **Migraciones** automáticas en desarrollo
- **Seeding** disponible para datos de prueba

### **Autenticación**
- **Siempre** usar `jwtService.getAuthHeader()` para requests autenticados
- **Usar** el patrón `...jwtService.getAuthHeader()` en headers de fetch
- **Roles** en lowercase: `asistente`, `colaborador`, `administrador`

---

## 📞 URLs y Accesos

### **Desarrollo**
- **Frontend**: http://localhost:5173
- **Drizzle Studio**: `npm run db:studio`
- **Storybook**: http://localhost:6006
- **Base de Datos**: `D:/ccpvj/Data/ccpvj.db`

### **Testing**
```bash
# Usuario de prueba (auto-seeding)
username: admin
password: admin123
role: administrador
```

---

**⚠️ Importante**: Este frontend es **completamente independiente** y puede operar sin el backend .NET. Es el **sistema principal** de la plataforma del Centro Cultural Víctor Jara.


