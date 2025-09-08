# 📁 Guía de Multimedia Contextual - Centro Cultural Víctor Jara

## 🎯 Arquitectura Contextual

### Principio Fundamental
**La multimedia NO es independiente** - siempre pertenece a contenido específico:
- **Cursos** → **Módulos** → **WorkItems** (con imágenes y videos contextuales)
- **Blog Posts** (con imágenes destacadas, PDFs, videos)
- **Eventos** (con imágenes/posters promocionales)

## 📚 Sistema Educativo Contextual

### Flujo: Course → Module → WorkItem

#### 1. **Course** (Nivel Superior)
```sql
-- Materias disponibles: Matemáticas, Física, Sociales, Economía
INSERT INTO Course (Id, Title, Description, Subject, EducatorId, ImagePath) 
VALUES ('math-001', 'Álgebra Básica', 'Introducción al álgebra', 'Matemáticas', 'educator123', '/media/courses/algebra-banner.jpg');
```

#### 2. **Module** (Lecciones del Curso)
```sql
INSERT INTO Module (Id, Title, Description, CourseId, OrderNumber) 
VALUES ('mod-001', 'Ecuaciones Lineales', 'Resolver ecuaciones de primer grado', 'math-001', 1);
```

#### 3. **WorkItem** (Elementos de Trabajo con Multimedia)
```sql
-- WorkItem con multimedia contextual
INSERT INTO WorkItem (Id, Title, Description, LongText, ModuleId, OrderNumber, ImagePath, VideoPath) 
VALUES (
    'work-001', 
    'Sistemas 2x2',
    'Resolver sistemas de ecuaciones',
    'Instrucciones detalladas: 1. Identificar variables, 2. Aplicar método de sustitución...',
    'mod-001', 
    1,
    '/media/workitems/sistemas-diagram.png',    -- Diagrama explicativo
    '/media/workitems/sistemas-tutorial.mp4'   -- Video tutorial
);
```

### Multimedia por WorkItem
- **Imagen**: Diagrama, ilustración, esquema del concepto
- **Video**: Tutorial paso a paso, explicación visual
- **Contexto**: Específico para ese work item únicamente

## 📝 Sistema de Blog Contextual

### Blog Post con Multimedia Específica

```sql
-- Post de blog con multimedia contextual
INSERT INTO BlogPost (Id, Title, Content, AuthorId, CategoryId, FeaturedImagePath, PdfPath, VideoPath)
VALUES (
    'blog-001',
    'Nuevo Taller de Pintura',
    'Contenido completo del artículo sobre el taller...',
    'author123',
    'cat_talleres',
    '/media/blog/pintura-featured.jpg',      -- Imagen destacada del artículo
    '/media/blog/programa-pintura.pdf',      -- PDF con programa del taller  
    '/media/blog/demo-tecnicas.mp4'          -- Video demostrativo
);
```

### Multimedia por Blog Post
- **Featured Image**: Imagen principal del artículo
- **PDF**: Documentos descargables (programas, guías)
- **Video**: Contenido visual embebido
- **Contexto**: Específico para ese artículo únicamente

## 📅 Sistema de Eventos Contextual

### Evento con Imagen Promocional

```sql
-- Evento con imagen contextual
INSERT INTO Event (Id, Title, Description, StartDateTime, EndDateTime, OrganizerId, ImagePath)
VALUES (
    'event-001',
    'Concierto de Jazz',
    'Noche especial de jazz en vivo',
    strftime('%s', 'now', '+7 days'),
    strftime('%s', 'now', '+7 days', '+3 hours'),
    'organizer123',
    '/media/events/jazz-poster.jpg'          -- Poster promocional del evento
);
```

### Multimedia por Evento
- **Imagen**: Poster, imagen promocional
- **Contexto**: Específico para ese evento únicamente

## 🗂️ Estructura de Directorios

```
/home/user/ccpvj/Data/media/
├── courses/           # Banners/imágenes de cursos
│   ├── algebra-banner.jpg
│   └── fisica-intro.jpg
├── workitems/         # Multimedia de work items
│   ├── sistemas-diagram.png
│   ├── sistemas-tutorial.mp4
│   └── velocidad-example.gif
├── blog/              # Multimedia de blog posts
│   ├── pintura-featured.jpg
│   ├── programa-pintura.pdf
│   └── demo-tecnicas.mp4
├── events/            # Imágenes de eventos
│   ├── jazz-poster.jpg
│   └── teatro-banner.png
└── temp/              # Uploads temporales
    ├── courses/
    ├── workitems/
    ├── blog/
    └── events/
```

## 📊 Tracking de Multimedia Contextual

### Tabla MediaFile (Rastreo de Archivos)

```sql
-- Cada archivo multimedia DEBE tener contexto
INSERT INTO MediaFile (FileName, RelativePath, FileSize, MimeType, UploadedBy, ContentType, ContentId, MediaType)
VALUES (
    'sistemas-diagram.png',
    '/media/workitems/sistemas-diagram.png',
    256000,
    'image/png',
    'educator123',
    'workitem',        -- CONTEXTO: pertenece a un work item
    'work-001',        -- ID del work item específico
    'image'            -- TIPO: imagen
);
```

### Estados de Context Types
- `workitem` → Multimedia de work items educativos
- `course` → Banners/imágenes de cursos
- `blog` → Multimedia de artículos de blog
- `event` → Imágenes promocionales de eventos

## 🔄 Flujos de Upload Contextual

### 1. Upload para WorkItem

```javascript
// Frontend: Upload contextual para work item
const uploadWorkItemMedia = async (workItemId, file, mediaType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentType', 'workitem');
    formData.append('contentId', workItemId);
    formData.append('mediaType', mediaType);
    
    const response = await fetch('/api/upload/contextual', {
        method: 'POST',
        body: formData
    });
    
    return response.json();
};
```

### 2. Upload para Blog Post

```javascript
// Frontend: Upload contextual para blog
const uploadBlogMedia = async (blogPostId, file, mediaType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentType', 'blog');
    formData.append('contentId', blogPostId);
    formData.append('mediaType', mediaType);
    
    const response = await fetch('/api/upload/contextual', {
        method: 'POST',
        body: formData
    });
    
    return response.json();
};
```

## 📈 Consultas Contextuales

### Obtener WorkItems con su Multimedia

```sql
-- Consulta: WorkItems de un curso con su multimedia
SELECT 
    wi.Id,
    wi.Title,
    wi.Description,
    wi.LongText,
    wi.ImagePath,
    wi.VideoPath,
    m.Title as ModuleName,
    c.Title as CourseName,
    c.Subject,
    GROUP_CONCAT(mf.RelativePath) as MediaFiles,
    GROUP_CONCAT(mf.MediaType) as MediaTypes
FROM WorkItem wi
JOIN Module m ON wi.ModuleId = m.Id
JOIN Course c ON m.CourseId = c.Id
LEFT JOIN MediaFile mf ON mf.ContentType = 'workitem' AND mf.ContentId = wi.Id
WHERE c.Id = 'math-001'
GROUP BY wi.Id
ORDER BY m.OrderNumber, wi.OrderNumber;
```

### Obtener Blog Posts con Multimedia

```sql
-- Consulta: Posts con su multimedia contextual
SELECT 
    bp.Id,
    bp.Title,
    bp.FeaturedImagePath,
    bp.PdfPath,
    bp.VideoPath,
    COUNT(mf.Id) as MediaFileCount
FROM BlogPost bp
LEFT JOIN MediaFile mf ON mf.ContentType = 'blog' AND mf.ContentId = bp.Id
WHERE bp.IsPublished = 1
GROUP BY bp.Id
ORDER BY bp.PublishedAt DESC;
```

## 🚫 Restricciones Importantes

### NO Permitido
- ❌ Upload multimedia sin contexto específico
- ❌ Galería general de imágenes independientes
- ❌ Videos sin relación a contenido específico
- ❌ Archivos "huérfanos" sin padre contextual

### SÍ Permitido
- ✅ Imagen específica para un work item
- ✅ Video tutorial para una lección específica
- ✅ PDF descargable para un artículo específico
- ✅ Poster para un evento específico

## 🔧 Integración con NGINX

### Rutas Contextuales de Upload

```nginx
# Upload contextual para work items
location /upload/workitems {
    client_body_temp_path /home/user/ccpvj/Data/media/temp/uploads/workitems;
    proxy_pass http://127.0.0.1:5173/api/upload/workitems;
    # Headers para contexto
    proxy_set_header X-Content-Type "workitem";
}

# Upload contextual para blog
location /upload/blog {
    client_body_temp_path /home/user/ccpvj/Data/media/temp/uploads/blog;
    proxy_pass http://127.0.0.1:5173/api/upload/blog;
    proxy_set_header X-Content-Type "blog";
}

# Upload contextual para eventos
location /upload/events {
    client_body_temp_path /home/user/ccpvj/Data/media/temp/uploads/events;
    proxy_pass http://127.0.0.1:5173/api/upload/events;
    proxy_set_header X-Content-Type "event";
}
```

## 🎯 Beneficios de la Arquitectura Contextual

### 1. **Organización Lógica**
- Multimedia siempre tiene propósito específico
- Fácil localización de archivos por contexto
- Limpieza automática cuando se elimina contenido

### 2. **Optimización de Recursos**
- No hay archivos sin uso (huérfanos)
- Upload eficiente según el tipo de contenido
- Gestión de espacio más efectiva

### 3. **Experiencia de Usuario**
- Multimedia relevante al contenido específico
- Navegación intuitiva por contexto
- Carga optimizada según necesidades

### 4. **Mantenimiento**
- Limpieza automática de archivos relacionados
- Backup contextual por tipo de contenido
- Auditoría clara de uso de multimedia

## 🚀 Implementación Paso a Paso

1. **Inicializar Base de Datos Contextual**
   ```bash
   ./init_contextual_database.sh
   ```

2. **Actualizar Schema Frontend**
   ```bash
   cp schema-contextual.ts schema.ts
   npm run db:push
   ```

3. **Implementar APIs de Upload Contextual**
   - `/api/upload/workitems`
   - `/api/upload/blog`
   - `/api/upload/events`

4. **Actualizar NGINX para Rutas Contextuales**
   - Modificar configuración de upload
   - Añadir rutas específicas por contexto

¡Con esta arquitectura contextual, cada archivo multimedia tiene un propósito específico y pertenece siempre a contenido concreto! 🎉