# BlogEventRelation - Componente Simplificado

## Descripción

Componente simplificado para relacionar posts de blog con eventos del calendario. Reemplaza los componentes anteriores (`BlogEventRelationManager`, `BlogEventRelationSelector`, `BlogEventRelationStats`) con una interfaz más intuitiva y fácil de usar.

## Características

- ✅ **Interfaz Simple**: Un solo componente para gestionar todas las relaciones
- ✅ **Búsqueda Intuitiva**: Busca eventos por título en tiempo real
- ✅ **Selección Múltiple**: Relaciona un post con varios eventos a la vez
- ✅ **Feedback Visual**: Muestra claramente qué eventos están seleccionados
- ✅ **Auto-completado**: Dropdown con sugerencias mientras escribes

## Uso Básico

### En el Editor de Blog

```svelte
<script>
import BlogEventRelation from '$lib/components/blog/BlogEventRelation.svelte';

let selectedEventIds = [];

function handleEventChange(eventIds) {
    selectedEventIds = eventIds;
    // Guardar en base de datos...
}
</script>

<BlogEventRelation
    blogPostId={post?.id}
    onChange={handleEventChange}
/>
```

### Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `blogPostId` | `string \| undefined` | No | `undefined` | ID del post de blog actual |
| `compact` | `boolean` | No | `false` | Modo compacto (menos padding) |
| `onChange` | `(eventIds: string[]) => void` | No | `undefined` | Callback cuando cambian los eventos seleccionados |

### Ejemplo Completo

```svelte
<script lang="ts">
import BlogEventRelation from '$lib/components/blog/BlogEventRelation.svelte';
import type { BlogPost } from '$lib/types';

let post: BlogPost;
let selectedEventIds: string[] = [];

// Al guardar el post, usar selectedEventIds para crear las relaciones
async function savePost() {
    // 1. Guardar el post
    const savedPost = await blogService.createPost(post);

    // 2. Crear relaciones con eventos
    for (const eventId of selectedEventIds) {
        await blogEventRelationService.createRelation({
            blogPostId: savedPost.id,
            eventId,
            relationType: 'Related',
            isActive: true,
            displayOrder: 0
        });
    }
}
</script>

<form on:submit|preventDefault={savePost}>
    <input bind:value={post.title} placeholder="Título" />
    <textarea bind:value={post.content} placeholder="Contenido"></textarea>

    <div class="events-section">
        <h3>Eventos Relacionados</h3>
        <BlogEventRelation
            blogPostId={post?.id}
            onChange={(ids) => selectedEventIds = ids}
        />
    </div>

    <button type="submit">Guardar Post</button>
</form>
```

## Migración desde Componentes Anteriores

### Antes (Complejo)

```svelte
<BlogEventRelationManager
    mode="blog-to-events"
    blogPostId={post.id}
/>

<BlogEventRelationSelector
    mode="blog-to-events"
    blogPostId={post.id}
    on:relationAdded={handleRelationAdded}
    on:relationRemoved={handleRelationRemoved}
/>
```

### Después (Simple)

```svelte
<BlogEventRelation
    blogPostId={post.id}
    onChange={(eventIds) => {
        // Toda la lógica aquí
    }}
/>
```

## Arquitectura

### Flujo de Datos

1. El componente carga todos los eventos disponibles desde `calendarService`
2. El usuario escribe en la búsqueda para filtrar eventos
3. Al hacer clic en un evento, se agrega/quita de la selección
4. Los cambios se emiten mediante el callback `onChange`
5. El padre del componente guarda las relaciones en la base de datos

### Sin Backend de Relaciones (Simplificado)

Este componente **NO** gestiona las relaciones en la base de datos automáticamente. Solo maneja la UI de selección. El padre es responsable de:

1. Cargar relaciones existentes al montar el componente
2. Guardar nuevas relaciones cuando cambia la selección
3. Eliminar relaciones cuando se deseleccionan eventos

### Ejemplo con Persistencia

```svelte
<script>
import { onMount } from 'svelte';
import BlogEventRelation from '$lib/components/blog/BlogEventRelation.svelte';
import { blogEventRelationService } from '$lib/services/blogEventRelationService';

let selectedEventIds = [];

// Cargar relaciones existentes
onMount(async () => {
    if (post?.id) {
        const relations = await blogEventRelationService.getRelationsByBlogPost(post.id);
        selectedEventIds = relations.map(r => r.eventId);
    }
});

// Sincronizar cambios
async function handleEventChange(newEventIds) {
    const added = newEventIds.filter(id => !selectedEventIds.includes(id));
    const removed = selectedEventIds.filter(id => !newEventIds.includes(id));

    // Agregar nuevas relaciones
    for (const eventId of added) {
        await blogEventRelationService.createRelation({
            blogPostId: post.id,
            eventId,
            relationType: 'Related',
            isActive: true,
            displayOrder: 0
        });
    }

    // Eliminar relaciones removidas
    for (const eventId of removed) {
        const relation = await findRelation(post.id, eventId);
        if (relation) {
            await blogEventRelationService.deleteRelation(relation.id);
        }
    }

    selectedEventIds = newEventIds;
}
</script>

<BlogEventRelation
    blogPostId={post?.id}
    onChange={handleEventChange}
/>
```

## Características Técnicas

- **TypeScript**: Totalmente tipado
- **Reactivo**: Usa stores de Svelte para reactividad
- **Performante**: Filtra solo los primeros 10 resultados
- **Accesible**: Semántica HTML correcta
- **Responsive**: Se adapta a móviles

## Estados

- **Loading**: Muestra spinner mientras carga eventos
- **Empty**: Mensaje cuando no hay eventos disponibles
- **Dropdown Open**: Muestra lista filtrada al escribir
- **Selected**: Muestra tarjetas de eventos seleccionados

## Estilos

Los estilos están completamente encapsulados en el componente. Variables CSS personalizables:

```css
.blog-event-relation {
    /* Personalizar padding, colores, etc. */
}
```

## Notas de Implementación

### Por Qué Eliminamos `relatedBlogPostId`

El campo `relatedBlogPostId` en la tabla `Event` era una relación 1-a-1, pero necesitamos relaciones N-a-N (muchos posts pueden relacionarse con muchos eventos). Por eso ahora usamos la tabla `blog_post_event` como tabla intermedia.

### Ventajas del Nuevo Enfoque

1. **Más flexible**: Múltiples relaciones en lugar de una sola
2. **Bidireccional**: Puedes ver eventos desde posts Y posts desde eventos
3. **Tipado de relación**: Diferentes tipos (Related, Featured, etc.)
4. **Metadatos**: Descripción, orden de visualización, etc.
5. **Más simple**: Un componente en lugar de tres

## Troubleshooting

### Los eventos no se cargan

Verifica que el servicio de calendario esté funcionando:

```javascript
import { calendarService } from '$lib/services/calendar/calendarService';

const events = await calendarService.getUpcomingEvents(50);
console.log(events); // Debe mostrar array de eventos
```

### onChange no se dispara

Asegúrate de pasar una función:

```svelte
<BlogEventRelation
    onChange={(ids) => console.log('Changed:', ids)}
/>
```

### Los IDs son Guid en lugar de string

El backend devuelve GUIDs que se convierten automáticamente a string en el servicio. Si ves errores de tipo, verifica la conversión en `calendarService.ts`.

## Compatibilidad

- ✅ SvelteKit 2.x
- ✅ TypeScript 5.x
- ✅ Tailwind CSS (opcional, no requerido)
- ✅ Chrome, Firefox, Safari, Edge

## Contribuir

Para mejorar este componente:

1. Mantén la simplicidad
2. No agregues dependencias externas
3. Documenta cambios en este README
4. Escribe tests si es posible
