Pendientes de la migración de pruebas después del último barrido de Vitest. Cada bloque incluye el paso a paso sugerido para normalizar código y suites.

## Tareas transversales
- ✅ `analyticsService` actualizado; mantener mocks en torno a `BaseHttpClient`.
- ✅ `src/lib/i18n.test.ts` tiene stub con asserts básicos (`translate`, `t`, `setLocale`) para evitar “No test suite found”.
- ✅ Revisar suites que aún importan `$lib/services/**` y migrarlas a `$lib/application/services/**`, asegurando que los espías usen el nuevo `BaseHttpClient`.
- Para operaciones sin payload (PUT/DELETE/POST 204) mockear `status: 204` + `headers: { get: () => null }` y evitar `response.json is not a function` en las suites migradas a `BaseHttpService`.

## Blog (`$lib/presentation/components/blog`)
1. ✅ `BlogPostModal`, `MediaUploader`, `BlogPostList`, `BlogEventRelation` y `BlogEditor` migrados a callbacks opcionales, componentes inyectables para pruebas y suites Vitest estabilizadas (usa `BlogPostFormStub`, listeners DOM con `within` y validación de permisos).
2. ✅ Migrar `blogService`, `blogPostElementService` y helpers a `application/services/blog/**`, encapsulando llamadas HTTP vía `BaseHttpClient`.
3. ✅ Actualizar las suites en `__tests__` para utilizar los nuevos paths, `__setTranslations` y mocks del servicio migrado.

## Calendario (`$lib/presentation/components/calendar`)
1. ✅ `CalendarView`, `EventForm`, `EventList` y `UpcomingEventsWidget` migrados a la semántica nueva con pruebas verdes.
2. ✅ Ajustar `calendarService` dentro de `application/services/calendar` para que devuelva DTOs adaptados (incluyendo `adaptBackendToFrontend`) y reescribir la suite de servicio.
3. ✅ Una vez migrado el servicio, repasar rutas `/calendar/**` para asegurar que usan el nuevo contrato y volver a ejecutar el módulo completo.

## Biblioteca (`$lib/presentation/components/library`)
1. ✅ `DigitalLibraryCard` opera con callbacks accesibles (`onView/onDownload/onFavorite`) y mantiene estilos responsive.
2. ✅ `digitalLibraryService` en `application/services/library/**` con suites alineadas a `ApiError`; recordar mocks con `status: 204` para incrementos.
3. ✅ Rutas `/library/**` repasan el nuevo contrato del servicio y sus pruebas se ejecutaron tras la migración.

## Usuarios (`$lib/presentation/components/users`)
1. ✅ `UserList` adaptado al patrón de callbacks (verificar regresiones en dashboard de usuarios).
2. ✅ `userManagementService` y su suite viven en `application/services/users/**`, validando adaptadores, cambios de estado y permisos.
3. Ejecutar Vitest focalizado para el módulo y cubrir flujos cruzados (búsqueda, toggles) en componentes de dashboard tras integrar el servicio.

## Auth / Utilidades
1. ✅ Reinstalar `SessionExpiredModal` en `presentation/components/auth` con los eventos `onConfirm/onCancel`.
2. ✅ Migrar `jwtService`, `authStore`, `modalStore` a `application/shared` / `shared/stores`, asegurando compatibilidad con `hooks.client.ts`.
3. ✅ Actualizar suites respectivas, sustituyendo mocks legacy por espías sobre localStorage y sobre el nuevo store.

## Componentes comunes (`$lib/presentation/components/common`)
1. ✅ Reescribir `FeatureCard`, `LoadingSpinner`, `Pagination`, `SuccessToast`, `ConfirmationModal` con la estructura modular nueva.
2. ✅ Ajustar los tests para que se apoyen en callbacks (sin `component.$on`) y helpers de Testing Library adaptados a Svelte 5.
3. ✅ Ejecutar suites individuales para validar estados de carga, paginación y cierres automáticos.

## Upload / Multimedia
1. ✅ `ContextualMediaUploader` actualizado (callbacks opcionales `onUpload*`, soporte de dropzone y suites reescritas sin `$on`).
2. ✅ `MediaUploader` ajustado (detección de tipo por URL/base64, callbacks `onUploadComplete/onRemoveComplete`, suites estabilizadas).
3. ✅ Migrar `contextualUploadService`, `mediaCleanup` y servicios asociados a `application/services/upload/**`.
4. ✅ Reescribir las suites de upload con mocks de `fetch`/filesystem compatibles con Vitest y limpiar dependencias obsoletas.

## Material de apoyo / Cursos
1. ✅ Reinstalar `ModuleForm`, `ModuleList`, `PostForm`, `PostList`, `PostViewer`, tarjetas y formularios en `presentation/components/course`.
2. ✅ `materialApoyoService`, `modulePostService`, `postElementService` consumen `BaseHttpService`; mocks de prueba incluyen `status 204` y stubs de `localStorage` vía `Object.defineProperty`.
3. ✅ Pruebas de servicios y `MaterialApoyoCard` actualizadas al patrón de callbacks (`onDeleted`), manteniendo helpers de drag & drop para componentes pendientes.

## Convergencia final
- Después de cada módulo, ejecutar `npx vitest run --reporter=json --outputFile ../vitest-report.json` para seguir depurando la lista de suites rojas.
- Documentar convenciones nuevas en `TEST_MIGRATION_PLAN.md` y reflejar el avance marcando cada módulo como completado cuando sus suites queden en verde.
