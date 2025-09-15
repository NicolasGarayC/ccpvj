# FASE 1.3: DEFINICIÓN DE SERVICIOS HTTP FRONTEND

## 🎯 OBJETIVO

Reemplazar **TODOS los servicios SQLite directos** del frontend por **servicios HTTP** que consuman exclusivamente el backend .NET.

---

## 📋 MAPEO: SQLite → HTTP Services

### **🔴 CRÍTICOS - Reemplazar Inmediatamente**

#### **1. AuthService (REFACTORING COMPLETO)**
```typescript
// ACTUAL: src/lib/services/authService.ts
// ESTADO: ✅ Ya es HTTP-only, pero puede necesitar ajustes

class AuthService {
  private baseURL = '/api/auth';

  // ✅ YA HTTP: login(), logout(), checkAuthStatus()
  // ⚠️ VERIFICAR: Compatibilidad total con backend .NET cookies
}

// ACCIÓN: Verificar y ajustar para 100% compatibility
```

#### **2. CourseService (REFACTORING MASIVO)**
```typescript
// ACTUAL: src/lib/services/courseService.ts
// ESTADO: ❌ Imports SQLite schema + db direct access
// BACKEND: ✅ CourseController + WorkItemController

// NUEVO SERVICE HTTP:
class CourseHttpService {
  private baseURL = 'https://localhost:5251/api';

  // Courses
  async getCourses(filters: CourseSearchDto): Promise<CoursePagedResult>
  async getCourse(id: string): Promise<CourseDto>
  async createCourse(course: CreateCourseDto): Promise<CourseDto>
  async updateCourse(id: string, course: UpdateCourseDto): Promise<CourseDto>
  async deleteCourse(id: string): Promise<void>
  async getFeaturedCourses(): Promise<CourseDto[]>
  async getMyCourses(): Promise<CourseDto[]>
  async getSubjects(): Promise<string[]>

  // Modules
  async getModules(courseId: string): Promise<ModuleDto[]>
  async getModule(id: string): Promise<ModuleDto>
  async createModule(module: CreateModuleDto): Promise<ModuleDto>
  async updateModule(id: string, module: UpdateModuleDto): Promise<ModuleDto>
  async deleteModule(id: string): Promise<void>
  async reorderModule(id: string, newOrder: number): Promise<void>

  // WorkItems
  async getWorkItems(moduleId: string): Promise<WorkItemDto[]>
  async getWorkItem(id: string): Promise<WorkItemDto>
  async createWorkItem(workItem: CreateWorkItemDto): Promise<WorkItemDto>
  async updateWorkItem(id: string, workItem: UpdateWorkItemDto): Promise<WorkItemDto>
  async deleteWorkItem(id: string): Promise<void>
  async reorderWorkItem(id: string, newOrder: number): Promise<void>
}
```

#### **3. Server Auth (ELIMINAR COMPLETAMENTE)**
```typescript
// ELIMINAR: src/lib/server/auth.ts
// ESTADO: ❌ Conexión SQLite directa
// REEMPLAZO: HTTP calls a backend .NET auth

// NO NECESITA REEMPLAZO - Solo eliminar
// La autenticación será 100% manejada por backend .NET
```

---

### **🟠 IMPORTANTES - Crear Nuevos Services HTTP**

#### **4. BlogService (CREAR NUEVO)**
```typescript
// UBICACIÓN: src/lib/services/blog/blogHttpService.ts
// BACKEND: ✅ BlogController + BlogCategoryController

class BlogHttpService {
  private baseURL = 'https://localhost:5251/api';

  // Blog Posts
  async getPosts(filters: BlogPostSearchDto): Promise<BlogPostPagedResult>
  async getPost(id: string): Promise<BlogPostDto>
  async getPostBySlug(slug: string): Promise<BlogPostDto>
  async createPost(post: CreateBlogPostDto): Promise<BlogPostDto>
  async updatePost(id: string, post: UpdateBlogPostDto): Promise<BlogPostDto>
  async deletePost(id: string): Promise<void>
  async publishPost(id: string): Promise<void>
  async unpublishPost(id: string): Promise<void>
  async getFeaturedPosts(): Promise<BlogPostDto[]>
  async getPopularPosts(): Promise<BlogPostDto[]>
  async getRecentPosts(): Promise<BlogPostDto[]>
  async checkSlug(slug: string): Promise<boolean>
  async generateSlug(title: string): Promise<string>

  // Categories
  async getCategories(): Promise<BlogCategoryDto[]>
  async getCategory(id: string): Promise<BlogCategoryDto>
  async createCategory(category: CreateBlogCategoryDto): Promise<BlogCategoryDto>
  async updateCategory(id: string, category: UpdateBlogCategoryDto): Promise<BlogCategoryDto>
  async deleteCategory(id: string): Promise<void>
}
```

#### **5. LibraryService (CREAR NUEVO)**
```typescript
// UBICACIÓN: src/lib/services/library/libraryHttpService.ts
// BACKEND: ✅ LibraryController

class LibraryHttpService {
  private baseURL = 'https://localhost:5251/api/library';

  async getResources(filters?: LibrarySearchDto): Promise<LibraryResourceDto[]>
  async getResource(id: string): Promise<LibraryResourceDto>
  async createResource(resource: CreateLibraryResourceDto): Promise<LibraryResourceDto>
  async updateResource(id: string, resource: UpdateLibraryResourceDto): Promise<LibraryResourceDto>
  async deleteResource(id: string): Promise<void>
  async downloadResource(id: string): Promise<Blob>
  async getStats(): Promise<LibraryStatsDto>
}
```

#### **6. CalendarService (REFACTORING)**
```typescript
// ACTUAL: src/lib/services/calendar/calendarService.ts
// ESTADO: ❌ Imports SQLite schema
// BACKEND: ✅ CalendarController + EventController

class CalendarHttpService {
  private baseURL = 'https://localhost:5251/api';

  // Events via CalendarController
  async getEvents(filters: EventSearchDto): Promise<EventDto[]>
  async getEvent(id: string): Promise<EventDto>
  async createEvent(event: CreateEventDto): Promise<EventDto>
  async updateEvent(id: string, event: UpdateEventDto): Promise<EventDto>
  async deleteEvent(id: string): Promise<void>
  async getCalendarView(year: number, month: number): Promise<CalendarViewDto>
  async getUpcomingEvents(): Promise<EventDto[]>
  async getFeaturedEvents(): Promise<EventDto[]>
  async getEventTypes(): Promise<string[]>
  async registerToEvent(eventId: string): Promise<void>
  async unregisterFromEvent(eventId: string): Promise<void>
  async getMyRegistrations(): Promise<EventRegistrationDto[]>
}
```

#### **7. UserManagementService (REFACTORING)**
```typescript
// ACTUAL: src/lib/services/users/userManagementService.ts
// ESTADO: ❌ Imports SQLite schema (probablemente)
// BACKEND: ✅ UserManagementController

class UserManagementHttpService {
  private baseURL = 'https://localhost:5251/api/usermanagement';

  async getUsers(filters?: UserSearchDto): Promise<UserPagedResultDto>
  async getUser(id: string): Promise<UserDto>
  async createUser(user: CreateUserDto): Promise<UserDto>
  async updateUser(id: string, user: UpdateUserDto): Promise<UserDto>
  async deleteUser(id: string): Promise<void>
  async activateUser(id: string): Promise<void>
  async deactivateUser(id: string): Promise<void>
  async changeUserRole(id: string, role: string): Promise<void>
  async checkUsername(username: string): Promise<boolean>
  async resetPassword(id: string): Promise<void>
  async getRoles(): Promise<RoleDto[]>
  async getCurrentUser(): Promise<UserDto>
  async canManage(): Promise<boolean>
  async getStatistics(): Promise<UserStatsDto>
}
```

#### **8. UploadService (CREAR NUEVO)**
```typescript
// UBICACIÓN: src/lib/services/upload/uploadHttpService.ts
// BACKEND: ✅ UploadController

class UploadHttpService {
  private baseURL = 'https://localhost:5251/api/upload';

  async uploadImages(contentType: string, contentId: string, files: File[]): Promise<MediaDto[]>
  async uploadVideos(contentType: string, contentId: string, files: File[]): Promise<UploadStatusDto>
  async uploadAudio(contentType: string, contentId: string, files: File[]): Promise<MediaDto[]>
  async getUploadStatus(uploadId: string): Promise<UploadStatusDto>
  async deleteMedia(mediaId: string): Promise<void>
  async getMediaList(filters: MediaFilterDto): Promise<MediaDto[]>
  async getMediaByContent(contentType: string, contentId: string): Promise<MediaDto[]>
  async cleanupTempFiles(): Promise<{ deletedFiles: number }>
}
```

---

### **🟡 GAPS - Servicios Sin Backend (Requerir Backend Endpoints)**

#### **9. PostService (CREAR BACKEND + FRONTEND)**
```typescript
// UBICACIÓN: src/lib/services/posts/postHttpService.ts
// BACKEND: ❌ FALTA PostController

// NOTA: Necesita implementación en backend .NET primero
class PostHttpService {
  // TODO: Implementar cuando backend tenga PostController
  async getPosts(moduleId: string): Promise<PostDto[]>
  async getPost(id: string): Promise<PostDto>
  async createPost(post: CreatePostDto): Promise<PostDto>
  async updatePost(id: string, post: UpdatePostDto): Promise<PostDto>
  async deletePost(id: string): Promise<void>
  async reorderPost(id: string, newOrder: number): Promise<void>
}
```

#### **10. PostElementService (CREAR BACKEND + FRONTEND)**
```typescript
// UBICACIÓN: src/lib/services/postElements/postElementHttpService.ts
// BACKEND: ❌ FALTA PostElementController

class PostElementHttpService {
  // TODO: Implementar cuando backend tenga PostElementController
  async getPostElements(postId: string): Promise<PostElementDto[]>
  async getPostElement(id: string): Promise<PostElementDto>
  async createPostElement(element: CreatePostElementDto): Promise<PostElementDto>
  async updatePostElement(id: string, element: UpdatePostElementDto): Promise<PostElementDto>
  async deletePostElement(id: string): Promise<void>
  async reorderPostElement(id: string, newOrder: number): Promise<void>
  async uploadElementMedia(id: string, file: File): Promise<MediaDto>
}
```

#### **11. ModulePostService (EVALUAR SI ES NECESARIO)**
```typescript
// ACTUAL: src/lib/services/modulePostService.ts
// ESTADO: ❌ Imports SQLite schema
// BACKEND: ⚠️ Podría estar cubierto por WorkItemController

// ACCIÓN: Evaluar si ModulePost === WorkItem
// Si son diferentes, necesita ModulePostController en backend
```

---

## 🛠️ DEFINICIÓN DE TIPOS Y DTOs

### **Crear DTOs Frontend basados en Backend .NET**
```typescript
// UBICACIÓN: src/lib/types/api/
// FUENTE: Backend .NET DTOs

// Auth
export interface LoginRequest { ... }
export interface AuthResult { ... }
export interface UserDto { ... }

// Courses
export interface CourseDto { ... }
export interface CreateCourseDto { ... }
export interface UpdateCourseDto { ... }
export interface ModuleDto { ... }
export interface WorkItemDto { ... }

// Blog
export interface BlogPostDto { ... }
export interface BlogCategoryDto { ... }

// Events
export interface EventDto { ... }
export interface EventRegistrationDto { ... }

// Library
export interface LibraryResourceDto { ... }

// Upload
export interface MediaDto { ... }
export interface UploadStatusDto { ... }

// Common
export interface PagedResult<T> { ... }
export interface ApiResponse<T> { ... }
```

---

## 🔧 CONFIGURACIÓN HTTP SERVICES

### **BaseHttpService (Común para todos)**
```typescript
// UBICACIÓN: src/lib/services/base/baseHttpService.ts

class BaseHttpService {
  protected readonly baseURL = 'https://localhost:5251/api';

  protected async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      credentials: 'include', // CRUCIAL para cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }

  protected async fetchBlob(endpoint: string): Promise<Blob> { ... }
  protected async upload(endpoint: string, formData: FormData): Promise<any> { ... }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
```

---

## 📝 PLAN DE IMPLEMENTACIÓN

### **Orden de Implementación (Prioridad)**

#### **FASE 2.1: Core Services**
1. ✅ **AuthService** - Verificar/ajustar
2. 🔴 **BaseHttpService** - Crear infraestructura común
3. 🔴 **CourseService** - Refactorizar completamente

#### **FASE 2.2: Content Services**
4. 🟠 **BlogService** - Crear nuevo
5. 🟠 **LibraryService** - Crear nuevo
6. 🟠 **CalendarService** - Refactorizar

#### **FASE 2.3: Management Services**
7. 🟠 **UserManagementService** - Refactorizar
8. 🟠 **UploadService** - Crear nuevo

#### **FASE 2.4: Gaps (Opcional)**
9. 🟡 **PostService** - Evaluar necesidad
10. 🟡 **PostElementService** - Evaluar necesidad

---

## ⚠️ CONSIDERACIONES TÉCNICAS

### **Error Handling**
- Manejo consistente de errores HTTP
- Retry logic para fallos de red
- Fallback behavior cuando backend offline

### **Loading States**
- Loading indicators en componentes
- Optimistic updates donde apropiado
- Cache local para mejor UX

### **Authentication**
- `credentials: 'include'` en TODAS las requests
- Manejo de 401 (redirect a login)
- Verificación de permisos por rol

### **Performance**
- Debouncing para searches
- Pagination consistency
- Caching estratégico

---

## 🎯 RESULTADO ESPERADO

Al completar esta fase tendremos:

✅ **11 servicios HTTP** reemplazando acceso SQLite directo
✅ **Types/DTOs** alineados con backend .NET
✅ **Error handling** robusto
✅ **Authentication** integrada
✅ **Base infrastructure** para HTTP calls

**Frontend será 100% dependiente de backend .NET** y no tendrá acceso directo a SQLite.