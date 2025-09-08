# 📚 WorkItems - Documentación Técnica Completa

## 🎯 Descripción General

Los **WorkItems** son la entidad central del sistema educativo del Centro Cultural Víctor Jara. Representan elementos de trabajo específicos dentro de cada módulo de un curso, diseñados para contener contenido multimedia contextual (imágenes y videos) que complementan el material educativo.

## 📋 Características Principales

### 🏗️ Arquitectura Contextual
- **NUNCA independientes**: Siempre pertenecen a un Module específico
- **Multimedia contextual**: Cada WorkItem puede tener imagen y video específicos
- **Jerarquía**: Course → Module → WorkItem → Media Files
- **Orden secuencial**: OrderNumber para secuencia pedagógica

### 📊 Estructura de Datos

```sql
CREATE TABLE WorkItem (
    Id TEXT PRIMARY KEY,              -- GUID único
    Title TEXT NOT NULL,              -- Título del elemento de trabajo
    Description TEXT,                 -- Descripción breve
    LongText TEXT,                   -- Contenido detallado/instrucciones
    OrderNumber INTEGER DEFAULT 0,   -- Orden secuencial en el módulo
    IsActive INTEGER DEFAULT 1,      -- Estado activo/inactivo
    CreatedAt INTEGER NOT NULL,      -- Timestamp de creación
    UpdatedAt INTEGER,               -- Timestamp de actualización
    ModuleId TEXT NOT NULL,          -- FK al módulo padre
    
    -- Multimedia contextual específico
    ImagePath TEXT,                  -- Ilustración/diagrama del trabajo
    VideoPath TEXT,                  -- Video instructivo
    
    FOREIGN KEY (ModuleId) REFERENCES Module(Id) ON DELETE CASCADE
);
```

## 🎓 Contexto Educativo

### Materias Soportadas
- **Matemáticas**: Diagramas, gráficos, demostraciones paso a paso
- **Física**: Experimentos, simulaciones, ilustraciones de conceptos
- **Sociales**: Mapas, líneas de tiempo, documentos históricos
- **Economía**: Gráficos económicos, casos de estudio, análisis

### Ejemplos de WorkItems por Materia

#### Matemáticas
```
Curso: "Álgebra Básica"
  └── Module: "Ecuaciones Lineales"
      ├── WorkItem 1: "Conceptos Básicos"
      │   ├── ImagePath: "/media/workitems/algebra-conceptos.png"
      │   └── VideoPath: "/media/workitems/intro-ecuaciones.mp4"
      │
      ├── WorkItem 2: "Resolución Paso a Paso"
      │   ├── ImagePath: "/media/workitems/pasos-resolucion.png"
      │   └── VideoPath: "/media/workitems/demo-resolucion.mp4"
      │
      └── WorkItem 3: "Ejercicios Prácticos"
          ├── ImagePath: "/media/workitems/ejercicios-practica.png"
          └── VideoPath: "/media/workitems/solucion-ejercicios.mp4"
```

#### Física
```
Curso: "Mecánica Clásica"
  └── Module: "Leyes de Newton"
      ├── WorkItem 1: "Primera Ley - Inercia"
      │   ├── ImagePath: "/media/workitems/inercia-diagrama.png"
      │   └── VideoPath: "/media/workitems/experimento-inercia.mp4"
      │
      └── WorkItem 2: "Segunda Ley - F=ma"
          ├── ImagePath: "/media/workitems/fuerza-masa-aceleracion.png"
          └── VideoPath: "/media/workitems/calculo-fuerza.mp4"
```

## 🔧 Implementación Técnica

### Schema TypeScript (Drizzle)
```typescript
export const workItem = sqliteTable('WorkItem', {
  id: text('Id').primaryKey(),
  title: text('Title').notNull(),
  description: text('Description'),
  longText: text('LongText'), // Contenido detallado/instrucciones
  orderNumber: integer('OrderNumber').notNull().default(0),
  isActive: integer('IsActive', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('CreatedAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('UpdatedAt', { mode: 'timestamp' }),
  moduleId: text('ModuleId').notNull().references(() => module.id, { onDelete: 'cascade' }),
  
  // Multimedia contextual específico del WorkItem
  imagePath: text('ImagePath'), // Ilustración/diagrama del trabajo
  videoPath: text('VideoPath')  // Video instructivo
});

export const workItemRelations = relations(workItem, ({ one, many }) => ({
  module: one(module, {
    fields: [workItem.moduleId],
    references: [module.id]
  }),
  mediaFiles: many(mediaFile), // Archivos multimedia adicionales
}));
```

### API Endpoints Sugeridos

#### GET /api/workitems/[moduleId]
```typescript
// Obtener WorkItems de un módulo específico
export const GET: RequestHandler = async ({ params }) => {
  const { moduleId } = params;
  
  const workItems = await db.select()
    .from(workItem)
    .where(and(
      eq(workItem.moduleId, moduleId),
      eq(workItem.isActive, true)
    ))
    .orderBy(workItem.orderNumber);
    
  return json(workItems);
};
```

#### POST /api/workitems
```typescript
// Crear nuevo WorkItem
export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  
  const newWorkItem = await db.insert(workItem).values({
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    longText: data.longText,
    moduleId: data.moduleId,
    orderNumber: data.orderNumber || 0,
    imagePath: data.imagePath,
    videoPath: data.videoPath,
    createdAt: new Date(),
  }).returning();
  
  return json(newWorkItem[0]);
};
```

#### PUT /api/workitems/[id]
```typescript
// Actualizar WorkItem existente
export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const data = await request.json();
  
  const updatedWorkItem = await db.update(workItem)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(workItem.id, id))
    .returning();
    
  return json(updatedWorkItem[0]);
};
```

## 📁 Gestión de Multimedia

### Estructura de Directorios
```
/home/user/ccpvj/Data/media/workitems/
├── [course-subject]/
│   ├── [course-id]/
│   │   ├── [module-id]/
│   │   │   ├── [workitem-id]_image.png
│   │   │   ├── [workitem-id]_video.mp4
│   │   │   └── [workitem-id]_diagram.svg
│   │   └── ...
│   └── ...
└── temp/uploads/workitems/  # Uploads temporales
```

### Ejemplo Práctico
```
/media/workitems/
├── matematicas/
│   ├── algebra-basica-001/
│   │   ├── ecuaciones-lineales-001/
│   │   │   ├── conceptos_image.png
│   │   │   ├── conceptos_video.mp4
│   │   │   ├── resolucion_image.png
│   │   │   └── resolucion_video.mp4
│   │   └── ecuaciones-cuadraticas-002/
│   │       ├── formula_image.png
│   │       └── ejemplos_video.mp4
│   └── ...
└── fisica/
    ├── mecanica-001/
    │   ├── newton-leyes-001/
    │   │   ├── inercia_diagram.png
    │   │   ├── inercia_experiment.mp4
    │   │   ├── fuerza_diagram.png
    │   │   └── fuerza_demo.mp4
    │   └── ...
    └── ...
```

## 🎨 Componentes Frontend

### WorkItemCard.svelte
```svelte
<script lang="ts">
  export let workItem: {
    id: string;
    title: string;
    description: string;
    imagePath?: string;
    videoPath?: string;
    orderNumber: number;
  };
  
  export let moduleId: string;
</script>

<div class="work-item-card" data-order={workItem.orderNumber}>
  <div class="header">
    <span class="order-number">{workItem.orderNumber}</span>
    <h3>{workItem.title}</h3>
  </div>
  
  {#if workItem.description}
    <p class="description">{workItem.description}</p>
  {/if}
  
  <div class="media-section">
    {#if workItem.imagePath}
      <div class="image-container">
        <img src={workItem.imagePath} alt={workItem.title} loading="lazy" />
        <span class="media-label">Ilustración</span>
      </div>
    {/if}
    
    {#if workItem.videoPath}
      <div class="video-container">
        <video controls preload="metadata">
          <source src={workItem.videoPath} type="video/mp4" />
          Tu navegador no soporta videos.
        </video>
        <span class="media-label">Video Instructivo</span>
      </div>
    {/if}
  </div>
  
  <div class="actions">
    <button class="btn-edit" on:click={() => editWorkItem(workItem.id)}>
      Editar
    </button>
    <button class="btn-view" on:click={() => viewWorkItem(workItem.id)}>
      Ver Detalles
    </button>
  </div>
</div>

<style>
  .work-item-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s;
  }
  
  .work-item-card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .order-number {
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: bold;
  }
  
  .media-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .image-container, .video-container {
    position: relative;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .image-container img {
    width: 100%;
    height: auto;
    max-height: 200px;
    object-fit: cover;
  }
  
  .video-container video {
    width: 100%;
    height: auto;
    max-height: 200px;
  }
  
  .media-label {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.75rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
  
  .btn-edit, .btn-view {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.2s;
  }
  
  .btn-edit {
    background: #f59e0b;
    color: white;
  }
  
  .btn-edit:hover {
    background: #d97706;
  }
  
  .btn-view {
    background: #6b7280;
    color: white;
  }
  
  .btn-view:hover {
    background: #4b5563;
  }
</style>
```

### WorkItemEditor.svelte
```svelte
<script lang="ts">
  export let workItem: any = null; // null para nuevo, objeto para editar
  export let moduleId: string;
  export let onSave: (workItem: any) => void;
  export let onCancel: () => void;
  
  let title = workItem?.title || '';
  let description = workItem?.description || '';
  let longText = workItem?.longText || '';
  let orderNumber = workItem?.orderNumber || 1;
  
  let imageFile: File | null = null;
  let videoFile: File | null = null;
  let uploading = false;
  
  const handleSave = async () => {
    if (!title.trim()) {
      alert('El título es obligatorio');
      return;
    }
    
    uploading = true;
    
    try {
      // Crear o actualizar WorkItem
      const workItemData = {
        title: title.trim(),
        description: description.trim(),
        longText: longText.trim(),
        orderNumber,
        moduleId
      };
      
      let savedWorkItem;
      if (workItem?.id) {
        // Actualizar existente
        const response = await fetch(`/api/workitems/${workItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workItemData)
        });
        savedWorkItem = await response.json();
      } else {
        // Crear nuevo
        const response = await fetch('/api/workitems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workItemData)
        });
        savedWorkItem = await response.json();
      }
      
      // Subir archivos multimedia si existen
      if (imageFile) {
        await uploadMedia(savedWorkItem.id, imageFile, 'image');
      }
      
      if (videoFile) {
        await uploadMedia(savedWorkItem.id, videoFile, 'video');
      }
      
      onSave(savedWorkItem);
      
    } catch (error) {
      console.error('Error saving WorkItem:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      uploading = false;
    }
  };
  
  const uploadMedia = async (workItemId: string, file: File, mediaType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentType', 'workitem');
    formData.append('contentId', workItemId);
    formData.append('mediaType', mediaType);
    
    const response = await fetch('/api/upload/workitems', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error uploading ${mediaType}`);
    }
  };
</script>

<div class="work-item-editor">
  <h2>{workItem ? 'Editar' : 'Crear'} Elemento de Trabajo</h2>
  
  <form on:submit|preventDefault={handleSave}>
    <div class="form-group">
      <label for="title">Título *</label>
      <input
        type="text"
        id="title"
        bind:value={title}
        placeholder="Ej: Conceptos Básicos de Ecuaciones"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="description">Descripción</label>
      <textarea
        id="description"
        bind:value={description}
        placeholder="Descripción breve del elemento de trabajo"
        rows="3"
      ></textarea>
    </div>
    
    <div class="form-group">
      <label for="longText">Contenido Detallado</label>
      <textarea
        id="longText"
        bind:value={longText}
        placeholder="Instrucciones detalladas, explicaciones, pasos a seguir..."
        rows="8"
      ></textarea>
    </div>
    
    <div class="form-group">
      <label for="orderNumber">Número de Orden</label>
      <input
        type="number"
        id="orderNumber"
        bind:value={orderNumber}
        min="1"
      />
    </div>
    
    <div class="media-uploads">
      <h3>Multimedia Contextual</h3>
      
      <div class="form-group">
        <label for="imageFile">Imagen/Diagrama</label>
        <input
          type="file"
          id="imageFile"
          accept="image/*"
          on:change={(e) => imageFile = e.target.files[0]}
        />
        {#if workItem?.imagePath}
          <div class="current-media">
            <img src={workItem.imagePath} alt="Imagen actual" />
            <span>Imagen actual</span>
          </div>
        {/if}
      </div>
      
      <div class="form-group">
        <label for="videoFile">Video Instructivo</label>
        <input
          type="file"
          id="videoFile"
          accept="video/*"
          on:change={(e) => videoFile = e.target.files[0]}
        />
        {#if workItem?.videoPath}
          <div class="current-media">
            <video controls>
              <source src={workItem.videoPath} type="video/mp4" />
            </video>
            <span>Video actual</span>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="form-actions">
      <button type="button" on:click={onCancel} disabled={uploading}>
        Cancelar
      </button>
      <button type="submit" disabled={uploading || !title.trim()}>
        {uploading ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  </form>
</div>

<style>
  .work-item-editor {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-group textarea {
    resize: vertical;
    font-family: inherit;
  }
  
  .media-uploads {
    border-top: 1px solid #e5e7eb;
    padding-top: 1.5rem;
    margin-top: 1.5rem;
  }
  
  .media-uploads h3 {
    margin-bottom: 1rem;
    color: #374151;
  }
  
  .current-media {
    margin-top: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    background: #f9fafb;
  }
  
  .current-media img,
  .current-media video {
    max-width: 200px;
    max-height: 100px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  .current-media span {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .form-actions button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }
  
  .form-actions button[type="button"] {
    background: #6b7280;
    color: white;
  }
  
  .form-actions button[type="button"]:hover {
    background: #4b5563;
  }
  
  .form-actions button[type="submit"] {
    background: #3b82f6;
    color: white;
  }
  
  .form-actions button[type="submit"]:hover {
    background: #2563eb;
  }
  
  .form-actions button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
```

## 📋 Vista Contextual (SQL)

### WorkItemWithMedia View
```sql
CREATE VIEW WorkItemWithMedia AS
SELECT 
    wi.Id,
    wi.Title,
    wi.Description,
    wi.LongText,
    wi.ImagePath,
    wi.VideoPath,
    wi.OrderNumber,
    m.Title as ModuleName,
    c.Title as CourseName,
    c.Subject,
    (SELECT COUNT(*) FROM MediaFile 
     WHERE ContentType = 'workitem' AND ContentId = wi.Id) as MediaFileCount,
    u.nombre as EducatorName
FROM WorkItem wi
JOIN Module m ON wi.ModuleId = m.Id
JOIN Course c ON m.CourseId = c.Id
JOIN user u ON c.EducatorId = u.id
WHERE wi.IsActive = 1 AND m.IsActive = 1 AND c.IsActive = 1
ORDER BY c.Title, m.OrderNumber, wi.OrderNumber;
```

## 🧪 Testing y Validación

### Casos de Prueba

#### Test 1: Creación de WorkItem
```javascript
describe('WorkItem Creation', () => {
  test('should create workitem with contextual multimedia', async () => {
    const workItemData = {
      title: 'Conceptos de Álgebra',
      description: 'Introducción a ecuaciones básicas',
      moduleId: 'module-001',
      orderNumber: 1
    };
    
    const response = await fetch('/api/workitems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workItemData)
    });
    
    const result = await response.json();
    
    expect(result.title).toBe(workItemData.title);
    expect(result.moduleId).toBe(workItemData.moduleId);
    expect(result.id).toBeDefined();
  });
});
```

#### Test 2: Upload Contextual
```javascript
describe('Contextual Media Upload', () => {
  test('should upload image to workitem context', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test image'], { type: 'image/png' }));
    formData.append('contentType', 'workitem');
    formData.append('contentId', 'workitem-001');
    formData.append('mediaType', 'image');
    
    const response = await fetch('/api/upload/workitems', {
      method: 'POST',
      body: formData
    });
    
    expect(response.ok).toBe(true);
    
    const result = await response.json();
    expect(result.contentType).toBe('workitem');
    expect(result.relativePath).toContain('workitems/');
  });
});
```

## 🚀 Implementación Paso a Paso

### 1. Actualizar Schema de Base de Datos
```bash
cd /home/user/ccpvj/Front/
# Ejecutar el script contextual
../init_contextual_database.sh
```

### 2. Generar Tipos TypeScript
```bash
npm run db:generate
npm run db:push
```

### 3. Crear APIs de WorkItems
```bash
mkdir -p src/routes/api/workitems
# Crear endpoints GET, POST, PUT, DELETE
```

### 4. Implementar Upload Contextual
```bash
mkdir -p src/routes/api/upload/workitems
# Crear endpoint de upload con validación contextual
```

### 5. Crear Componentes Frontend
```bash
mkdir -p src/lib/components/workitems
# Crear WorkItemCard, WorkItemEditor, WorkItemList
```

### 6. Testing
```bash
npm run test
# Ejecutar casos de prueba de WorkItems
```

## 🎯 Casos de Uso Principales

### Para Educadores
1. **Crear WorkItems secuenciales** en un módulo
2. **Subir multimedia contextual** (imagen + video por WorkItem)
3. **Organizar contenido** usando OrderNumber
4. **Reutilizar contenido** entre diferentes módulos

### Para Estudiantes
1. **Navegar WorkItems** en secuencia pedagógica
2. **Ver multimedia integrado** con el contenido
3. **Seguir progreso** dentro de cada módulo
4. **Acceder offline** a contenido descargado

### Para Administradores
1. **Monitorear contenido** multimedia por materia
2. **Gestionar almacenamiento** por contexto
3. **Generar reportes** de uso de WorkItems
4. **Mantener coherencia** en la organización

## 📊 Métricas y Monitoreo

### KPIs de WorkItems
- **Cantidad por módulo**: Promedio de WorkItems por módulo
- **Multimedia por WorkItem**: Porcentaje con imagen/video
- **Orden secuencial**: Continuidad en OrderNumber
- **Actividad estudiantil**: WorkItems más visitados

### Queries de Análisis
```sql
-- WorkItems por materia
SELECT 
    c.Subject,
    COUNT(wi.Id) as WorkItemCount,
    COUNT(wi.ImagePath) as WithImages,
    COUNT(wi.VideoPath) as WithVideos
FROM Course c
JOIN Module m ON c.Id = m.CourseId
JOIN WorkItem wi ON m.Id = wi.ModuleId
WHERE wi.IsActive = 1
GROUP BY c.Subject;

-- Completitud de multimedia
SELECT 
    (COUNT(ImagePath) * 100.0 / COUNT(*)) as ImagePercentage,
    (COUNT(VideoPath) * 100.0 / COUNT(*)) as VideoPercentage,
    (COUNT(CASE WHEN ImagePath IS NOT NULL AND VideoPath IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)) as CompleteMultimediaPercentage
FROM WorkItem 
WHERE IsActive = 1;
```

---

## 🎉 Conclusión

Los **WorkItems** son el núcleo de la experiencia educativa contextual del Centro Cultural Víctor Jara. Su implementación permite:

- ✅ **Contenido multimedia contextual** nunca huérfano
- ✅ **Organización pedagógica secuencial** 
- ✅ **Experiencia de aprendizaje rica** con videos e imágenes
- ✅ **Arquitectura escalable** para diferentes materias
- ✅ **Optimización para redes mesh** con gestión offline

La clave del éxito está en mantener **siempre** la contextualidad del multimedia, asegurando que cada imagen y video pertenezca específicamente a un WorkItem educativo.