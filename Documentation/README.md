# Centro Cultural Víctor Jara - Plataforma Web Educativa

## 📌 Resumen del Proyecto

**PROYECTO EN DESARROLLO**: Plataforma web para centros culturales comunitarios diseñada para ser offline-first con arquitectura de red mesh local.

### 🎯 Objetivo
Crear una plataforma educativa y cultural para el Centro Cultural Víctor Jara en Bogotá, que funcione sin internet y permita gestionar:
- Cursos educativos organizados por materias
- Contenido multimedia contextual
- Sistema de roles diferenciados
- Blog y noticias del centro

### 🚧 Estado Actual: **FUNCIONAL - EN DESARROLLO ACTIVO**

- ✅ **Sistema Educativo**: Frontend y APIs completamente funcionales
- ✅ **Base de Datos**: SQLite configurada con esquemas unificados
- ⚠️ **Sistema Blog**: Implementación parcial, requiere finalización
- ✅ **Autenticación**: Sistema cookie-based completamente funcional (JWT eliminado)
- ✅ **Multimedia Contextual**: Sistema implementado con limpieza automática

## 🛠️ Tecnologías Utilizadas

### Frontend Principal
- **SvelteKit 5** - Framework web moderno
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Drizzle ORM** - Manejo de base de datos

### Base de Datos
- **SQLite** - Base de datos local (`D:/ccpvj/Data/ccpvj.db` - 278KB)
- **ORM Dual**: Drizzle (frontend) + Entity Framework (.NET backend)
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
course                  -- Cursos (Drizzle schema)
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

work_item               -- Elementos de trabajo (Drizzle)
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

### **🔴 Problemas de Esquema Identificados**

1. **Duplicación**: `work_item` vs `WorkItem`, `MediaFile` vs `MediaEntity`
2. **Desconexión**: `course` (minúscula) vs `Module` (mayúscula) no conectan
3. **FK Faltante**: `work_item.module_id` apunta a tabla `module` que no existe
4. **Inconsistencia**: Roles por defecto diferentes entre schemas
5. **Datos Vacíos**: Solo estructura, sin contenido real

### **📊 Estado de Datos Actual**
- **Usuarios**: 2 registros
- **Cursos**: 0 registros
- **Módulos**: 0 registros
- **WorkItems**: 0 registros
- **Blog**: 0 posts
- **Eventos**: 0 eventos

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
- Estructura básica del proyecto
- Componentes visuales frontend
- Esquema de base de datos unificado
- Sistema de autenticación cookie-based (SvelteKit + .NET)
- Eliminación completa del sistema JWT
- Compatibilidad entre frontend y backend
- Documentación técnica

### ⚠️ En Desarrollo/Con Problemas
- Integración completa frontend-backend
- Testing integral del sistema
- Sistema de blog funcional

### ❌ Pendiente
- Testing completo
- Documentación de usuario
- Optimización de rendimiento

## 🐛 Problemas Conocidos

### ✅ **Resueltos Recientemente**
1. ✅ **Esquemas Duplicados**: Unificado entre Drizzle y .NET
2. ✅ **Roles Inconsistentes**: Roles unificados y funcionales
3. ✅ **APIs funcionando**: Endpoints operativos con esquema correcto
4. ✅ **Autenticación**: Sistema cookie-based completamente funcional
5. ✅ **JWT Eliminado**: Sistema JWT completamente removido del backend

### ⚠️ **Funcionalidad en Desarrollo**
6. **Blog**: Implementación parcial, requiere finalización
7. **Testing**: Sin cobertura de pruebas integral
8. **Integración**: Algunos componentes frontend necesitan conexión backend

## 🔜 Próximos Pasos

### **Prioridad 1: Desarrollo Adicional**
1. **Completar sistema blog**: Finalizar funcionalidad pendiente
2. **Testing integral**: Implementar cobertura de pruebas
3. **Optimización**: Mejorar rendimiento y cache
4. **Documentación usuario**: Guías de uso

### **Prioridad 2: Funcionalidades Avanzadas**
5. **Multimedia extendida**: Integrar cleanup con blog, biblioteca, perfiles
6. **Sistema offline**: Optimizar para uso sin internet
7. **Red mesh**: Preparar para networking local
8. **Monitoring**: Dashboard de uso y rendimiento

## 🤝 Contribuir al Proyecto

El proyecto está en desarrollo activo. Para contribuir:

1. Fork del repositorio
2. Crear branch para tu feature
3. Desarrollar y probar cambios
4. Pull request con descripción detallada

## 🎥 Sistema de Multimedia Contextual

### ✅ **Estado Actual: IMPLEMENTADO**

Sistema completo de gestión multimedia con limpieza automática de archivos. **No existen archivos independientes** - todo multimedia pertenece a contenido específico.

### 🏗️ **Arquitectura Multimedia**

```
Data/media/                  # Directorio base de multimedia
├── image/                   # Imágenes (JPG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF)
├── video/                   # Videos (MP4, AVI, MOV, WebM)
├── audio/                   # Audio (MP3, WAV, OGG, M4A)
├── document/                # Documentos (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT)
└── temp/uploads/            # Temporales para nginx
    ├── images/
    ├── videos/
    ├── audio/
    └── documents/
```

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
- Archivos en: `Data/media/{type}/filename`
- Servidos vía: `GET /media/{type}/filename`
- Upload directo a SvelteKit

#### **Producción (con nginx)**
- Nginx intercepta uploads grandes → `/upload/{type}/`
- Guarda temporalmente → notifica a API
- API mueve a ubicación final → actualiza BD
- Nginx sirve archivos directamente desde disco

### ⚠️ **EXTENSIÓN REQUERIDA - OTROS COMPONENTES**

El sistema actual **solo cubre posts de módulos educativos**. Se debe extender a:

#### **📝 Sistema Blog**
```typescript
// TODO: Integrar limpieza con blog posts
// Archivos: Featured images, multimedia en contenido
// Endpoints: /api/blog/upload/, cleanup al eliminar posts
```

#### **📚 Biblioteca/Library**
```typescript
// TODO: Integrar limpieza con recursos de biblioteca
// Archivos: PDFs, documentos, imágenes de portada
// Endpoints: /api/library/upload/, cleanup al eliminar recursos
```

#### **👤 Perfiles de Usuario**
```typescript
// TODO: Integrar limpieza con avatars/fotos de perfil
// Archivos: Imágenes de perfil
// Endpoints: /api/users/avatar/, cleanup al cambiar/eliminar
```

#### **🎨 Contenido General/CMS**
```typescript
// TODO: Integrar limpieza con páginas estáticas
// Archivos: Imágenes de hero, banners, galerias
// Endpoints: /api/cms/upload/, cleanup al actualizar contenido
```

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

- [ ] **Blog System**: Integrar limpieza con posts de blog
- [ ] **Library System**: Integrar limpieza con recursos biblioteca
- [ ] **User Profiles**: Integrar limpieza con avatars/fotos perfil
- [ ] **CMS Content**: Integrar limpieza con páginas estáticas
- [ ] **Scheduled Cleanup**: Tarea automática diaria/semanal
- [ ] **Storage Analytics**: Dashboard de uso de espacio
- [ ] **Backup Integration**: Respaldar antes de limpiar

### 🚨 **Importante para Desarrolladores**

**Al implementar CUALQUIER funcionalidad que maneje archivos:**

1. **Usar endpoints específicos**: `/api/upload/{type}/`
2. **Integrar limpieza**: Importar y usar `mediaCleanup.ts`
3. **Actualizar cleanup**: Agregar tablas al endpoint `/api/cleanup`
4. **Documentar aquí**: Actualizar esta sección del README

**Nunca crear sistemas de upload independientes** - siempre extender el sistema existente.

## 📞 Contacto

Proyecto desarrollado para el Centro Cultural Víctor Jara - Bogotá, Colombia.

---

**⚠️ Advertencia**: El proyecto NO está listo para producción. Se requiere desarrollo adicional significativo.