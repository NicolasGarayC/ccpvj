# Plan de Refactorización: Frontend Solo con Backend APIs

## 📌 Situación Actual

**PROBLEMA DETECTADO**: El frontend SvelteKit tiene **acceso directo a SQLite** mediante Drizzle ORM, violando la arquitectura deseada donde **SOLO el backend .NET debe acceder a la base de datos**.

### 🔍 Análisis del Estado Actual

#### ✅ **Conexión SQLite Directa Encontrada**
- **Archivo principal**: `Front/src/lib/server/db/index.ts` - Conexión Drizzle directa a SQLite
- **Schema propio**: `Front/src/lib/server/db/schema.ts` - Definiciones de tablas duplicadas
- **47 archivos afectados** que importan o usan la conexión SQLite
- **APIs internas** que hacen CRUD directo sin pasar por backend .NET

#### 🎯 **Arquitectura Objetivo**
```
Frontend SvelteKit ──HTTP──> Backend .NET ──SQLite──> Database

❌ NO: Frontend ──Direct SQLite──> Database
✅ SÍ: Frontend ──API Calls──> Backend ──SQLite──> Database
```

---

## 🗂️ **STEP BY STEP - REFACTORIZACIÓN COMPLETA**

### **FASE 1: ANÁLISIS Y PREPARACIÓN** 📋

#### **Paso 1.1: Inventario Completo de Conexiones SQLite**
- [ ] **Mapear todos los archivos** que usan `db` import (47 archivos encontrados)
- [ ] **Catalogar APIs internas** que hacen operaciones CRUD directas
- [ ] **Identificar tipos/interfaces** importados desde schema SQLite
- [ ] **Documentar dependencias** de Drizzle ORM en package.json

#### **Paso 1.2: Verificar APIs Backend .NET Disponibles**
- [ ] **Auditar endpoints .NET** para asegurar cobertura completa
- [ ] **Verificar autenticación** cookie-based compatible
- [ ] **Documentar gaps** de funcionalidad entre frontend y backend
- [ ] **Definir nuevos endpoints** .NET requeridos

#### **Paso 1.3: Definir Nuevos Servicios Frontend**
- [ ] **Diseñar servicios HTTP** para reemplazar acceso directo SQLite
- [ ] **Definir interfaces TypeScript** basadas en DTOs del backend
- [ ] **Planificar manejo de errores** y estados de carga
- [ ] **Documentar cambios** en authService para integración total

---

### **FASE 2: CREACIÓN DE SERVICIOS HTTP** 🌐

#### **Paso 2.1: Refactorizar AuthService**
- [ ] **Eliminar imports SQLite** de auth.ts
- [ ] **Convertir a HTTP-only** todas las operaciones auth
- [ ] **Integrar completamente** con backend .NET
- [ ] **Actualizar session management** para usar cookies exclusivamente

#### **Paso 2.2: Crear HTTP Services por Módulo**
```typescript
// Servicios a crear/refactorizar:
- courseService.ts        → HTTP calls a /api/course/*
- modulePostService.ts    → HTTP calls a /api/modules/*
- postElementService.ts   → HTTP calls a /api/workitems/*
- blogService.ts          → HTTP calls a /api/blog/*
- libraryService.ts       → HTTP calls a /api/library/*
- calendarService.ts      → HTTP calls a /api/calendar/*
- userManagementService.ts → HTTP calls a /api/users/*
```

#### **Paso 2.3: Definir Types/Interfaces HTTP**
- [ ] **Crear DTOs frontend** basados en backend .NET
- [ ] **Eliminar imports** de schema SQLite
- [ ] **Definir response types** para todas las APIs
- [ ] **Crear error handling** types

---

### **FASE 3: REFACTORIZACIÓN DE APIs INTERNAS** 🔄

#### **Paso 3.1: Convertir APIs /api/* a Proxy**
```typescript
// Convertir de: Direct SQLite Access
// A: HTTP Proxy al Backend .NET

Archivos a refactorizar (47 archivos):
□ /api/auth/* (login, logout, me)
□ /api/courses/* (CRUD courses)
□ /api/blog/* (CRUD blog posts)
□ /api/library/* (CRUD library resources)
□ /api/upload/* (file uploads)
□ /api/cleanup/* (media cleanup)
□ /api/debug/* (debug endpoints)
```

#### **Paso 3.2: Actualizar Componentes Svelte**
```typescript
// Componentes que importan schema SQLite:
□ PostCard.svelte
□ PostForm.svelte
□ PostViewer.svelte
□ CourseForm.svelte
□ ModuleForm.svelte
□ WorkItemForm.svelte
// + otros componentes encontrados
```

#### **Paso 3.3: Eliminar Funcionalidad Database Directa**
- [ ] **Remover db imports** de todos los archivos
- [ ] **Eliminar schema.ts** frontend
- [ ] **Remover Drizzle config** frontend
- [ ] **Limpiar package.json** de dependencias SQLite

---

### **FASE 4: TESTING Y VALIDACIÓN** 🧪

#### **Paso 4.1: Verificar Conectividad Backend**
- [ ] **Test all endpoints** .NET responden correctamente
- [ ] **Verificar autenticación** cookie-based funciona
- [ ] **Validar CORS** configuración para SvelteKit
- [ ] **Test error handling** para conexión perdida

#### **Paso 4.2: Actualizar Tests Frontend**
- [ ] **Refactorizar unit tests** para usar mocks HTTP
- [ ] **Actualizar E2E tests** para arquitectura backend-only
- [ ] **Test offline behavior** cuando backend no disponible
- [ ] **Validar performance** con HTTP vs SQLite directo

#### **Paso 4.3: Documentación y Deploy**
- [ ] **Actualizar README** frontend para reflejar dependencia backend
- [ ] **Documentar nuevos services** HTTP
- [ ] **Actualizar deployment** instructions
- [ ] **Test en ambiente** de desarrollo integrado

---

### **FASE 5: LIMPIEZA Y OPTIMIZACIÓN** 🧹

#### **Paso 5.1: Eliminar Código SQLite**
- [ ] **Remover directorio** `src/lib/server/db/`
- [ ] **Limpiar package.json** de dependencias database
- [ ] **Remover scripts** db:* de package.json
- [ ] **Eliminar .env** DATABASE_URL referencias

#### **Paso 5.2: Optimizar Servicios HTTP**
- [ ] **Implementar caching** para requests frecuentes
- [ ] **Batch operations** donde sea posible
- [ ] **Optimizar error handling** y retry logic
- [ ] **Implementar loading states** en componentes

#### **Paso 5.3: Validación Final**
- [ ] **Test funcionalidad completa** sin SQLite frontend
- [ ] **Verificar dependencia** backend funcionando
- [ ] **Validate error scenarios** cuando backend down
- [ ] **Performance testing** arquitectura final

---

## 📊 **ARCHIVOS ESPECÍFICOS A MODIFICAR**

### **🔴 CRÍTICOS - Eliminar/Refactorizar**
```
🗑️  ELIMINAR:
- Front/src/lib/server/db/index.ts
- Front/src/lib/server/db/schema.ts
- Front/src/lib/server/db/seed.ts
- Front/drizzle.config.ts

🔄 REFACTORIZAR COMPLETAMENTE:
- Front/src/lib/services/courseService.ts
- Front/src/lib/services/authService.ts
- Front/src/lib/server/auth.ts
- Front/src/routes/api/*/+server.ts (47 archivos)
```

### **🟡 IMPORTANTES - Actualizar Imports**
```
📝 ACTUALIZAR TYPES:
- Front/src/lib/components/course/*.svelte
- Front/src/lib/components/blog/*.svelte
- Front/src/lib/services/*/*.ts
- Front/src/routes/**/+page.svelte (páginas con datos)
```

### **🟢 CONFIGURACIÓN - Limpiar**
```
🧹 LIMPIAR:
- Front/package.json (remover drizzle, @libsql/client)
- Front/.env (remover DATABASE_URL)
- Front/src/app.html (si hay referencias DB)
```

---

## ⚠️ **RIESGOS Y CONSIDERACIONES**

### **🚨 Riesgos Altos**
1. **Frontend quedará inoperable** sin backend .NET funcionando
2. **Pérdida de performance** al cambiar SQLite directo por HTTP
3. **Complejidad adicional** en manejo de errores de red
4. **Dependencia crítica** en disponibilidad del backend

### **🛡️ Mitigaciones**
1. **Testing exhaustivo** en cada fase
2. **Rollback plan** manteniendo branch con SQLite
3. **Error handling robusto** para casos offline
4. **Documentation clara** de nueva arquitectura

### **📈 Beneficios Esperados**
1. **Arquitectura limpia** - Frontend solo UI, Backend solo datos
2. **Seguridad mejorada** - No acceso directo a DB desde frontend
3. **Escalabilidad** - Backend puede servir múltiples frontends
4. **Mantenibilidad** - Separación clara de responsabilidades

---

## 🕐 **ESTIMACIÓN DE TIEMPO**

| Fase | Estimación | Complejidad |
|------|------------|-------------|
| **Fase 1**: Análisis y Preparación | 4-6 horas | Media |
| **Fase 2**: Servicios HTTP | 8-12 horas | Alta |
| **Fase 3**: Refactorización APIs | 12-16 horas | Muy Alta |
| **Fase 4**: Testing y Validación | 6-8 horas | Media |
| **Fase 5**: Limpieza y Optimización | 4-6 horas | Baja |
| **TOTAL ESTIMADO** | **34-48 horas** | **Proyecto Grande** |

---

## 🎯 **PRÓXIMOS PASOS INMEDIATOS**

1. **Confirmar plan** con el equipo de desarrollo
2. **Priorizar fases** según urgencia del proyecto
3. **Preparar ambiente** de testing integrado
4. **Comenzar con Fase 1** - Análisis detallado

**⚠️ IMPORTANTE**: Este es un refactoring mayor que cambiará fundamentalmente la arquitectura del frontend. Se recomienda proceder por fases y con testing exhaustivo en cada etapa.