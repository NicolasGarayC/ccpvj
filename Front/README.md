# Centro Cultural Víctor Jara - Frontend

Frontend de la plataforma Centro Cultural Víctor Jara, desarrollado con SvelteKit 5 y diseñado para gestión contextual de multimedia educativa y cultural.

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas

#### 🎓 **Sistema Educativo Completo**
- **Gestión de Cursos**: CRUD completo con filtros avanzados y paginación
- **Gestión de Módulos**: Creación, edición y reordenamiento drag & drop
- **WorkItems**: Contenido educativo con multimedia contextual (imágenes, videos)
- **Búsqueda Inteligente**: Filtros por materia, estado, destacados
- **Jerarquía**: Course → Module → WorkItem con multimedia contextual

#### 📝 **Sistema de Blog**
- **Editor Completo**: Formularios con carga multimedia contextual
- **Gestión de Estados**: Borradores, publicados, destacados
- **Multimedia Contextual**: Imágenes destacadas, PDFs, videos por post
- **Acceso Público**: Lectura sin autenticación requerida

#### 👥 **Sistema de Gestión de Usuarios**
- **🔍 Asistente**: Solo lectura, no requiere autenticación
- **✏️ Colaborador**: Crear/editar contenido propio + gestión usuarios (no Admin)
- **👑 Administrador**: Acceso completo, gestión total de usuarios y roles
- **🚫 Registro Público Deshabilitado**: Solo Admin/Colaboradores crean usuarios
- **📊 Panel Dedicado**: Interface completa en /dashboard/users

#### 🔐 **Autenticación JWT Integrada**
- **JWT + Refresh Tokens**: Sistema profesional integrado con backend .NET
- **Renovación Automática**: Tokens renovados transparentemente (15min/7días)
- **Logout Seguro**: Revocación en blacklist del backend
- **Almacenamiento Seguro**: Access tokens (localStorage) + Refresh (httpOnly cookies)
- **APIs Proxy**: Transparencia entre frontend y backend para compatibilidad

## 🏗️ Stack Tecnológico

```json
{
  "framework": "SvelteKit 5",
  "language": "TypeScript",
  "styling": "TailwindCSS 4.0",
  "database": "SQLite + Drizzle ORM",
  "auth": "JWT integrado con backend .NET + refresh tokens",
  "i18n": "Paraglide.js",
  "testing": "Vitest + Playwright",
  "dev": "Storybook",
  "linting": "ESLint + Prettier"
}
```

## 🚀 Inicio Rápido

### Instalación
```bash
# Instalar dependencias
npm install

# Inicializar base de datos contextual
../init_contextual_database.sh

# Iniciar desarrollo
npm run dev
```

### Comandos Disponibles

#### Desarrollo
```bash
npm run dev              # Servidor desarrollo (http://localhost:5173)
npm run dev -- --open    # Servidor + abrir navegador
npm run preview          # Vista previa build producción
```

#### Build y Despliegue
```bash
npm run build            # Build para producción
npm run check            # Verificación TypeScript/Svelte
npm run format           # Formatear código (Prettier)
npm run lint             # Verificar formato
```

#### Base de Datos
```bash
npm run db:generate      # Generar migraciones Drizzle
npm run db:push          # Aplicar cambios schema
npm run db:migrate       # Ejecutar migraciones
npm run db:studio        # Abrir Drizzle Studio
npm run db:seed          # Poblar con datos de prueba
```

#### Testing
```bash
npm run test:unit        # Pruebas unitarias (Vitest)
npm run test:e2e         # Pruebas E2E (Playwright)
npm run test:e2e:ui      # UI de Playwright
```

#### Storybook
```bash
npm run storybook        # Desarrollo componentes
npm run build-storybook  # Build Storybook
```

## 📁 Estructura del Proyecto

```
src/
├── 📱 app.html                    # Template HTML base
├── 🎯 hooks.server.ts             # Server hooks (auth middleware)
├── 🎨 app.css                     # Estilos globales Tailwind
├── 
├── 📚 lib/
│   ├── 🧩 components/             # Componentes UI reutilizables
│   │   ├── 🎓 course/            # Sistema educativo
│   │   │   ├── CourseList.svelte      # Lista cursos + filtros
│   │   │   ├── CourseCard.svelte      # Tarjeta curso individual
│   │   │   ├── CourseForm.svelte      # Crear/editar cursos
│   │   │   ├── SearchFilters.svelte   # Filtros búsqueda
│   │   │   ├── ModuleList.svelte      # Lista módulos + drag&drop
│   │   │   ├── ModuleCard.svelte      # Tarjeta módulo
│   │   │   ├── ModuleForm.svelte      # Gestión módulos
│   │   │   ├── WorkItemList.svelte    # Lista contenido
│   │   │   ├── WorkItemCard.svelte    # Tarjeta WorkItem
│   │   │   └── WorkItemForm.svelte    # Editor contenido
│   │   ├── 📝 blog/               # Sistema de blog
│   │   │   ├── BlogList.svelte        # Lista posts + acciones roles
│   │   │   ├── BlogPostCard.svelte    # Tarjeta post + permisos
│   │   │   ├── BlogEditor.svelte      # Editor completo
│   │   │   └── MediaUploader.svelte   # Carga multimedia
│   │   ├── 👑 users/              # Gestión de usuarios
│   │   │   ├── UserList.svelte        # Lista usuarios con filtros
│   │   │   └── UserForm.svelte        # Crear/editar usuarios
│   │   └── 🔧 common/             # Componentes comunes
│   │       └── Pagination.svelte     # Paginación reutilizable
│   │
│   ├── 🌐 services/               # Servicios API
│   │   ├── 🎓 course/            # API cursos
│   │   │   ├── courseService.ts      # CRUD cursos/módulos
│   │   │   └── workItemService.ts    # Gestión WorkItems
│   │   ├── 📝 blog/               # API blog
│   │   │   └── blogService.ts        # Gestión posts
│   │   ├── 👥 users/              # API gestión usuarios  
│   │   │   └── userManagementService.ts # CRUD usuarios completo
│   │   └── authService.ts            # Servicio JWT integrado
│   │
│   ├── 🔧 utils/                  # Utilidades
│   │   └── roleUtils.ts              # Sistema roles/permisos
│   │
│   └── 🖥️ server/                 # Lógica servidor
│       ├── 🔐 auth.ts                # Autenticación sesiones
│       └── 🗄️ db/                   # Base datos
│           ├── index.ts              # Conexión Drizzle
│           ├── schema.ts             # Esquema contextual
│           └── seed.ts               # Datos iniciales
│
└── 🌐 routes/                     # Rutas SvelteKit
    ├── 📄 +layout.svelte              # Layout principal
    ├── 📄 +layout.server.ts           # Datos servidor layout
    ├── 🏠 +page.svelte                # Página inicio
    │
    ├── 🔌 api/                        # API endpoints
    │   ├── 🔐 auth/                   # Autenticación (APIs proxy)
    │   │   ├── login/+server.ts       # POST login → backend .NET
    │   │   ├── logout/+server.ts      # POST logout → backend .NET  
    │   │   ├── refresh/+server.ts     # POST refresh → backend .NET
    │   │   └── status/+server.ts      # GET estado auth
    │   └── 🧪 test-auth/+server.ts   # Test conectividad
    │
    ├── 🔐 auth/                       # Páginas autenticación
    │   └── login/                     # Login page
    │       ├── +page.svelte           # Formulario login
    │       └── +page.server.ts        # Lógica servidor
    │
    ├── 🎓 courses/                    # Páginas cursos
    │   ├── +page.svelte               # Lista pública cursos
    │   ├── [id]/+page.svelte          # Vista curso individual
    │   ├── create/+page.svelte        # Crear curso
    │   └── [id]/edit/+page.svelte     # Editar curso
    │
    ├── 📝 blog/                       # Páginas blog
    │   ├── +page.svelte               # Lista posts públicos
    │   ├── [slug]/+page.svelte        # Post individual
    │   └── create/+page.svelte        # Crear post
    │
    └── 🏛️ dashboard/                  # Panel control
        ├── +page.svelte               # Dashboard principal
        ├── +layout.server.ts          # Verificación auth
        ├── courses/+page.svelte       # Gestión mis cursos
        ├── blog/+page.svelte          # Gestión mis posts
        └── users/                     # Gestión usuarios [Admin+]
            └── +page.svelte           # Panel completo usuarios
```

## 🎨 Componentes Principales

### 🎓 Sistema Educativo

#### **CourseList** - Lista de cursos
```typescript
<CourseList 
  showSearchFilters={true}
  showCreateButton={canCreateContent(userRole)}
  limit={12}
  featured={false}
  on:createCourse={handleCreate}
/>
```

#### **ModuleList** - Gestión módulos
```typescript
<ModuleList 
  {courseId}
  showActions={canEditContent(userRole)}
  allowReorder={canEditContent(userRole)}
  on:createModule={handleCreateModule}
/>
```

#### **WorkItemForm** - Editor contenido
```typescript
<WorkItemForm 
  workItem={editingItem}
  {moduleId}
  {currentUser}
  on:success={handleSuccess}
  on:error={handleError}
/>
```

### 📝 Sistema de Blog

#### **BlogEditor** - Editor completo
```typescript
<BlogEditor 
  post={existingPost}
  {currentUser}
  on:save={handleSave}
  on:cancel={handleCancel}
/>
```

### 👑 Gestión de Usuarios

#### **UserList** - Lista con filtros y acciones
```typescript
<UserList 
  bind:this={userListComponent}
  on:edit-user={handleEditUser}
/>
```

#### **UserForm** - Crear/Editar usuarios
```typescript
<UserForm
  user={editingUser}
  on:user-saved={handleUserSaved}
  on:cancel={handleCloseForm}
/>
```

## 🔐 Sistema de Autenticación

### Flujo de Autenticación JWT
```typescript
// 1. Login con JWT
import { authService } from '$lib/services/authService';

const result = await authService.login(username, password);
if (result.success) {
  // Tokens almacenados automáticamente
  goto('/dashboard');
}

// 2. Peticiones autenticadas automáticas
const response = await authService.authenticatedFetch('/api/usermanagement');
// Renovación automática de tokens si expiran

// 3. Verificación estado
const isAuthenticated = authService.isAuthenticated();
const user = authService.getUser();
const canManageUsers = authService.canManageUsers();
```

### APIs Proxy para Integración
```typescript
// /api/auth/login/+server.ts - Proxy al backend .NET
export const POST: RequestHandler = async ({ request, cookies }) => {
  const { username, password } = await request.json();
  
  // Redirigir al backend .NET
  const backendResponse = await fetch('https://localhost:5251/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ NombreUsuario: username, Contrasena: password })
  });
  
  const authResponse = await backendResponse.json();
  
  // Establecer refresh token en cookie segura
  cookies.set('refreshToken', authResponse.refreshToken, {
    httpOnly: true, secure: true, sameSite: 'strict'
  });
  
  return json({ success: true, data: authResponse });
};
```

## 🎯 Sistema de Roles

### Utilidades de Roles
```typescript
import { 
  canCreateContent, 
  canEditContent, 
  canDeleteContent,
  requiresAuthentication,
  ROLES 
} from '$lib/utils/roleUtils';

// Validaciones
const canCreate = canCreateContent(user?.role);
const needsAuth = requiresAuthentication(user?.role);
```

### Roles Disponibles
```typescript
export const ROLES = {
  ASISTENTE: 'Asistente',     // Solo lectura, sin auth
  COLABORADOR: 'Colaborador', // Crear/editar propio contenido
  ADMINISTRADOR: 'Administrador' // Acceso completo
};
```

## 🗄️ Base de Datos

### Schema Contextual
```typescript
// Usuarios y sesiones
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  role: text('role').notNull().default('Asistente'),
  // ...
});

// Sistema educativo jerárquico
export const course = sqliteTable('course', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  // ...
});

export const module = sqliteTable('module', {
  id: text('id').primaryKey(),
  courseId: text('course_id').references(() => course.id),
  orderNumber: integer('order_number').notNull(),
  // ...
});

export const workItem = sqliteTable('work_item', {
  id: text('id').primaryKey(),
  moduleId: text('module_id').references(() => module.id),
  imagePath: text('image_path'),
  videoPath: text('video_path'),
  // ...
});
```

### Servicios de Datos
```typescript
// courseService.ts
export class CourseService {
  async getCourses(params: CourseSearchParams): Promise<CoursePagedResult> {
    // Implementación con filtros y paginación
  }
  
  async createCourse(data: CreateCourseDto): Promise<Course> {
    // Validación roles y creación
  }
}
```

## 📱 Responsive Design

### Breakpoints TailwindCSS
```css
/* Mobile first */
.courses-grid {
  @apply grid grid-cols-1;
}

/* Tablet */
@media (min-width: 768px) {
  .courses-grid {
    @apply grid-cols-2;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .courses-grid {
    @apply grid-cols-3;
  }
}
```

### Componentes Adaptativos
- **Navigation**: Colapsa en hamburger menu (móvil)
- **Cards**: Stacking vertical en pantallas pequeñas
- **Forms**: Campos full-width en móvil
- **Tables**: Scroll horizontal cuando necesario

## 🧪 Testing

### Configuración Vitest
```javascript
// vitest.config.js
export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
  }
});
```

### Playwright E2E
```javascript
// playwright.config.js
export default defineConfig({
  testDir: 'tests',
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173
  }
});
```

## 🌐 Internacionalización

### Paraglide.js Setup
```javascript
// paraglide.config.js
export default {
  project: './project.inlang',
  outdir: './src/lib/paraglide',
  availableLanguageTags: ['en', 'es']
};
```

### Uso en Componentes
```svelte
<script>
  import * as m from '$lib/paraglide/messages';
</script>

<h1>{m.course_title()}</h1>
<p>{m.course_description()}</p>
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno
```bash
# .env
DATABASE_URL="file:../Data/ccpvj.db"
SESSION_SECRET="your-secret-key"
UPLOAD_PATH="../Data/media"
```

### VSCode Settings
```json
{
  "eslint.validate": ["svelte"],
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "svelte.svelte-vscode"
}
```

## 🚀 Build y Despliegue

### Build para Producción
```bash
npm run build
# Genera en build/ con:
# - Archivos estáticos optimizados
# - Chunks JS minimizados
# - CSS purgado con Tailwind
```

### Análisis Bundle
```bash
npx vite-bundle-analyzer build/
```

## 📊 Performance

### Optimizaciones Implementadas
- **Code Splitting**: Rutas lazy-loaded automáticamente
- **Image Optimization**: WebP + lazy loading
- **CSS Purging**: Solo estilos usados en build
- **Tree Shaking**: Eliminación código no usado
- **Preloading**: Links críticos pre-cargados

### Métricas Target
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

---

**Desarrollado con SvelteKit 5 para máxima eficiencia y experiencia de usuario** 🚀