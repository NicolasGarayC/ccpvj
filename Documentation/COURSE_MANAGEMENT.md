# Sistema de Gestión de Cursos - Centro Cultural Víctor Jara

Documentación completa del sistema de gestión educativa implementado con arquitectura jerárquica y multimedia contextual.

## 🎯 Resumen del Sistema

El sistema de gestión de cursos implementa una jerarquía educativa completa:
```
📚 Course (Matemáticas, Física, Sociales, Economía)
  ├── 📄 Module (Lecciones organizadas)
      └── ⚙️ WorkItem (Contenido educativo con multimedia contextual)
          ├── 📝 Título y descripción
          ├── 📖 Texto largo (instrucciones detalladas)
          ├── 🖼️ Imagen contextual (diagramas, ilustraciones)  
          └── 🎥 Video contextual (tutoriales paso a paso)
```

## 🎓 Gestión de Cursos

### Funcionalidades Implementadas

#### ✅ **CRUD Completo**
- **Crear**: Formulario completo con validación de campos y permisos
- **Leer**: Vista pública para todos los roles, vista detallada con módulos
- **Actualizar**: Edición solo para propietarios y administradores
- **Eliminar**: Eliminación con confirmación y limpieza de dependencias

#### ✅ **Búsqueda y Filtrado Avanzado**
- **Por texto**: Búsqueda en título y descripción
- **Por materia**: Matemáticas, Física, Sociales, Economía
- **Por estado**: Activos/Inactivos
- **Por destacados**: Cursos featured
- **Ordenamiento**: Por fecha, título, destacados

#### ✅ **Paginación Inteligente**
- Navegación eficiente para grandes volúmenes
- Configuración flexible de elementos por página
- Indicadores visuales de progreso

### Roles y Permisos

#### 🔍 **Asistente**
```typescript
✅ Ver lista pública de cursos
✅ Acceder a cursos individuales
✅ Navegar por módulos y contenido
❌ No puede crear/editar/eliminar
❌ No requiere autenticación
```

#### ✏️ **Colaborador**
```typescript
✅ Crear nuevos cursos
✅ Editar sus propios cursos
✅ Eliminar sus propios cursos
✅ Gestionar módulos de sus cursos
✅ Ver estadísticas de sus cursos
❌ No puede editar cursos de otros
🔐 Requiere autenticación
```

#### 👑 **Administrador**
```typescript
✅ Acceso completo a todos los cursos
✅ Editar cualquier curso
✅ Eliminar cualquier curso
✅ Ver estadísticas del sistema
✅ Gestionar roles de usuarios
✅ Acceso a panel administrativo
🔐 Requiere autenticación
```

### API Endpoints

#### **Públicos (Sin autenticación)**
```http
GET /api/course                    # Lista paginada de cursos
GET /api/course/all                # Todos los cursos (resumen)
GET /api/course/featured?count=6   # Cursos destacados
GET /api/course/{id}               # Curso específico con módulos
GET /api/course/{id}/modules       # Módulos de un curso
GET /api/course/subjects           # Materias disponibles
```

#### **Privados (Colaborador/Administrador)**
```http
POST   /api/course                 # Crear curso
PUT    /api/course/{id}            # Actualizar curso
DELETE /api/course/{id}            # Eliminar curso
GET    /api/course/my-courses      # Mis cursos
```

#### **Administrativos (Solo Administrador)**
```http
GET /api/course/statistics         # Estadísticas del sistema
```

### Componentes Frontend

#### **CourseList.svelte** - Lista Principal
```typescript
<CourseList 
  showSearchFilters={true}
  showCreateButton={canCreateContent(userRole)}
  limit={12}
  featured={false}
  on:createCourse={handleCreate}
/>
```

**Características:**
- Grid responsivo de cursos
- Filtros integrados de búsqueda
- Paginación automática
- Botón crear condicional por roles
- Estados de carga y error

#### **CourseCard.svelte** - Tarjeta Individual
```typescript
<CourseCard 
  {course}
  showActions={canEditContent(userRole)}
  on:edit={handleEdit}
  on:delete={handleDelete}
/>
```

**Características:**
- Imagen de curso o placeholder
- Badge de curso destacado
- Metadatos (educador, estadísticas)
- Acciones contextuales por rol
- Indicador de curso inactivo

#### **CourseForm.svelte** - Editor
```typescript
<CourseForm 
  course={editingCourse}
  {loading}
  on:success={handleSuccess}
  on:error={handleError}
/>
```

**Características:**
- Validación en tiempo real
- Carga de imagen contextual
- Contador de caracteres
- Toggle destacado
- Selección de materia

#### **SearchFilters.svelte** - Filtros
```typescript
<SearchFilters 
  {searchParams}
  on:search={(e) => handleSearch(e.detail)}
/>
```

**Características:**
- Búsqueda por texto
- Filtro por materia
- Filtro por estado
- Ordenamiento múltiple
- Reset de filtros

## 📄 Gestión de Módulos

### Funcionalidades

#### ✅ **Organización Jerárquica**
- Módulos pertenecen a cursos específicos
- Numeración automática por orden
- Drag & drop para reordenamiento
- Eliminación en cascada segura

#### ✅ **CRUD Contextual**
- Creación dentro del contexto del curso
- Edición con validación de permisos
- Eliminación con confirmación
- Reordenamiento visual

### API Endpoints

```http
GET    /api/course/modules/{id}       # Módulo específico
POST   /api/course/modules            # Crear módulo
PUT    /api/course/modules/{id}       # Actualizar módulo  
DELETE /api/course/modules/{id}       # Eliminar módulo
PATCH  /api/course/modules/{id}/reorder # Reordenar módulo
```

### Componentes

#### **ModuleList.svelte** - Lista con Drag & Drop
```typescript
<ModuleList 
  {courseId}
  showActions={canEditContent(userRole)}
  allowReorder={canEditContent(userRole)}
  on:createModule={handleCreate}
  on:editModule={handleEdit}
  on:deleteModule={handleDelete}
  on:moduleReordered={handleReorder}
/>
```

**Características:**
- Lista ordenada de módulos
- Drag & drop reordering
- Contadores de WorkItems
- Estados activo/inactivo
- Acciones contextuales

#### **ModuleCard.svelte** - Tarjeta Individual
```typescript
<ModuleCard 
  {module}
  {showActions}
  on:edit={handleEdit}
  on:delete={handleDelete}
  on:view={handleView}
/>
```

#### **ModuleForm.svelte** - Editor
```typescript
<ModuleForm 
  module={editingModule}
  {courseId}
  {loading}
  on:success={handleSuccess}
  on:error={handleError}
/>
```

## ⚙️ Gestión de WorkItems

### Funcionalidades

#### ✅ **Contenido Educativo Rico**
- Título y descripción corta
- Texto largo para instrucciones detalladas
- Multimedia contextual (imagen + video)
- Numeración y reordenamiento

#### ✅ **Multimedia Contextual**
- Cada WorkItem puede tener imagen específica
- Video tutorial contextual
- Validación de tipos de archivo
- Limpieza automática al eliminar

### API Endpoints

```http
GET    /api/workitem/module/{moduleId}    # WorkItems por módulo
GET    /api/workitem/{id}                 # WorkItem específico
GET    /api/workitem/{id}/media           # Media del WorkItem
POST   /api/workitem                      # Crear WorkItem
PUT    /api/workitem/{id}                 # Actualizar WorkItem
DELETE /api/workitem/{id}                 # Eliminar WorkItem
POST   /api/workitem/{id}/reorder         # Reordenar WorkItem
GET    /api/workitem/course/{courseId}/all # Todos los WorkItems del curso
```

### Componentes

#### **WorkItemList.svelte** - Lista Contextual
```typescript
<WorkItemList 
  {moduleId}
  showActions={canEditContent(userRole)}
  allowReorder={canEditContent(userRole)}
  on:createWorkItem={handleCreate}
  on:editWorkItem={handleEdit}
  on:deleteWorkItem={handleDelete}
/>
```

#### **WorkItemCard.svelte** - Tarjeta con Media
```typescript
<WorkItemCard 
  {workItem}
  {showActions}
  on:edit={handleEdit}
  on:delete={handleDelete}
  on:view={handleView}
/>
```

**Características:**
- Indicadores de multimedia disponible
- Fecha de creación
- Estado activo/inactivo
- Acciones por rol

#### **WorkItemForm.svelte** - Editor Completo
```typescript
<WorkItemForm 
  workItem={editingItem}
  {moduleId}
  {loading}
  on:success={handleSuccess}
  on:error={handleError}
/>
```

**Características:**
- Editor texto largo (10,000 caracteres)
- Carga de imagen contextual
- Carga de video contextual
- Validación extensiva
- Preview multimedia

## 🗄️ Estructura de Base de Datos

### Schema Principal

```sql
-- Cursos principales
CREATE TABLE Course (
  Id TEXT PRIMARY KEY,
  Title TEXT NOT NULL,
  Description TEXT NOT NULL,
  Subject TEXT NOT NULL, -- Matemáticas, Física, Sociales, Economía
  IsActive INTEGER NOT NULL DEFAULT 1,
  IsFeatured INTEGER NOT NULL DEFAULT 0,
  CreatedAt TEXT NOT NULL,
  UpdatedAt TEXT,
  EducatorId INTEGER NOT NULL,
  ImagePath TEXT,
  FOREIGN KEY (EducatorId) REFERENCES Usuario(IdUsuario)
);

-- Módulos de cursos
CREATE TABLE Module (
  Id TEXT PRIMARY KEY,
  CourseId TEXT NOT NULL,
  Title TEXT NOT NULL,
  Description TEXT NOT NULL,
  OrderNumber INTEGER NOT NULL,
  IsActive INTEGER NOT NULL DEFAULT 1,
  CreatedAt TEXT NOT NULL,
  UpdatedAt TEXT,
  FOREIGN KEY (CourseId) REFERENCES Course(Id) ON DELETE CASCADE
);

-- WorkItems con multimedia contextual
CREATE TABLE WorkItem (
  Id TEXT PRIMARY KEY,
  ModuleId TEXT NOT NULL,
  Title TEXT NOT NULL,
  Description TEXT,
  LongText TEXT, -- Instrucciones detalladas
  ImagePath TEXT, -- Imagen contextual
  VideoPath TEXT, -- Video contextual
  OrderNumber INTEGER NOT NULL,
  IsActive INTEGER NOT NULL DEFAULT 1,
  CreatedAt TEXT NOT NULL,
  UpdatedAt TEXT,
  FOREIGN KEY (ModuleId) REFERENCES Module(Id) ON DELETE CASCADE
);
```

### Índices Optimizados

```sql
-- Índices para consultas eficientes
CREATE INDEX idx_course_subject ON Course(Subject);
CREATE INDEX idx_course_featured ON Course(IsFeatured);
CREATE INDEX idx_course_active ON Course(IsActive);
CREATE INDEX idx_course_educator ON Course(EducatorId);

CREATE INDEX idx_module_course ON Module(CourseId);
CREATE INDEX idx_module_order ON Module(OrderNumber);

CREATE INDEX idx_workitem_module ON WorkItem(ModuleId);
CREATE INDEX idx_workitem_order ON WorkItem(OrderNumber);
```

### Vistas para Consultas

```sql
-- Vista cursos con estadísticas
CREATE VIEW CourseWithStats AS
SELECT 
  c.*,
  u.Nombre || ' ' || u.Apellido AS EducatorName,
  COUNT(DISTINCT m.Id) AS ModuleCount,
  COUNT(DISTINCT w.Id) AS WorkItemCount
FROM Course c
LEFT JOIN Usuario u ON c.EducatorId = u.IdUsuario
LEFT JOIN Module m ON c.Id = m.CourseId AND m.IsActive = 1
LEFT JOIN WorkItem w ON m.Id = w.ModuleId AND w.IsActive = 1
GROUP BY c.Id;

-- Vista módulos con contenido
CREATE VIEW ModuleWithContent AS
SELECT 
  m.*,
  c.Title AS CourseName,
  COUNT(w.Id) AS WorkItemCount
FROM Module m
LEFT JOIN Course c ON m.CourseId = c.Id
LEFT JOIN WorkItem w ON m.Id = w.ModuleId AND w.IsActive = 1
GROUP BY m.Id;
```

## 🔐 Validaciones y Seguridad

### Validación Frontend

```typescript
// Validación cursos
function validateCourse(data: CreateCourseDto): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (!data.title.trim()) errors.title = 'Título requerido';
  if (data.title.length < 3) errors.title = 'Mínimo 3 caracteres';
  if (data.title.length > 200) errors.title = 'Máximo 200 caracteres';
  
  if (!data.description.trim()) errors.description = 'Descripción requerida';
  if (data.description.length < 10) errors.description = 'Mínimo 10 caracteres';
  if (data.description.length > 1000) errors.description = 'Máximo 1000 caracteres';
  
  if (!data.subject.trim()) errors.subject = 'Materia requerida';
  
  return errors;
}
```

### Validación Backend

```csharp
// Validación roles en CourseService
public async Task<CourseDto> CreateCourseAsync(CreateCourseDto createDto, string userId)
{
    var educator = await _context.Usuario.Include(u => u.Rol)
        .FirstOrDefaultAsync(u => u.IdUsuario.ToString() == userId);
    
    if (educator == null)
        throw new ArgumentException("Usuario no encontrado");
    
    // Validar rol
    if (educator.Rol?.NombreRol != "Colaborador" && educator.Rol?.NombreRol != "Administrador")
        throw new UnauthorizedAccessException("Solo colaboradores y administradores pueden crear cursos");
    
    // Validar datos
    if (string.IsNullOrWhiteSpace(createDto.Title))
        throw new ArgumentException("Título requerido");
    
    if (createDto.Title.Length > 200)
        throw new ArgumentException("Título no puede exceder 200 caracteres");
    
    // Crear curso...
}
```

### Seguridad Multimedia

```typescript
// Validación archivos multimedia
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

function validateMediaFile(file: File, type: 'image' | 'video'): boolean {
  const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  
  return allowedTypes.includes(file.type) && file.size <= maxSize;
}
```

## 📊 Estadísticas y Reporting

### Métricas Implementadas

```typescript
// Estadísticas del sistema (solo Administrador)
interface CourseStatistics {
  totalCourses: number;
  activeCourses: number;
  featuredCourses: number;
  coursesBySubject: Record<string, number>;
  totalModules: number;
  totalWorkItems: number;
  totalEducators: number;
  recentActivity: RecentActivity[];
}
```

### Dashboard Administrativo

```typescript
// Panel estadísticas para administradores
export async function getCourseStatistics(): Promise<CourseStatistics> {
  return {
    totalCourses: await db.select({ count: count() }).from(course),
    activeCourses: await db.select({ count: count() }).from(course).where(eq(course.isActive, true)),
    featuredCourses: await db.select({ count: count() }).from(course).where(eq(course.isFeatured, true)),
    coursesBySubject: await getCoursesBySubject(),
    // ...más estadísticas
  };
}
```

## 🧪 Testing

### Tests Unitarios

```typescript
// Ejemplo test CourseService
describe('CourseService', () => {
  test('should create course with valid data', async () => {
    const courseData = {
      title: 'Matemáticas Básicas',
      description: 'Curso introductorio de matemáticas',
      subject: 'Matemáticas',
      isFeatured: false
    };
    
    const result = await courseService.createCourse(courseData, 'colaborador-id');
    
    expect(result.title).toBe(courseData.title);
    expect(result.subject).toBe(courseData.subject);
  });
  
  test('should reject course creation for invalid role', async () => {
    const courseData = { /* ... */ };
    
    await expect(
      courseService.createCourse(courseData, 'asistente-id')
    ).rejects.toThrow('Solo colaboradores y administradores pueden crear cursos');
  });
});
```

### Tests E2E

```typescript
// Playwright test flujo completo
test('complete course management flow', async ({ page }) => {
  // Login como colaborador
  await page.goto('/auth/login');
  await page.fill('[data-testid="username"]', 'colaborador');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="submit"]');
  
  // Crear curso
  await page.goto('/dashboard/courses');
  await page.click('[data-testid="create-course"]');
  await page.fill('[data-testid="title"]', 'Test Course');
  await page.fill('[data-testid="description"]', 'Test Description');
  await page.selectOption('[data-testid="subject"]', 'Matemáticas');
  await page.click('[data-testid="submit"]');
  
  // Verificar creación
  await expect(page.locator('[data-testid="course-title"]')).toContainText('Test Course');
});
```

## 🚀 Deployment

### Build Frontend
```bash
cd Front/
npm run build
# Output en build/ listo para servir
```

### Build Backend
```bash
cd Back/
dotnet publish -c Release -o ./publish
# Binarios en ./publish/
```

### Configuración NGINX
```nginx
# Configuración optimizada para cursos
location /api/course {
    proxy_pass http://backend;
    proxy_cache off; # No cache para datos dinámicos
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /media/courses/ {
    root /var/www;
    expires 30d; # Cache largo para imágenes
    add_header Cache-Control "public, immutable";
}
```

---

**Sistema de gestión de cursos completamente funcional y listo para uso en producción** 🎓✅