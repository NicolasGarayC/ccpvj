# Plan de Reorganización del Frontend - Arquitectura por Capas

> **Objetivo:** Reorganizar `Front/src/lib/` siguiendo arquitectura por capas sin romper funcionalidad existente.

---

## 📊 Estado Actual (Diagnóstico)

### Problemas Identificados

#### ❌ Problema 1: Servicios Desorganizados
```
Servicios en raíz (Front/src/lib/services/):
- contextualUploadService.ts
- digitalLibraryService.ts
- materialApoyoService.ts
- modulePostService.ts
- postElementService.ts

Servicios en subcarpetas organizadas:
- services/analytics/analyticsService.ts
- services/auth/jwtService.ts
- services/base/baseHttpService.ts
- services/blog/blogService.ts
- services/blog/blogPostElementService.ts
- services/calendar/calendarService.ts
- services/users/userManagementService.ts
```

**Resultado:** Inconsistencia - algunos organizados, otros sueltos.

#### ❌ Problema 2: Tests Mezclados
```
Tests en múltiples ubicaciones:
- services/__tests__/          (5 archivos)
- services/analytics/__tests__/
- services/auth/__tests__/
- services/blog/__tests__/
- services/calendar/__tests__/
```

**Resultado:** Difícil encontrar tests relacionados.

#### ❌ Problema 3: No Hay Separación de Capas
```
Actual (mezcla todo):
lib/
├── services/          (mezcla HTTP + lógica)
├── stores/            (estado)
├── components/        (UI)
├── types/             (tipos)
├── utils/             (utilidades)
└── server/            (server-side)
```

**Resultado:** No sigue arquitectura por capas, difícil de mantener.

---

## 🎯 Estructura Objetivo (Arquitectura por Capas)

```
Front/src/lib/
├── domain/                           # CAPA DE DOMINIO (Reglas de negocio)
│   ├── models/                       # Entidades del dominio
│   │   ├── blog/
│   │   │   ├── BlogPost.ts
│   │   │   └── BlogPostElement.ts
│   │   ├── material-apoyo/
│   │   │   ├── MaterialApoyo.ts
│   │   │   ├── Module.ts
│   │   │   └── ModulePost.ts
│   │   ├── calendar/
│   │   │   └── Event.ts
│   │   ├── library/
│   │   │   └── LibraryItem.ts
│   │   └── user/
│   │       └── User.ts
│   └── interfaces/                   # Contratos (opcional)
│       └── IService.ts
│
├── application/                      # CAPA DE APLICACIÓN (Casos de uso)
│   └── services/                     # Servicios de aplicación
│       ├── blog/
│       │   ├── BlogService.ts
│       │   ├── BlogPostElementService.ts
│       │   └── __tests__/
│       │       ├── BlogService.test.ts
│       │       └── BlogPostElementService.test.ts
│       ├── material-apoyo/
│       │   ├── MaterialApoyoService.ts
│       │   ├── ModulePostService.ts
│       │   ├── PostElementService.ts
│       │   └── __tests__/
│       │       ├── MaterialApoyoService.test.ts
│       │       ├── ModulePostService.test.ts
│       │       └── PostElementService.test.ts
│       ├── calendar/
│       │   ├── CalendarService.ts
│       │   └── __tests__/
│       │       └── CalendarService.test.ts
│       ├── library/
│       │   ├── DigitalLibraryService.ts
│       │   └── __tests__/
│       │       └── DigitalLibraryService.test.ts
│       ├── auth/
│       │   ├── JwtService.ts
│       │   └── __tests__/
│       │       └── JwtService.test.ts
│       ├── upload/
│       │   ├── ContextualUploadService.ts
│       │   └── __tests__/
│       │       └── ContextualUploadService.test.ts
│       ├── analytics/
│       │   ├── AnalyticsService.ts
│       │   └── __tests__/
│       │       └── AnalyticsService.test.ts
│       └── users/
│           ├── UserManagementService.ts
│           └── __tests__/
│               └── UserManagementService.test.ts
│
├── infrastructure/                   # CAPA DE INFRAESTRUCTURA (Acceso a datos)
│   ├── http/                         # Cliente HTTP base
│   │   ├── BaseHttpClient.ts
│   │   ├── ApiEndpoints.ts
│   │   └── HttpConfig.ts
│   ├── api/                          # Clientes API específicos (opcional)
│   │   ├── BlogApiClient.ts
│   │   └── MaterialApoyoApiClient.ts
│   └── server/                       # Utilidades server-side
│       └── utils/
│           ├── mediaCleanup.ts
│           └── pathUtils.ts
│
├── presentation/                     # CAPA DE PRESENTACIÓN (UI)
│   ├── components/                   # Componentes Svelte (se mantienen)
│   │   ├── auth/
│   │   ├── blog/
│   │   ├── calendar/
│   │   ├── common/
│   │   ├── course/
│   │   ├── library/
│   │   ├── material-apoyo/
│   │   ├── upload/
│   │   └── users/
│   ├── assets/                       # Recursos estáticos y medios de la UI
│   └── stores/                       # Estado global (Svelte stores)
│       ├── authStore.ts
│       └── themeStore.ts
│
└── shared/                           # COMPARTIDO (Cross-cutting)
    ├── types/                        # Tipos TypeScript compartidos
    │   ├── api/
    │   └── common/
    ├── utils/                        # Utilidades compartidas
    │   ├── dateUtils.ts
    │   └── formatters.ts
    ├── constants/                    # Constantes
    │   ├── apiRoutes.ts
    │   └── config.ts
    ├── config/                       # Configuración
    │   └── backend.ts
    ├── i18n/                         # Internacionalización (Paraglide, etc.)
    │   └── paraglide/
    └── session/                      # Eventos/abstracciones compartidas de sesión
        └── sessionEvents.ts
```

---

## 📋 Plan de Ejecución Paso a Paso

### FASE 0: PREPARACIÓN (Sin Cambios en Código)

#### [ ] Paso 0.1: Backup
```bash
# Crear backup completo del frontend
cp -r Front Front_backup_$(date +%Y%m%d_%H%M%S)
```

#### [ ] Paso 0.2: Verificar Tests Actuales
```bash
cd Front
npm run test:unit -- --run
```
**Resultado esperado:** Todos los tests deben pasar ✅
**Registrar cantidad:** _______ tests pasaron

#### [ ] Paso 0.3: Verificar Aplicación Funciona
```bash
npm run dev
```
**Verificar:**
- [ ] App carga sin errores en http://localhost:5173
- [ ] Login funciona
- [ ] Blog carga
- [ ] Material de Apoyo carga
- [ ] Calendario carga
- [ ] Biblioteca carga

#### [ ] Paso 0.4: Crear Branch para Reorganización
```bash
git checkout -b refactor/frontend-architecture
```

#### [ ] Paso 0.5: Unificar Servicios HTTP con `BaseHttpService`
- Revisa cada archivo en `Front/src/lib/services/**` y asegúrate de que extienda `BaseHttpService`.  
- Refactoriza servicios con `fetch` directo (`digitalLibraryService.ts`, `contextualUploadService.ts`, etc.) para heredar de `BaseHttpService`.  
- Ejecuta los tests unitarios específicos de cada servicio tras el cambio.

```bash
# Ayuda para identificar servicios sin la clase base
rg "class .*Service" Front/src/lib/services -g "*.ts" | grep -v "extends BaseHttpService"
```

#### [ ] Paso 0.6: Desacoplar `jwtService` del modal de presentación
- Crea un módulo en `Front/src/lib/shared/session/sessionEvents.ts` (o nombre similar) que exponga eventos/callbacks para expiración y cierre de sesión.  
- Actualiza `jwtService` para importar de `shared/session/sessionEvents` en lugar de depender de `authModalStore`.  
- Modifica los stores de presentación (`authModalStore`, componentes relacionados) para escuchar los eventos y abrir/cerrar el modal.  
- Vuelve a ejecutar los tests de autenticación.

#### [ ] Paso 0.7: Preparar aliases en SvelteKit, TS y Vitest
- Agrega los nuevos alias (`$lib/domain`, `$lib/application`, `$lib/infrastructure`, `$lib/presentation`, `$lib/shared`) en `svelte.config.js` (`kit.alias`).  
- Replica los alias en `tsconfig.json` (o `jsconfig.json`) y en `vitest.config.ts` (`resolve.alias`).  
- Verifica que `npm run lint`, `npm run check` y `npm run test:unit -- --run` siguen funcionando con la nueva configuración.

#### [ ] Paso 0.8: Planificar assets e internacionalización
- Define si `assets/` se moverá a `presentation/assets` (recomendado) o a `shared/assets`.  
- Planifica el traslado de `paraglide/` completo a `shared/i18n/paraglide` y toma nota de imports que deban actualizarse.  
- Registra cualquier carpeta adicional (ej. `static/`, `project.inlang/`) que requiera ajustes posteriores.

#### [ ] Paso 0.9: Checklist de preparación completada
- [ ] Todos los servicios usan `BaseHttpService` o tienen PR listo para hacerlo.  
- [ ] `jwtService` ya no importa nada desde `presentation/*`.  
- [ ] Alias configurados y pruebas básicas verdes.  
- [ ] Decisión documentada sobre destino de `assets/` y `paraglide/`.

---

### FASE 1: CREAR NUEVA ESTRUCTURA (Sin Mover Archivos Aún)

#### [ ] Paso 1.1: Crear Carpetas de Capa de Dominio
```bash
cd Front/src/lib
mkdir -p domain/models/blog
mkdir -p domain/models/material-apoyo
mkdir -p domain/models/calendar
mkdir -p domain/models/library
mkdir -p domain/models/user
mkdir -p domain/interfaces
```

#### [ ] Paso 1.2: Crear Carpetas de Capa de Aplicación
```bash
mkdir -p application/services/blog
mkdir -p application/services/material-apoyo
mkdir -p application/services/calendar
mkdir -p application/services/library
mkdir -p application/services/auth
mkdir -p application/services/upload
mkdir -p application/services/analytics
mkdir -p application/services/users
```

#### [ ] Paso 1.3: Crear Carpetas de Capa de Infraestructura
```bash
mkdir -p infrastructure/http
mkdir -p infrastructure/api
mkdir -p infrastructure/server/utils
mkdir -p infrastructure/server/utils/__tests__
```

#### [ ] Paso 1.4: Crear Carpetas de Capa de Presentación
```bash
mkdir -p presentation/components
mkdir -p presentation/stores
mkdir -p presentation/assets
```

#### [ ] Paso 1.5: Crear Carpetas Compartidas
```bash
mkdir -p shared/types/api
mkdir -p shared/types/common
mkdir -p shared/utils
mkdir -p shared/constants
mkdir -p shared/config
mkdir -p shared/i18n/paraglide
mkdir -p shared/session
```

**Verificar estructura creada:**
```bash
tree -L 3 Front/src/lib
```

---

### FASE 2: MOVER SERVICIOS (Uno a Uno, Con Tests)

#### MÓDULO 1: BLOG

##### [ ] Paso 2.1.1: Mover BlogService
```bash
cd Front/src/lib

# Mover servicio
mv services/blog/blogService.ts application/services/blog/

# Mover test
mv services/blog/__tests__/blogService.test.ts application/services/blog/__tests__/
```

##### [ ] Paso 2.1.2: Actualizar Imports en BlogService
**Archivo:** `application/services/blog/blogService.ts`

Buscar y reemplazar:
```typescript
// ANTES
import { ... } from '$lib/config/backend';

// DESPUÉS
import { ... } from '$lib/shared/config/backend';
```

##### [ ] Paso 2.1.3: Actualizar Imports en Componentes que usan BlogService
**Buscar en todos los archivos:**
```bash
grep -r "from '\$lib/services/blog/blogService" Front/src --include="*.svelte" --include="*.ts"
```

**Reemplazar:**
```typescript
// ANTES
import { blogService } from '$lib/services/blog/blogService';

// DESPUÉS
import { blogService } from '$lib/application/services/blog/blogService';
```

**Archivos a actualizar (buscar manualmente):**
- [ ] `Front/src/routes/blog/+page.svelte`
- [ ] `Front/src/routes/blog/[slug]/+page.svelte`
- [ ] `Front/src/routes/blog/create/+page.svelte`
- [ ] `Front/src/lib/components/blog/BlogPostCard.svelte`
- [ ] `Front/src/lib/components/blog/BlogPostList.svelte`
- [ ] Otros componentes que lo usen

##### [ ] Paso 2.1.4: Ejecutar Tests de Blog
```bash
npm run test:unit -- blogService
```
**Resultado esperado:** ✅ Tests deben pasar

##### [ ] Paso 2.1.5: Verificar App Funciona (Blog)
```bash
npm run dev
```
- [ ] Ir a http://localhost:5173/blog
- [ ] Verificar que carga correctamente
- [ ] Verificar que crear post funciona
- [ ] Verificar que editar post funciona

##### [ ] Paso 2.1.6: Mover BlogPostElementService
```bash
mv services/blog/blogPostElementService.ts application/services/blog/
```

##### [ ] Paso 2.1.7: Actualizar Imports de BlogPostElementService
**Buscar:**
```bash
grep -r "blogPostElementService" Front/src --include="*.svelte" --include="*.ts"
```

**Reemplazar imports y verificar.**

##### [x] Paso 2.1.8: Consolidar BlogHttpService
- Archivo legacy eliminado; `blogService` vive ahora en `application/services/blog/blogService.ts`.

##### [ ] Paso 2.1.9: Actualizar Imports de BlogHttpService
**Buscar y reemplazar imports.**

##### [ ] Paso 2.1.10: Ejecutar Todos los Tests de Blog
```bash
npm run test:unit -- blog
```
**Resultado esperado:** ✅ Todos los tests de blog pasan

##### [ ] Paso 2.1.11: Commit Parcial - Blog
```bash
git add .
git commit -m "refactor: mover servicios de blog a application/services/blog"
```

---

#### MÓDULO 2: MATERIAL DE APOYO

##### [ ] Paso 2.2.1: Mover MaterialApoyoService
```bash
mv services/materialApoyoService.ts application/services/material-apoyo/MaterialApoyoService.ts
mv services/__tests__/materialApoyoService.test.ts application/services/material-apoyo/__tests__/
```

##### [ ] Paso 2.2.2: Actualizar Imports de MaterialApoyoService
**Buscar:**
```bash
grep -r "materialApoyoService" Front/src --include="*.svelte" --include="*.ts"
```

**Reemplazar:**
```typescript
// ANTES
import { materialApoyoService } from '$lib/services/materialApoyoService';

// DESPUÉS
import { materialApoyoService } from '$lib/application/services/material-apoyo/MaterialApoyoService';
```

**Archivos a actualizar:**
- [ ] `Front/src/routes/material-apoyo/+page.svelte`
- [ ] `Front/src/routes/material-apoyo/[id]/+page.svelte`
- [ ] `Front/src/routes/material-apoyo/create/+page.svelte`
- [ ] Componentes de material-apoyo
- [ ] Otros archivos que lo usen

##### [ ] Paso 2.2.3: Mover ModulePostService
```bash
mv services/modulePostService.ts application/services/material-apoyo/ModulePostService.ts
mv services/__tests__/modulePostService.test.ts application/services/material-apoyo/__tests__/
```

##### [ ] Paso 2.2.4: Actualizar Imports de ModulePostService
**Buscar y reemplazar imports.**

##### [ ] Paso 2.2.5: Mover PostElementService
```bash
mv services/postElementService.ts application/services/material-apoyo/PostElementService.ts
mv services/__tests__/postElementService.test.ts application/services/material-apoyo/__tests__/
```

##### [ ] Paso 2.2.6: Actualizar Imports de PostElementService
**Buscar y reemplazar imports.**

##### [ ] Paso 2.2.7: Ejecutar Tests de Material de Apoyo
```bash
npm run test:unit -- material-apoyo
npm run test:unit -- modulePost
npm run test:unit -- postElement
```
**Resultado esperado:** ✅ Todos pasan

##### [ ] Paso 2.2.8: Verificar App Funciona (Material de Apoyo)
```bash
npm run dev
```
- [ ] Ir a http://localhost:5173/material-apoyo
- [ ] Verificar que carga correctamente
- [ ] Verificar CRUD funciona

##### [ ] Paso 2.2.9: Commit Parcial - Material de Apoyo
```bash
git add .
git commit -m "refactor: mover servicios de material-apoyo a application/services/material-apoyo"
```

---

#### MÓDULO 3: CALENDAR

##### [ ] Paso 2.3.1: Mover CalendarService
```bash
mv services/calendar/calendarService.ts application/services/calendar/CalendarService.ts
mv services/calendar/__tests__/calendarService.test.ts application/services/calendar/__tests__/
```

##### [ ] Paso 2.3.2: Actualizar Imports de CalendarService
**Buscar:**
```bash
grep -r "calendarService" Front/src --include="*.svelte" --include="*.ts"
```

**Reemplazar imports en:**
- [ ] Routes de calendar
- [ ] Componentes de calendar
- [ ] Otros archivos

##### [ ] Paso 2.3.3: Ejecutar Tests de Calendar
```bash
npm run test:unit -- calendar
```
**Resultado esperado:** ✅ Tests pasan

##### [ ] Paso 2.3.4: Verificar App Funciona (Calendar)
- [ ] Ir a http://localhost:5173/calendar
- [ ] Verificar funcionalidad

##### [ ] Paso 2.3.5: Commit Parcial - Calendar
```bash
git add .
git commit -m "refactor: mover servicios de calendar a application/services/calendar"
```

---

#### MÓDULO 4: DIGITAL LIBRARY

##### [ ] Paso 2.4.1: Mover DigitalLibraryService
```bash
mv services/digitalLibraryService.ts application/services/library/DigitalLibraryService.ts
mv services/__tests__/digitalLibraryService.test.ts application/services/library/__tests__/
```

##### [ ] Paso 2.4.2: Actualizar Imports de DigitalLibraryService
**Buscar y reemplazar imports.**

##### [ ] Paso 2.4.3: Ejecutar Tests de Library
```bash
npm run test:unit -- digitalLibrary
```

##### [ ] Paso 2.4.4: Verificar App Funciona (Library)
- [ ] Ir a http://localhost:5173/library

##### [ ] Paso 2.4.5: Commit Parcial - Library
```bash
git add .
git commit -m "refactor: mover servicios de library a application/services/library"
```

---

#### MÓDULO 5: AUTH

##### [ ] Paso 2.5.1: Mover JwtService
```bash
# Ya está en services/auth/, solo mover a application
mv services/auth/jwtService.ts application/services/auth/JwtService.ts
mv services/auth/__tests__/jwtService.test.ts application/services/auth/__tests__/
```

##### [ ] Paso 2.5.2: Actualizar Imports de JwtService
**Buscar y reemplazar.**

- Asegúrate de que `JwtService` importe `sessionEvents` desde `$lib/shared/session/sessionEvents`.  
- Verifica que no queden referencias a `$lib/stores/authStore` dentro del servicio.

##### [ ] Paso 2.5.3: Ejecutar Tests de Auth
```bash
npm run test:unit -- jwt
```

##### [ ] Paso 2.5.4: Verificar Login Funciona
- [ ] Ir a http://localhost:5173/auth/login
- [ ] Hacer login
- [ ] Verificar sesión

##### [ ] Paso 2.5.5: Commit Parcial - Auth
```bash
git add .
git commit -m "refactor: mover servicios de auth a application/services/auth"
```

---

#### MÓDULO 6: UPLOAD

##### [ ] Paso 2.6.1: Mover ContextualUploadService
```bash
mv services/contextualUploadService.ts application/services/upload/ContextualUploadService.ts
mv services/__tests__/contextualUploadService.test.ts application/services/upload/__tests__/
```

##### [ ] Paso 2.6.2: Actualizar Imports de ContextualUploadService
**Buscar y reemplazar.**

##### [ ] Paso 2.6.3: Ejecutar Tests de Upload
```bash
npm run test:unit -- contextualUpload
```

##### [ ] Paso 2.6.4: Verificar Upload Funciona
- [ ] Subir imagen en blog
- [ ] Subir video en material-apoyo
- [ ] Verificar uploads funcionan

##### [ ] Paso 2.6.5: Commit Parcial - Upload
```bash
git add .
git commit -m "refactor: mover servicios de upload a application/services/upload"
```

---

#### MÓDULO 7: ANALYTICS

##### [ ] Paso 2.7.1: Mover AnalyticsService
```bash
# Ya está en services/analytics/, solo mover a application
mv services/analytics/analyticsService.ts application/services/analytics/AnalyticsService.ts
mv services/analytics/__tests__/analyticsService.test.ts application/services/analytics/__tests__/
```

##### [ ] Paso 2.7.2: Actualizar Imports de AnalyticsService
**Buscar y reemplazar.**

##### [ ] Paso 2.7.3: Ejecutar Tests de Analytics
```bash
npm run test:unit -- analytics
```

##### [ ] Paso 2.7.4: Commit Parcial - Analytics
```bash
git add .
git commit -m "refactor: mover servicios de analytics a application/services/analytics"
```

---

#### MÓDULO 8: USERS

##### [ ] Paso 2.8.1: Mover UserManagementService
```bash
mv services/users/userManagementService.ts application/services/users/UserManagementService.ts
```

##### [ ] Paso 2.8.2: Actualizar Imports de UserManagementService
**Buscar y reemplazar.**

##### [ ] Paso 2.8.3: Verificar Gestión de Usuarios Funciona
- [ ] Ir a dashboard de usuarios
- [ ] Verificar funcionalidad

##### [ ] Paso 2.8.4: Commit Parcial - Users
```bash
git add .
git commit -m "refactor: mover servicios de users a application/services/users"
```

---

### FASE 3: MOVER INFRAESTRUCTURA

#### [ ] Paso 3.1: Mover BaseHttpService
```bash
mv services/base/baseHttpService.ts infrastructure/http/BaseHttpClient.ts
```

#### [ ] Paso 3.2: Actualizar Imports de BaseHttpService
**Buscar:**
```bash
grep -r "baseHttpService" Front/src --include="*.ts"
```

**Reemplazar:**
```typescript
// ANTES
import { BaseHttpService } from '$lib/services/base/baseHttpService';

// DESPUÉS
import { BaseHttpClient } from '$lib/infrastructure/http/BaseHttpClient';
```

#### [ ] Paso 3.3: Mover Server Utils
```bash
mv server/utils/* infrastructure/server/utils/
```

#### [ ] Paso 3.4: Actualizar Imports de Server Utils
**Buscar y reemplazar imports de:**
- `mediaCleanup.ts`
- Otros archivos en `server/utils/`

#### [ ] Paso 3.5: Sincronizar Configuración de Tests
- Ajusta rutas en `vitest.config.ts`, `vitest-setup-*.ts` y cualquier mock que apunte a `server/utils`.  
- Si hay pruebas específicas para utilidades de servidor, actualiza sus imports y ejecútalas.

#### [ ] Paso 3.6: Ejecutar TODOS los Tests
```bash
npm run test:unit -- --run
```
**Resultado esperado:** ✅ Todos los tests pasan

#### [ ] Paso 3.7: Commit - Infraestructura
```bash
git add .
git commit -m "refactor: mover infraestructura a infrastructure/"
```

---

### FASE 4: MOVER PRESENTACIÓN

#### [ ] Paso 4.1: Mover Components
```bash
mv components/* presentation/components/
```

#### [ ] Paso 4.2: Actualizar Imports de Components
**Buscar:**
```bash
grep -r "\$lib/components/" Front/src --include="*.svelte" --include="*.ts"
```

**Reemplazar:**
```typescript
// ANTES
import Component from '$lib/components/...';

// DESPUÉS
import Component from '$lib/presentation/components/...';
```

**Nota:** Esto afectará MUCHOS archivos. Hacerlo con cuidado.

#### [ ] Paso 4.3: Mover Assets
```bash
mv assets/* presentation/assets/
```

#### [ ] Paso 4.4: Actualizar Imports de Assets
- Reemplaza referencias a `$lib/assets/...` o rutas relativas por `$lib/presentation/assets/...` o rutas relativas desde los componentes.
- Revisa scripts de build o configuraciones que copien assets para asegurarte de que apuntan al nuevo directorio.

#### [ ] Paso 4.5: Mover Stores
```bash
mv stores/* presentation/stores/
```

#### [ ] Paso 4.6: Actualizar Imports de Stores
**Buscar:**
```bash
grep -r "\$lib/stores/" Front/src --include="*.svelte" --include="*.ts"
```

**Reemplazar:**
```typescript
// ANTES
import { store } from '$lib/stores/...';

// DESPUÉS
import { store } from '$lib/presentation/stores/...';
```

- Actualiza `authModalStore` (ahora en `presentation/stores`) para que se suscriba a los eventos definidos en `$lib/shared/session/sessionEvents`.

#### [ ] Paso 4.7: Ejecutar TODOS los Tests
```bash
npm run test:unit -- --run
```

#### [ ] Paso 4.8: Verificar TODA la App Funciona
```bash
npm run dev
```
**Verificar:**
- [ ] Todas las páginas cargan
- [ ] Todos los formularios funcionan
- [ ] Login funciona
- [ ] CRUD en todos los módulos funciona

#### [ ] Paso 4.9: Commit - Presentación
```bash
git add .
git commit -m "refactor: mover presentación a presentation/"
```

---

### FASE 5: MOVER SHARED

#### [ ] Paso 5.1: Mover Types
```bash
mv types/* shared/types/
```

#### [ ] Paso 5.2: Actualizar Imports de Types
**Buscar y reemplazar:**
```typescript
// ANTES
import type { ... } from '$lib/types/...';

// DESPUÉS
import type { ... } from '$lib/shared/types/...';
```

#### [ ] Paso 5.3: Mover Utils
```bash
mv utils/* shared/utils/
```

#### [ ] Paso 5.4: Actualizar Imports de Utils
**Buscar y reemplazar.**

#### [ ] Paso 5.5: Mover Config
```bash
mv config/* shared/config/
```

#### [ ] Paso 5.6: Actualizar Imports de Config
**Buscar y reemplazar:**
```typescript
// ANTES
import { ... } from '$lib/config/backend';

// DESPUÉS
import { ... } from '$lib/shared/config/backend';
```

#### [ ] Paso 5.7: Mover Internacionalización (Paraglide)
```bash
mv paraglide shared/i18n/
```

#### [ ] Paso 5.8: Actualizar Imports de i18n
- Cambia cualquier referencia a `$lib/paraglide/...` por `$lib/shared/i18n/paraglide/...`.  
- Ajusta scripts (`project.inlang`, jobs de build) para usar la nueva ruta.

#### [ ] Paso 5.9: Sincronizar utilidades compartidas de sesión
- Mueve o crea `shared/session/sessionEvents.ts` y asegura que `jwtService` y los stores de presentación importen desde allí.  
- Actualiza los tests para reflejar la nueva ruta de los mocks.

#### [ ] Paso 5.10: Ejecutar TODOS los Tests
```bash
npm run test:unit -- --run
```

#### [ ] Paso 5.11: Commit - Shared
```bash
git add .
git commit -m "refactor: mover shared a shared/"
```

---

### FASE 6: LIMPIEZA

#### [ ] Paso 6.1: Eliminar Carpetas Vacías Antiguas
```bash
# Verificar que están vacías primero
ls -la services/
ls -la components/
ls -la stores/
ls -la types/
ls -la utils/
ls -la config/
[ -d assets ] && ls -la assets/
[ -d paraglide ] && ls -la paraglide/

# Si están vacías, eliminar
rmdir services/base
rmdir services/blog
rmdir services/calendar
rmdir services/analytics
rmdir services/auth
rmdir services/users
rmdir services
rmdir components
rmdir stores
rmdir types
rmdir utils
rmdir config
[ -d assets ] && rmdir assets
[ -d paraglide ] && rmdir paraglide
rmdir server
```

#### [ ] Paso 6.2: Verificar No Quedan Imports Antiguos
```bash
# Buscar imports antiguos que puedan haber quedado
grep -r "\$lib/services/" Front/src --include="*.svelte" --include="*.ts" | grep -v "application/services"
grep -r "\$lib/components/" Front/src --include="*.svelte" --include="*.ts" | grep -v "presentation/components"
grep -r "\$lib/stores/" Front/src --include="*.svelte" --include="*.ts" | grep -v "presentation/stores"
grep -r "\$lib/types/" Front/src --include="*.svelte" --include="*.ts" | grep -v "shared/types"
grep -r "\$lib/assets/" Front/src --include="*.svelte" --include="*.ts" | grep -v "presentation/assets"
grep -r "\$lib/paraglide/" Front/src --include="*.svelte" --include="*.ts" | grep -v "shared/i18n/paraglide"
```

**Si encuentra algo:** Corregir manualmente.

#### [ ] Paso 6.3: Ejecutar Build de Producción
```bash
npm run build
```
**Resultado esperado:** ✅ Build exitoso sin errores

#### [ ] Paso 6.4: Ejecutar TODOS los Tests (Final)
```bash
npm run test:unit -- --run
```
**Resultado esperado:** ✅ Todos los tests pasan (~2,100 tests)

#### [ ] Paso 6.5: Ejecutar Tests E2E
```bash
# Terminal 1
cd Back && dotnet run

# Terminal 2
cd Front
npm run test:e2e
```
**Resultado esperado:** ✅ Tests E2E pasan

#### [ ] Paso 6.6: Commit Final - Limpieza
```bash
git add .
git commit -m "refactor: limpieza de carpetas antiguas - reorganización completa"
```

---

### FASE 7: DOCUMENTACIÓN

#### [ ] Paso 7.1: Actualizar README.md del Frontend
**Archivo:** `Front/README.md`

Agregar sección:
```markdown
## Arquitectura por Capas

El frontend sigue arquitectura por capas:

```
Front/src/lib/
├── domain/           # Modelos de dominio y reglas de negocio
├── application/      # Servicios de aplicación y casos de uso
├── infrastructure/   # Acceso a datos, HTTP, servidor
├── presentation/     # Componentes UI y stores
└── shared/          # Código compartido (types, utils, config)
```

Ver `Documentation/FRONTEND_ARCHITECTURE.md` para más detalles.
```

#### [ ] Paso 7.2: Crear Documento de Arquitectura
**Archivo:** `Documentation/FRONTEND_ARCHITECTURE.md`

Crear documento explicando:
- Capas y responsabilidades
- Flujo de datos
- Convenciones de nomenclatura
- Cómo agregar nuevos módulos

#### [ ] Paso 7.3: Actualizar Imports en Documentación
**Archivos a revisar:**
- `Documentation/CLAUDE.md`
- `Documentation/PROJECT_STRUCTURE.md`
- Cualquier otro documento que mencione rutas

#### [ ] Paso 7.4: Commit - Documentación
```bash
git add .
git commit -m "docs: actualizar documentación con nueva arquitectura"
```

---

### FASE 8: VALIDACIÓN FINAL

#### [ ] Paso 8.1: Verificación Completa de Funcionalidad

**Testing:**
- [ ] `npm run test:unit -- --run` → Todos pasan
- [ ] `npm run test:e2e` → Todos pasan
- [ ] `npm run build` → Build exitoso

**Manual:**
- [ ] Login/Logout funciona
- [ ] Blog: crear, editar, eliminar posts funciona
- [ ] Material de Apoyo: CRUD completo funciona
- [ ] Calendar: CRUD de eventos funciona
- [ ] Library: CRUD de items funciona
- [ ] Uploads: subir archivos funciona en todos los contextos
- [ ] Analytics: dashboard de analytics carga
- [ ] Users: gestión de usuarios funciona

#### [ ] Paso 8.2: Revisar Performance
```bash
npm run dev
```
- [ ] La app carga rápido (< 3 segundos)
- [ ] No hay errores en consola
- [ ] No hay warnings críticos

#### [ ] Paso 8.3: Code Review Propio
- [ ] Revisar commits realizados
- [ ] Verificar que no se perdió código
- [ ] Verificar que todos los imports están correctos

#### [ ] Paso 8.4: Merge a Rama Principal
```bash
git checkout desarrollo  # o master/main
git merge refactor/frontend-architecture
git push origin desarrollo
```

---

## 📊 Checklist de Verificación Final

### Estructura de Carpetas
- [ ] `Front/src/lib/domain/` existe y tiene contenido
- [ ] `Front/src/lib/application/` existe y tiene todos los servicios
- [ ] `Front/src/lib/infrastructure/` existe y tiene http/server
- [ ] `Front/src/lib/presentation/` existe y tiene components/stores/assets
- [ ] `Front/src/lib/shared/` existe y tiene types/utils/config
- [ ] `Front/src/lib/shared/i18n/` contiene Paraglide y recursos de traducción
- [ ] `Front/src/lib/shared/session/` contiene eventos/utilidades sin dependencias de UI
- [ ] Carpetas antiguas (`services/`, `components/`, etc.) eliminadas

### Tests
- [ ] Total de tests: ~2,100 (mismo que antes)
- [ ] Todos los tests pasan
- [ ] Tests E2E pasan
- [ ] Cobertura se mantiene o mejora

### Funcionalidad
- [ ] Todas las páginas cargan
- [ ] Todos los CRUD funcionan
- [ ] Login/Auth funciona
- [ ] Uploads funcionan
- [ ] No hay errores en consola

### Documentación
- [ ] README.md actualizado
- [ ] Documento de arquitectura creado
- [ ] CLAUDE.md actualizado con nueva estructura

---

## 🚨 Plan de Rollback (Si Algo Sale Mal)

Si en cualquier momento algo falla:

### Opción 1: Revertir Último Commit
```bash
git reset --hard HEAD~1
```

### Opción 2: Volver al Backup
```bash
cd ..
rm -rf Front
mv Front_backup_YYYYMMDD_HHMMSS Front
```

### Opción 3: Volver a Branch Anterior
```bash
git checkout desarrollo  # o tu branch principal
git branch -D refactor/frontend-architecture
```

---

## 📝 Notas Importantes

### Orden de Ejecución
**CRÍTICO:** Seguir el orden exacto. No saltar pasos.

### Tests Constantes
Ejecutar tests después de cada módulo movido. Si fallan, NO continuar.

### Commits Frecuentes
Hacer commit después de cada módulo exitoso. Permite rollback granular.

### Imports
Usar búsqueda global (`grep` o Find in Files del IDE) para actualizar todos los imports.

### Tiempo Estimado
- **Preparación:** 30 min
- **Por módulo:** 30-60 min cada uno (8 módulos = 4-8 horas)
- **Infraestructura:** 1 hora
- **Presentación:** 2-3 horas (muchos archivos)
- **Shared:** 1 hora
- **Limpieza:** 1 hora
- **Documentación:** 1-2 horas
- **TOTAL:** 10-16 horas de trabajo concentrado

### Recomendación
Hacer en sesiones de 2-3 horas, completando 2-3 módulos por sesión.

---

## ✅ Criterios de Éxito

La reorganización es exitosa cuando:

1. ✅ Todos los tests pasan (~2,100 tests)
2. ✅ Tests E2E pasan (~100 tests)
3. ✅ Build de producción funciona sin errores
4. ✅ Todas las funcionalidades de la app funcionan
5. ✅ No hay errores en consola del navegador
6. ✅ No hay warnings críticos de TypeScript
7. ✅ Estructura de carpetas sigue arquitectura por capas
8. ✅ Documentación actualizada
9. ✅ Performance se mantiene o mejora
10. ✅ Código más organizado y mantenible

---

**Fecha de creación:** 2025-10-21
**Última actualización:** 2025-10-21
**Estado:** Listo para ejecución
