# FASE 1.4: DEPENDENCIAS SQLite/Drizzle A ELIMINAR

## 🗑️ INVENTARIO COMPLETO DE ELIMINACIONES

### **📦 DEPENDENCIAS PACKAGE.JSON**

#### **🔴 Dependencies a ELIMINAR**
```json
{
  "dependencies": {
    "drizzle-orm": "^0.40.0",        // ❌ ELIMINAR - ORM SQLite
    "@libsql/client": "^0.14.0"      // ❌ ELIMINAR - Cliente SQLite
  }
}
```

#### **🔴 DevDependencies a ELIMINAR**
```json
{
  "devDependencies": {
    "drizzle-kit": "0.31.4"          // ❌ ELIMINAR - Herramientas Drizzle
  }
}
```

#### **🔴 Scripts a ELIMINAR**
```json
{
  "scripts": {
    "db:push": "drizzle-kit push",              // ❌ ELIMINAR
    "db:generate": "drizzle-kit generate",      // ❌ ELIMINAR
    "db:migrate": "drizzle-kit migrate",        // ❌ ELIMINAR
    "db:studio": "drizzle-kit studio",          // ❌ ELIMINAR
    "db:seed": "tsx src/lib/server/db/seed.ts"  // ❌ ELIMINAR
  }
}
```

#### **✅ Mantener (No relacionadas con SQLite)**
```json
{
  "dependencies": {
    "@inlang/paraglide-js": "^2.0.0",    // ✅ MANTENER - i18n
    "@oslojs/crypto": "^1.0.1",          // ✅ MANTENER - Crypto utils
    "@oslojs/encoding": "^1.1.0"         // ✅ MANTENER - Encoding utils
  },
  "overrides": {
    "cookie": "^0.7.0"                   // ✅ MANTENER - Cookies auth
  }
}
```

---

### **📁 ARCHIVOS Y DIRECTORIOS A ELIMINAR**

#### **🔴 Core Database Files**
```bash
❌ Front/src/lib/server/db/index.ts           # Conexión principal Drizzle
❌ Front/src/lib/server/db/schema.ts          # Esquema completo SQLite
❌ Front/src/lib/server/db/seed.ts            # Seeding de datos
❌ Front/src/lib/server/db/                   # TODO EL DIRECTORIO
```

#### **🔴 Configuración Drizzle**
```bash
❌ Front/drizzle.config.ts                    # Configuración Drizzle Kit
❌ Front/drizzle/                             # TODO EL DIRECTORIO
   ├── meta/0000_snapshot.json
   ├── meta/0001_snapshot.json
   ├── meta/_journal.json
   └── 0001_strong_mandarin.sql
```

#### **🔴 Variables Ambiente SQLite**
```bash
# Front/.env - MODIFICAR (no eliminar archivo completo)
❌ DATABASE_URL="file:${PROJECT_ROOT}/ccpvj/Data/ccpvj.db"

# MANTENER:
✅ PROJECT_ROOT=D:
✅ MEDIA_BASE_PATH=${PROJECT_ROOT}/ccpvj/Data/var/www/media
✅ NODE_ENV=development
```

---

### **🔧 ARCHIVOS DE CÓDIGO A REFACTORIZAR**

#### **🔴 Server Auth (ELIMINAR COMPLETAMENTE)**
```bash
❌ Front/src/lib/server/auth.ts               # Auth con SQLite directo
```

#### **🟡 Services (REFACTORIZAR A HTTP)**
```bash
🔄 Front/src/lib/services/courseService.ts        # Cambiar SQLite → HTTP
🔄 Front/src/lib/services/modulePostService.ts    # Cambiar SQLite → HTTP
🔄 Front/src/lib/services/postElementService.ts   # Cambiar SQLite → HTTP
🔄 Front/src/lib/services/calendar/calendarService.ts # Cambiar imports
🔄 Front/src/lib/services/users/userManagementService.ts # Verificar imports
```

#### **🟡 Components (ACTUALIZAR IMPORTS)**
```bash
🔄 Front/src/lib/components/course/PostCard.svelte    # Types schema → HTTP DTOs
🔄 Front/src/lib/components/course/PostForm.svelte    # Types schema → HTTP DTOs
🔄 Front/src/lib/components/course/PostViewer.svelte  # Types schema → HTTP DTOs
```

#### **🔴 API Routes (CONVERTIR A PROXY)**
```bash
# TODOS LOS 45 ARCHIVOS API CON import { db }:
🔄 Front/src/routes/api/auth/login/+server.ts
🔄 Front/src/routes/api/auth/logout/+server.ts
🔄 Front/src/routes/api/courses/+server.ts
🔄 Front/src/routes/api/courses/[id]/+server.ts
🔄 Front/src/routes/api/blog/+server.ts
🔄 Front/src/routes/api/library/+server.ts
🔄 Front/src/routes/api/upload/*/+server.ts
# ... (lista completa en FASE1_ANALISIS.md)
```

---

## 🎯 ESTRATEGIA DE ELIMINACIÓN POR FASES

### **FASE 2.1: Crear Infraestructura HTTP**
```bash
1. ✅ Crear BaseHttpService
2. ✅ Crear DTOs basados en backend .NET
3. ✅ Configurar URLs backend en environment
```

### **FASE 2.2: Refactorizar Services Core**
```bash
4. 🔄 Refactorizar CourseService → HTTP
5. 🔄 Refactorizar AuthService → Verificar HTTP
6. 🔄 Crear BlogService HTTP
7. 🔄 Crear LibraryService HTTP
```

### **FASE 2.3: Convertir APIs a Proxy**
```bash
8. 🔄 Convertir /api/auth/* → Proxy backend .NET
9. 🔄 Convertir /api/courses/* → Proxy backend .NET
10. 🔄 Convertir /api/blog/* → Proxy backend .NET
11. 🔄 Convertir /api/library/* → Proxy backend .NET
```

### **FASE 2.4: Eliminar SQLite (PUNTO DE NO RETORNO)**
```bash
12. ❌ ELIMINAR src/lib/server/db/ COMPLETO
13. ❌ ELIMINAR drizzle.config.ts
14. ❌ ELIMINAR drizzle/ directorio
15. ❌ LIMPIAR package.json dependencias
16. ❌ LIMPIAR .env DATABASE_URL
```

---

## ⚠️ PUNTO DE NO RETORNO

### **🚨 Después de FASE 2.4 NO HAY ROLLBACK**

Una vez eliminados los archivos SQLite:
- ✅ Frontend **100% dependiente** de backend .NET
- ❌ **No puede funcionar** independientemente
- ❌ **No acceso directo** a base de datos
- ✅ **Arquitectura limpia** - Frontend solo UI

### **🛡️ Preparación Pre-Eliminación**
```bash
1. ✅ BACKUP completo del proyecto
2. ✅ Branch git separado para refactoring
3. ✅ Testing exhaustivo de servicios HTTP
4. ✅ Verificación backend .NET operativo
5. ✅ Documentación completa de cambios
```

---

## 📊 MÉTRICAS DE ELIMINACIÓN

### **Archivos a Eliminar/Modificar**
- **🗑️ Eliminar**: 8 archivos core + directorio drizzle/
- **🔄 Refactorizar**: 88 archivos con imports SQLite
- **📦 Dependencies**: 3 packages SQLite
- **⚙️ Scripts**: 5 comandos database

### **Reducción Estimada**
- **-15MB**: Dependencias node_modules
- **-2MB**: Archivos schema/config/migrations
- **-50%**: Complejidad codebase (sin dual SQLite/HTTP)
- **+100%**: Dependencia backend (de 0% a 100%)

---

## 🎯 RESULTADO FINAL ESPERADO

### **✅ Frontend Limpio**
```typescript
// ANTES: Dual SQLite + HTTP
import { db } from '$lib/server/db';           // ❌ ELIMINADO
import { course } from '$lib/server/db/schema'; // ❌ ELIMINADO

// DESPUÉS: Solo HTTP
import { courseHttpService } from '$lib/services/course/courseHttpService';
const courses = await courseHttpService.getCourses(filters);
```

### **✅ Package.json Limpio**
```json
{
  "dependencies": {
    // ❌ ELIMINADO: "drizzle-orm", "@libsql/client"
    "@inlang/paraglide-js": "^2.0.0",
    "@oslojs/crypto": "^1.0.1",
    "@oslojs/encoding": "^1.1.0"
  },
  "scripts": {
    // ❌ ELIMINADO: "db:*" scripts
    "dev": "vite dev",
    "build": "vite build",
    "test": "vitest"
  }
}
```

### **✅ Arquitectura Final**
```
Frontend SvelteKit  ──HTTP──> Backend .NET ──SQLite──> Database
    (Solo UI)                   (Solo Datos)           (Solo Storage)
```

**🎯 OBJETIVO ALCANZADO**: Frontend **completamente desacoplado** de la base de datos, dependiendo **exclusivamente** del backend .NET para todas las operaciones de datos.