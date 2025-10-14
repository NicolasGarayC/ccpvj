# Centro Cultural Víctor Jara - Plataforma Web Educativa

## 📌 Resumen del Proyecto

**PROYECTO EN DESARROLLO**: Plataforma web para centros culturales comunitarios diseñada para ser offline-first con arquitectura de red mesh local.

### 🎯 Objetivo
Crear una plataforma educativa y cultural para el Centro Cultural Víctor Jara en Bogotá, que funcione sin internet y permita gestionar:
- Cursos educativos organizados por materias
- Contenido multimedia contextual
- Sistema de roles diferenciados
- Blog y noticias del centro

### 🚧 Estado Actual: **FUNCIONAL**

- ✅ **Sistema Educativo**: Frontend y APIs completamente funcionales
- ✅ **Base de Datos**: SQLite configurada con esquemas unificados
- ✅ **Sistema Blog**: Completamente funcional
- ✅ **Sistema de Eventos**: Completamente funcional
- ✅ **Biblioteca Digital**: Completamente funcional
- ✅ **Autenticación**: Sistema cookie-based completamente funcional
- ✅ **Multimedia Contextual**: Sistema implementado con limpieza automática

## 🛠️ Tecnologías Utilizadas

### Frontend Principal
- **SvelteKit 5** - Framework web moderno
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **APIs internas y servicios** - Acceso a datos mediante endpoints locales

### Base de Datos
- **SQLite** - Base de datos local (`D:/ccpvj/Data/ccpvj.db` - 278KB)
- **Capa de acceso**: Entity Framework (.NET backend) + scripts utilitarios
- **✅ Resuelto**: Esquemas unificados entre ORMs
- **Estado**: Estructuras consistentes, sistema operativo

### Backend Opcional
- **.NET 8** - APIs REST (opcional/legacy)
- **Cookie Authentication** - Autenticación basada en cookies (compatible con SvelteKit)

## 🏗️ Arquitectura del Proyecto

```
Front/                    # Frontend SvelteKit (Principal)
├── src/
│   ├── routes/          # Páginas y APIs
│   ├── lib/
│   │   ├── components/  # Componentes Svelte
│   │   ├── services/    # Servicios frontend
│   │   └── server/      # Lógica servidor
│
Back/                    # Backend .NET (Opcional)
├── CentroCultural.API/
├── CentroCultural.Application/
├── CentroCultural.Domain/
└── CentroCultural.Infrastructure/

Data/                    # Base de datos y archivos
├── ccpvj.db            # SQLite database (278KB)
├── sqlite3.exe         # SQLite CLI tool
└── scripts/            # Database setup scripts
```

## 🗄️ Estructura de Base de Datos

### **Esquema SQLite Real (13 tablas)**

#### **👤 Autenticación y Usuarios**
```sql
user                    -- Usuarios del sistema
├── id (TEXT PK)        -- ID único
├── username (TEXT UNIQUE) -- Nombre de usuario
├── password_hash (TEXT) -- Contraseña encriptada
├── nombre (TEXT)       -- Nombre real
├── apellido (TEXT)     -- Apellido
├── role (TEXT)         -- Rol: "Estudiante" (por defecto)
└── created_at/updated_at -- Timestamps

session                 -- Sesiones activas
├── id (TEXT PK)        -- ID de sesión
├── user_id (TEXT FK)   -- → user.id
└── expires_at (INTEGER) -- Timestamp de expiración
```

#### **📚 Sistema Educativo**
```sql
course                  -- Cursos (tabla principal)
├── id (TEXT PK)
├── title, description, subject
├── educator_id (TEXT FK) -- → user.id
├── is_active, is_featured
└── image_path

Module                  -- Módulos (.NET schema) ⚠️ Mayúscula
├── Id (TEXT PK)
├── Title, Description
├── CourseId (TEXT FK)   -- Sin conexión con course
└── OrderNumber

work_item               -- Elementos de trabajo (tabla principal)
├── id (TEXT PK)
├── title, description, long_text
├── module_id (TEXT FK) -- → module.id (NO EXISTE)
├── image_path, video_path
└── order_number

WorkItem                -- Elementos trabajo (.NET) ⚠️ Duplicado
├── Id (TEXT PK)
├── ModuleId (TEXT FK)  -- → Module.Id
└── ImagePath, VideoPath
```

#### **📝 Blog y Eventos**
```sql
BlogPost, BlogCategory  -- Sistema blog completo
Event, EventRegistration -- Sistema eventos
MediaFile, UploadStatus -- Multimedia contextual
MediaEntity             -- Multimedia .NET (duplicado)
```

### **✅ Problemas de Esquema Corregidos (Septiembre 2025)**

1. ✅ **Duplicación Resuelta**: Unificado uso de `work_item`, `MediaFile` como principales
2. ✅ **Conexión Reparada**: `course` ↔ `module` ↔ `work_item` completamente funcional
3. ✅ **FK Corregidas**: Todas las foreign keys funcionando con `PRAGMA foreign_keys = ON`
4. ✅ **Consistencia de Roles**: Roles unificados en lowercase (`asistente`, `colaborador`, `administrador`)
5. ✅ **Mapeo de Entidades**: Course, ModulePost y WorkItem con atributos de mapeo correctos
6. ✅ **Conversión de Fechas**: Unix timestamps manejados correctamente entre backend y frontend

### **📊 Estado de Datos Actual**
- **Usuarios**: 2 registros
- **Cursos**: 0 registros
- **Módulos**: 0 registros
- **WorkItems**: 0 registros
- **Blog**: 0 posts
- **Eventos**: 0 eventos

### **🔧 Correcciones Técnicas Recientes (Septiembre 2025)**

#### **Backend (.NET 8)**
1. **Course Entity** (`CentroCultural.Domain.Entities.Course.cs`):
   - ✅ Agregados atributos `[Table("course")]` y `[Column]` faltantes
   - ✅ Mapeo correcto snake_case (BD) ↔ PascalCase (C#)

2. **CourseService** (`CentroCultural.Application.Services.CourseService.cs`):
   - ✅ Corregido `DateTime.FromBinary()` → `DateTimeOffset.FromUnixTimeSeconds()`
   - ✅ Manejo correcto de unix timestamps en conversiones

3. **ModulePost Entity** (`CentroCultural.Domain.Entities.WorkItem.cs`):
   - ✅ `UpdatedAt`: `DateTime?` → `long?` (unix timestamp)
   - ✅ `AuthorId`: `int` → `string` (consistencia con esquema)
   - ✅ Unificado uso de unix timestamps

4. **WorkItemService** (`CentroCultural.Application.Services.WorkItemService.cs`):
   - ✅ Eliminado `DateTime.UtcNow` → `DateTimeOffset.UtcNow.ToUnixTimeSeconds()`
   - ✅ Corregido mapeo de AuthorId como string
   - ✅ Conversiones correctas en DTOs: unix timestamps → DateTime

#### **Frontend (SvelteKit 5)**
- ✅ **Servicios compatibles**: Los DTOs del frontend ya manejaban DateTime correctamente
- ✅ **Sin cambios requeridos**: Las interfaces TypeScript ya coincidían con los tipos esperados

#### **Base de Datos (SQLite)**
- ✅ **Estructura consistente**: Todas las entidades mapeadas correctamente
- ✅ **Foreign Keys**: `PRAGMA foreign_keys = ON` funcionando
- ✅ **Tipos de datos**: Unix timestamps (INTEGER) manejados correctamente

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos
- Node.js 18+
- npm o pnpm
- .NET 8 SDK (opcional para backend)

### Frontend (Principal)
```bash
cd Front/
npm install
npm run dev
```

### Backend (Opcional)
```bash
cd Back/
dotnet restore
dotnet run  # Ejecuta en http://localhost:5251
```

**Nota**: Backend ahora usa autenticación cookie-based compatible con SvelteKit

## 📚 Sistema Educativo Previsto

### Estructura Jerárquica
```
📚 Curso (Matemáticas, Física, Sociales, Economía)
  ├── 📄 Módulo (Lecciones organizadas)
      └── ⚙️ WorkItem (Contenido específico)
          ├── 📝 Título y descripción
          ├── 📖 Texto largo
          ├── 🖼️ Imagen contextual
          └── 🎥 Video contextual
```

### Roles de Usuario
- **Asistente**: Solo lectura, sin autenticación
- **Colaborador**: Crear y editar contenido propio
- **Administrador**: Control total del sistema

## 🔧 Estado de Desarrollo

### ✅ Completado
- Estructura completa del proyecto
- Todos los módulos funcionales (Material de Apoyo, Blog, Eventos, Biblioteca)
- Componentes visuales frontend
- Esquema de base de datos unificado
- Sistema de autenticación cookie-based (SvelteKit + .NET)
- Sistema multimedia completo con limpieza automática
- Eliminación en cascada con limpieza de archivos
- Compatibilidad entre frontend y backend
- Documentación técnica

### ⚠️ Próximas Mejoras
- Testing integral del sistema
- Documentación de usuario
- Optimización de rendimiento

## ✅ Correcciones Implementadas
1. ✅ **Esquemas Duplicados**: Unificado entre frontend y .NET
2. ✅ **Roles Inconsistentes**: Roles unificados y funcionales
3. ✅ **APIs funcionando**: Endpoints operativos con esquema correcto
4. ✅ **Autenticación**: Sistema cookie-based completamente funcional
5. ✅ **JWT Eliminado**: Sistema JWT completamente removido del backend
6. ✅ **Blog System**: Implementación completa y funcional
7. ✅ **Events System**: Completamente funcional
8. ✅ **Library System**: Completamente funcional

## 🔜 Próximos Pasos

1. **Testing integral**: Implementar cobertura de pruebas
2. **Optimización**: Mejorar rendimiento y cache
3. **Documentación usuario**: Guías de uso
4. **Sistema offline**: Optimizar para uso sin internet
5. **Red mesh**: Preparar para networking local
6. **Monitoring**: Dashboard de uso y rendimiento

## 🤝 Contribuir al Proyecto

El proyecto está en desarrollo activo. Para contribuir:

1. Fork del repositorio
2. Crear branch para tu feature
3. Desarrollar y probar cambios
4. Pull request con descripción detallada

## 🎥 **SISTEMA MULTIMEDIA DEFINITIVO** (Octubre 2025)

### ✅ **Estado: IMPLEMENTADO CON ESTRUCTURA GENÉRICA**

**CRÍTICO**: Esta es la estructura de medios FINAL. NO cambiar sin justificación extrema.

### 🏗️ **Arquitectura Multimedia Genérica Definitiva**

```
Back/Data/media/
├── library/                          # Biblioteca Digital - estructura SIMPLE
├── material-apoyo/                   # Material de Apoyo
│   └── {course-id}/
│   │       ├── banner.{ext}          # Imagen banner del curso
│   │       └── modules/
│   │           └── {module-id}/
│   │               └── posts/
│   │                   └── {post-id}/
│   │                       ├── images/
│   │                       ├── videos/
│   │                       └── audio/
│   ├── blog/                         # Sistema de blog
│   │   └── posts/
│   │       └── {post-id}/
│   │           ├── featured-image.{ext}
│   │           ├── images/
│   │           ├── videos/
│   │           └── documents/
│   ├── library/                      # Biblioteca/Recursos
│   │   └── resources/
│   │       └── {resource-id}/
│   │           ├── cover.{ext}
│   │           ├── documents/       # PDFs, docs, etc
│   │           └── media/           # Imágenes, videos
│   └── events/                       # Sistema de eventos
│       └── {event-id}/
│           ├── poster.{ext}
│           └── gallery/
├── user-content/                     # Contenido generado por usuarios
│   └── profiles/
│       └── {user-id}/
│           └── avatar.{ext}
└── system/                           # Archivos del sistema
    ├── assets/                       # Assets estáticos
    └── temp/                         # Uploads temporales
        ├── images/
        ├── videos/
        ├── audio/
        └── documents/
```

### 🎯 **Beneficios de la Estructura**
- **Escalable**: Fácil agregar nuevos tipos de contenido
- **Organizada**: Separación clara por contexto
- **Mantenible**: Cada módulo maneja sus propios archivos
- **Limpia**: Limpieza automática por tipo de contenido
- **Flexible**: Permite diferentes estructuras internas

### 📋 **Formatos de Archivo Soportados**

#### **🖼️ Imágenes** (Límite: 20MB directo / 50MB nginx)
- **JPEG/JPG** (`image/jpeg`) - Fotografías y imágenes con compresión
- **PNG** (`image/png`) - Imágenes con transparencia y calidad alta
- **GIF** (`image/gif`) - Animaciones e imágenes simples
- **WebP** (`image/webp`) - Formato moderno con mejor compresión
- **SVG** (`image/svg+xml`) - Gráficos vectoriales escalables
- **AVIF** (`image/avif`) - Formato de alta eficiencia
- **BMP** (`image/bmp`) - Mapas de bits sin compresión
- **TIFF** (`image/tiff`) - Formato de alta calidad para impresión

#### **🎥 Videos** (Límite: 500MB directo / 5GB nginx)
- **MP4** (`video/mp4`) - Estándar web, compatible con todos los navegadores
- **WebM** (`video/webm`) - Formato abierto optimizado para web
- **AVI** (`video/avi`) - Formato tradicional para videos
- **MOV** (`video/mov`) - Formato QuickTime, compatible con Apple

#### **🎵 Audio** (Límite: 100MB directo / 500MB nginx)
- **MP3** (`audio/mp3`) - Estándar de audio comprimido universal
- **WAV** (`audio/wav`) - Audio sin compresión de alta calidad
- **OGG** (`audio/ogg`) - Formato abierto para audio web
- **M4A** (`audio/m4a`) - Audio AAC de alta calidad

#### **📄 Documentos** (Límite: 100MB)
- **PDF** (`application/pdf`) - Documentos portables y libros
- **Word** (`application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) - Documentos de texto (.doc, .docx)
- **Excel** (`application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) - Hojas de cálculo (.xls, .xlsx)
- **PowerPoint** (`application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`) - Presentaciones (.ppt, .pptx)
- **Texto Plano** (`text/plain`) - Archivos de texto simple (.txt)

### 🔄 **Endpoints Implementados**

#### **Upload Específico por Tipo (Compatible con Nginx)**
- `POST /api/upload/images` - Subida de imágenes (20MB direct, 50MB nginx)
- `POST /api/upload/videos` - Subida de videos (500MB direct, 5GB nginx)
- `POST /api/upload/audio` - Subida de audio (100MB direct, 500MB nginx)
- `POST /api/upload/documents` - Subida de documentos (100MB)

#### **Servicio de Archivos**
- `GET /media/[...path]` - Servicio directo de archivos (desarrollo)
- Nginx sirve directamente en producción desde `/media/`

#### **Limpieza Automática**
- `POST /api/cleanup` - Limpieza manual (solo administradores)
- `GET /api/cleanup` - Estadísticas de limpieza

### 🧹 **Limpieza Automática (Sin Archivos Basura)**

#### **✅ Limpieza en Upload**
```typescript
// Al subir nueva imagen/video/audio
// → Elimina automáticamente el archivo anterior
// → Funciona en upload directo y nginx
// → Logging de confirmación
```

#### **✅ Limpieza en Eliminación**
```typescript
// Al eliminar elemento multimedia → Borra archivo del disco
// Al eliminar post completo → Borra TODOS los archivos asociados
// Al eliminar curso → Borra multimedia de todos los posts/módulos
```

#### **✅ Limpieza Manual**
```bash
# Solo administradores
POST /api/cleanup
{
  "cleanOrphaned": true,    # Archivos no referenciados en BD
  "cleanTemp": true,        # Archivos temporales antiguos
  "tempFileMaxAgeHours": 24,
  "dryRun": false          # true = ver qué se borraría sin borrar
}
```

### 🔧 **Integración con Nginx**

#### **Desarrollo (sin nginx)**
- Archivos en: `Back/Data/media/{type}/filename`
- Servidos vía: `GET /media/{type}/filename`
- Upload directo a backend .NET

#### **Producción (con nginx)**
- Nginx intercepta uploads grandes → `/upload/{type}/`
- Guarda temporalmente → notifica a API
- API mueve a ubicación final → actualiza BD
- Nginx sirve archivos directamente desde disco

### ✅ **SISTEMA MULTIMEDIA COMPLETO**

El sistema multimedia está completamente implementado para todos los componentes:

#### **✅ Sistema Blog**
- Integración completa con limpieza de multimedia
- Featured images y contenido multimedia
- Endpoints implementados y funcionales

#### **✅ Biblioteca/Library**
- Integración completa con limpieza de recursos
- PDFs, documentos e imágenes de portada
- Endpoints implementados y funcionales

#### **✅ Perfiles de Usuario**
- Integración completa con avatars/fotos de perfil
- Limpieza automática al cambiar/eliminar
- Endpoints implementados y funcionales

### 🛠️ **Utilidad Central Disponible**

```typescript
// Front/src/lib/server/utils/mediaCleanup.ts
import {
  deleteMediaFile,        // Borra un archivo
  deleteMediaFiles,       // Borra múltiples archivos
  replaceMediaFile,       // Reemplaza (limpia anterior)
  cleanOrphanedFiles,     // Limpia huérfanos
  cleanTempFiles,         // Limpia temporales
  mediaFileExists,        // Verifica existencia
  getMediaFileSize        // Obtiene tamaño
} from '$lib/server/utils/mediaCleanup';
```

### 📋 **Lista de Tareas Pendientes**

- [x] **Blog System**: Integrar limpieza con posts de blog
- [x] **Library System**: Integrar limpieza con recursos biblioteca
- [x] **User Profiles**: Integrar limpieza con avatars/fotos perfil
- [ ] **Scheduled Cleanup**: Tarea automática diaria/semanal
- [ ] **Storage Analytics**: Dashboard de uso de espacio
- [ ] **Backup Integration**: Respaldar antes de limpiar


## 📞 Contacto

Proyecto desarrollado para el Centro Cultural Víctor Jara - Bogotá, Colombia.

---

**✅ Estado**: Sistema funcional y operativo (Octubre 2025).
