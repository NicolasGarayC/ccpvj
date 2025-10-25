## Objetivo

Guiar la migración de las pruebas unitarias/integración al nuevo layout `src/lib/{application,domain,infrastructure,presentation}` y a la semántica de Svelte 5, manteniendo un registro vivo del progreso y los pendientes.

---

## Prerrequisitos

- [x] Confirmar estructura final del frontend (`presentation` + `application` + `domain` + `infrastructure` + `shared`).
- [x] Verificar que Vitest 3 / SvelteKit 5 están instalados (ya reflejado en `package.json`).

---

## Infraestructura de Testing

- [x] Mock global de i18n con `__setTranslations` / `__resetTranslations` (archivo `Front/vitest-setup-client.ts`).
- [x] Stub de `$env/dynamic/public` para pruebas.
- [x] Envolver `render` de Testing Library para restituir `component.$on` y soportar Svelte 5.
- [x] Documentar el patrón en `Documentation/TESTING_GUIDE.md`.

---

## Adopción por Módulo

### 1. Componentes Comunes (`$lib/presentation/components/common`)
- [x] Actualizar pruebas de `ConfirmationModal` a callbacks.
- [x] Migrar `FeatureCard`, `LoadingSpinner`, `Pagination`, `SuccessToast`.

### 2. Blog (`$lib/presentation/components/blog`)
- [x] Ajustar `BlogPostCard` a callbacks + mocks nuevos.
- [x] Actualizar `BlogPostList` suite (callbacks + servicios).
- [x] Revisar `BlogPostModal`, `MediaUploader`, `BlogEventRelation` (callbacks `onCreated/onUpdated/onClose`, componente inyectable para pruebas y previews genéricos).
- [x] Revisar `BlogEditor` (callbacks `onSave/onCancel`, dispatcher `saved/cancelled`, suites en Vitest con `BlogPostFormStub` / `within`).
- [x] Ajustar servicios `blogService`, `blogPostElementService` y sus tests al nuevo path.

### 3. Calendario (`$lib/presentation/components/calendar`)
- [x] Adaptar `EventForm` a callbacks + suites.
- [x] Revisar `CalendarView`, `EventList`, `UpcomingEventsWidget` (mocks + traducciones).
- [x] Adaptar servicios `calendarService` y sus pruebas.


- [x] Completar migración de `PostList` mocks (suite reducida para Svelte 5 con helpers locales).
- [x] Portar suites restantes (`ModuleForm`, `PostCard`, etc.).
	- [x] `MaterialApoyoForm` actualizado (listeners DOM + asserts de servicio).
	- [x] `ModuleCard` migra a callbacks opcionales + pruebas con inyección.
	- [x] `ModuleList` reescrito (callbacks opcionales, drag & drop con polyfills, pruebas de eventos reales).
	- [x] `PostForm` reescrito (callbacks opcionales `onCreated/onUpdated/onClose` + validaciones mínimas en Vitest).
	- [x] `PostViewer` ajustado (callback `onClose`, carga bajo demanda y suite migrada a Vitest).
	- [x] `PostCard` actualizado (callbacks `onView/onEdit/onDelete` + pruebas con preview y estados de carga).
	- [x] `ModuleForm` migrado (`onSuccess/onError/onCancel`, validaciones controladas y novalidate).
	- [x] `PostList` actualizado (callbacks externos, helpers de prueba y suite compatible con drag & drop).
- [x] Actualizar suites de servicios (`modulePostService`, `materialApoyoService`, `postElementService`, etc.).

### 5. Biblioteca (`$lib/presentation/components/library`)
- [x] Ajustar `DigitalLibraryFilters` (usa `__setTranslations`).
- [x] Revisar `DigitalLibraryCard` y servicios asociados.

### 6. Usuarios (`$lib/presentation/components/users`)
- [x] `UserForm` con callbacks globales.
- [x] `UserList` migrado a callbacks + tests adaptados.
- [x] Servicios `userManagementService` y pruebas asociadas.

### 7. Auth / Utilidades
- [x] `SessionExpiredModal` actualizado.
- [x] Revisar stores (`authStore`, `modalStore`) y suites si siguen vigentes.

### 8. Upload / Multimedia
- [x] Migrar `ContextualMediaUploader` a la nueva estructura (callbacks `onUpload*`, dropzone accesible y pruebas sin `$on`).
- [x] Completar ajustes de `MediaUploader` (detección de tipo por URL/base64 en previews y suites asociadas).
- [x] Ajustar servicios de subida / limpieza (`contextualUploadService`, `mediaCleanup`).

### 9. Analytics / Otros
- [x] Verificar suites de `analyticsService`, rutas admin y hooks.

---

## Convergencia de Servicios

- [x] Reubicar importaciones en suites (`$lib/services/**` → `$lib/application/services/**`).
- [x] Sustituir mocks de `BaseHttpService` legacy por `infrastructure/api` en los tests.
- [x] Actualizar tests de dominio (si aplican) a los nuevos tipos (`$lib/domain/**`) *(N/A por el momento)*.

---

## Validación

- [x] Ejecutar suites individuales tras cada migración de módulo.
- [x] Ejecutar `npm run test:unit -- --run` con timeout ampliado (>180 s).
- [x] Documentar convenciones en `Documentation/TESTING_GUIDE.md` (sección Svelte 5).

---

## Pendientes Identificados

- [x] `BlogEditor` pendiente de migrar a callbacks + pruebas Svelte 5.
- [x] `ContextualMediaUploader` depende de servicios nuevos → ajustar stubs y pruebas.
- [x] Servicios `application/**` aún no tienen alias actualizados en todos los tests.
- [ ] Evaluar impacto de datos fijos (género `Unknown`, mensajes en español vs i18n).

---

## Notas

- Mantener este archivo actualizado tras cada paso (checkboxes o notas en “Pendientes Identificados”).
- Si se detectan regresiones en la aplicación, registrar un **warning** adicional aquí antes de continuar con más refactors de test.
