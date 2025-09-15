# FASE 1: ANÁLISIS COMPLETO - SQLite Frontend Connections

## 📊 RESUMEN EJECUTIVO

**TOTAL ARCHIVOS AFECTADOS**: 88 archivos
**CONEXIONES DIRECTAS DB**: 45 archivos
**IMPORTS SCHEMA**: 43 archivos
**SEVERIDAD**: 🔴 CRÍTICA - Refactoring completo necesario

---

## 🔍 1.1: MAPEO COMPLETO DE CONEXIONES SQLite

### **🔴 ARCHIVOS CON `import { db }` (45 archivos)**

#### **📁 Core Infrastructure**
```typescript
// Base de datos y autenticación
✗ src/lib/server/auth.ts                           # Sistema auth completo con SQLite
✗ src/lib/server/db/index.ts                       # Conexión principal Drizzle
✗ src/lib/server/db/schema.ts                      # Esquema completo duplicado
✗ src/lib/server/db/seed.ts                        # Seeding directo SQLite
```

#### **📁 APIs de Autenticación**
```typescript
✗ src/routes/api/auth/login/+server.ts             # Login con verificación SQLite
✗ src/routes/api/auth/logout/+server.ts            # Logout con sesiones SQLite
✗ src/routes/api/test-auth/+server.ts              # Testing auth con DB
```

#### **📁 APIs de Cursos (13 archivos)**
```typescript
✗ src/routes/api/courses/+server.ts                # CRUD cursos principal
✗ src/routes/api/courses/[id]/+server.ts           # Detalle curso individual
✗ src/routes/api/courses/all/+server.ts            # Lista completa cursos
✗ src/routes/api/courses/featured/+server.ts       # Cursos destacados
✗ src/routes/api/courses/simple/+server.ts         # Cursos simplificados
✗ src/routes/api/courses/my-courses/+server.ts     # Cursos por educador
✗ src/routes/api/courses/subjects/+server.ts       # Materias disponibles
✗ src/routes/api/courses/[id]/modules/+server.ts   # Módulos por curso
✗ src/routes/api/courses/modules/+server.ts        # CRUD módulos
✗ src/routes/api/courses/modules/[id]/+server.ts   # Detalle módulo
✗ src/routes/api/courses/modules/[id]/reorder/+server.ts    # Reordenar módulos
✗ src/routes/api/courses/modules/[id]/workitems/+server.ts  # WorkItems por módulo
✗ src/routes/api/courses/[id]/remove-image/+server.ts       # Remover imagen curso
```

#### **📁 APIs de WorkItems/Posts (8 archivos)**
```typescript
✗ src/routes/api/courses/workitems/+server.ts      # CRUD WorkItems
✗ src/routes/api/courses/workitems/[id]/+server.ts # Detalle WorkItem
✗ src/routes/api/courses/workitems/[id]/reorder/+server.ts  # Reordenar WorkItems
✗ src/routes/api/posts/+server.ts                  # CRUD posts
✗ src/routes/api/posts/[id]/+server.ts             # Detalle post
✗ src/routes/api/posts/[id]/reorder/+server.ts     # Reordenar posts
✗ src/routes/api/posts/[id]/media/+server.ts       # Media por post
✗ src/routes/api/post-elements/+server.ts          # CRUD elementos post
✗ src/routes/api/post-elements/[id]/+server.ts     # Detalle elemento
✗ src/routes/api/post-elements/reorder/+server.ts  # Reordenar elementos
✗ src/routes/api/post-elements/[id]/upload/+server.ts      # Upload elementos
```

#### **📁 APIs de Upload/Media (4 archivos)**
```typescript
✗ src/routes/api/upload/images/+server.ts          # Upload imágenes
✗ src/routes/api/upload/videos/+server.ts          # Upload videos
✗ src/routes/api/upload/audio/+server.ts           # Upload audio
✗ src/routes/api/upload/course-images/+server.ts   # Upload imágenes curso
✗ src/routes/api/cleanup/+server.ts                # Limpieza archivos
```

#### **📁 APIs de Biblioteca (3 archivos)**
```typescript
✗ src/routes/api/library/+server.ts                # CRUD biblioteca
✗ src/routes/api/library/[id]/+server.ts           # Detalle recurso
✗ src/routes/api/library/[id]/download/+server.ts  # Download recurso
✗ src/routes/api/library/stats/+server.ts          # Estadísticas biblioteca
```

#### **📁 APIs de Debug/Testing (6 archivos)**
```typescript
✗ src/routes/api/debug/db-structure/+server.ts     # Estructura DB debug
✗ src/routes/api/debug/table-structures/+server.ts # Tablas DB debug
✗ src/routes/api/test/seed-courses/+server.ts      # Seeding testing
✗ src/routes/api/test/seed-direct/+server.ts       # Seeding directo
✗ src/routes/api/test/migrate-db/+server.ts        # Migraciones testing
✗ src/routes/api/test/check-users/+server.ts       # Verificación usuarios
```

#### **📁 APIs de Migración (3 archivos)**
```typescript
✗ src/routes/api/migrate/fix-course-schema/+server.ts      # Fix schema cursos
✗ src/routes/api/migrate/complete-fix/+server.ts           # Fix completo
✗ src/routes/api/seed/courses/+server.ts                   # Seed cursos
```

---

### **🟡 ARCHIVOS CON `import ... from schema` (43 archivos)**

#### **📁 Servicios Frontend**
```typescript
✗ src/lib/services/courseService.ts                # CRUD cursos service
✗ src/lib/services/modulePostService.ts            # Posts módulos service
✗ src/lib/services/postElementService.ts           # Elementos post service
✗ src/lib/services/calendar/calendarService.ts     # Calendar service
```

#### **📁 Componentes Svelte**
```typescript
✗ src/lib/components/course/PostCard.svelte        # Tarjeta post
✗ src/lib/components/course/PostForm.svelte        # Formulario post
✗ src/lib/components/course/PostViewer.svelte      # Visualizador post
```

#### **📁 APIs con Schema Imports (36 archivos adicionales)**
- Todos los archivos API listados arriba también importan schema types
- Doble dependencia: `db` connection + `schema` types

---

## 🎯 1.2: CATEGORIZACIÓN POR PRIORIDAD DE REFACTORING

### **🔴 PRIORIDAD CRÍTICA - Eliminar Inmediatamente**
```typescript
// Core infrastructure que debe eliminarse
1. src/lib/server/db/index.ts              # Conexión Drizzle
2. src/lib/server/db/schema.ts             # Esquema duplicado
3. src/lib/server/db/seed.ts               # Seeding directo
4. src/lib/server/auth.ts                  # Auth con SQLite
```

### **🟠 PRIORIDAD ALTA - Convertir a HTTP Proxy**
```typescript
// APIs más usadas que deben convertirse a proxy
1. src/routes/api/auth/*                   # Autenticación
2. src/routes/api/courses/*                # Sistema educativo
3. src/routes/api/upload/*                 # Upload archivos
4. src/routes/api/library/*                # Biblioteca
```

### **🟡 PRIORIDAD MEDIA - Refactorizar Servicios**
```typescript
// Servicios frontend que necesitan HTTP calls
1. src/lib/services/courseService.ts       # Principal
2. src/lib/services/modulePostService.ts   # Posts
3. src/lib/services/postElementService.ts  # Elementos
4. src/lib/services/calendar/calendarService.ts # Calendario
```

### **🟢 PRIORIDAD BAJA - Actualizar Componentes**
```typescript
// Componentes que usan types de schema
1. src/lib/components/course/*.svelte       # Componentes curso
2. Otros componentes con imports schema     # Componentes varios
```

---

## 📋 1.3: DEPENDENCIAS PACKAGE.JSON A ELIMINAR

### **🗑️ Dependencias SQLite/Drizzle a Remover**
```json
{
  "dependencies": {
    "drizzle-orm": "^0.40.0",           // ❌ ELIMINAR
    "@libsql/client": "^0.14.0"         // ❌ ELIMINAR
  },
  "devDependencies": {
    "drizzle-kit": "0.31.4"             // ❌ ELIMINAR
  }
}
```

### **🗑️ Scripts Database a Remover**
```json
{
  "scripts": {
    "db:push": "drizzle-kit push",      // ❌ ELIMINAR
    "db:generate": "drizzle-kit generate", // ❌ ELIMINAR
    "db:migrate": "drizzle-kit migrate",   // ❌ ELIMINAR
    "db:studio": "drizzle-kit studio",     // ❌ ELIMINAR
    "db:seed": "tsx src/lib/server/db/seed.ts" // ❌ ELIMINAR
  }
}
```

### **🗑️ Archivos Config a Eliminar**
```typescript
✗ Front/drizzle.config.ts               # Configuración Drizzle
✗ Front/.env (DATABASE_URL)             # Variable ambiente DB
```

---

## 🚨 1.4: IMPACTO Y RIESGOS IDENTIFICADOS

### **💥 Impacto Alto**
- **88 archivos afectados** requieren modificación
- **Sistema completo offline** durante refactoring
- **APIs internas deben ser reescritas** como proxy HTTP
- **Types/interfaces completamente nuevos** necesarios

### **⚠️ Riesgos Críticos**
1. **Pérdida de funcionalidad** durante transición
2. **Breaking changes** en todos los componentes
3. **Performance degradation** al cambiar SQLite → HTTP
4. **Complejidad de testing** con dependencia backend

### **🛡️ Mitigaciones Necesarias**
1. **Branch separado** para refactoring
2. **Testing exhaustivo** en cada fase
3. **Rollback plan** completo
4. **Documentación detallada** de cambios

---

## 🎯 1.5: PRÓXIMOS PASOS FASE 1

### **✅ Completado**
- [x] Mapeo completo 88 archivos afectados
- [x] Categorización por prioridad
- [x] Identificación dependencias package.json
- [x] Análisis de riesgo e impacto

### **🔄 Pendiente**
- [ ] **FASE 1.2**: Verificar APIs Backend .NET disponibles
- [ ] **FASE 1.3**: Definir nuevos servicios frontend HTTP
- [ ] **FASE 1.4**: Documentar dependencias y estrategia migración

---

**⚠️ CONCLUSIÓN FASE 1.1**: El frontend tiene **dependencia SQLite crítica** en 88 archivos. Es un refactoring **masivo** que requerirá reescribir completamente la capa de datos del frontend para usar exclusivamente HTTP calls al backend .NET.

**🎯 RECOMENDACIÓN**: Proceder con FASE 1.2 para verificar que el backend .NET tenga **cobertura completa** de APIs antes de comenzar eliminación SQLite.