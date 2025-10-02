# Plan de Implementación - Dashboard de Estadísticas

## 📊 Objetivo
Conectar el dashboard de estadísticas con datos reales del backend para mostrar:
- Número de visitantes únicos
- Total de descargas de archivos multimedia
- Cantidad de recursos disponibles
- Gráfico de visitantes por día (últimos 30 días)
- Top 5 recursos más descargados

---

## 🗄️ Fase 1: Preparación de Base de Datos

### 1.1 Crear tablas de seguimiento (analytics)

```sql
-- Tabla para trackear visitantes únicos
CREATE TABLE visitor_tracking (
    id TEXT PRIMARY KEY,
    ip_address TEXT,
    user_agent TEXT,
    visited_at INTEGER NOT NULL,
    user_id INTEGER, -- NULL para visitantes anónimos
    page_visited TEXT,
    session_id TEXT
);

-- Tabla para trackear descargas
CREATE TABLE download_tracking (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'library_item', 'blog_media', 'course_media'
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    downloaded_by INTEGER, -- user_id o NULL para anónimos
    downloaded_at INTEGER NOT NULL,
    ip_address TEXT,
    file_size INTEGER
);

-- Índices para performance
CREATE INDEX idx_visitor_tracking_date ON visitor_tracking(visited_at);
CREATE INDEX idx_visitor_tracking_ip ON visitor_tracking(ip_address);
CREATE INDEX idx_download_tracking_date ON download_tracking(downloaded_at);
CREATE INDEX idx_download_tracking_resource ON download_tracking(resource_id, resource_type);
```

### 1.2 Modificar tablas existentes (si es necesario)
- Agregar campos de tracking a `library_item`, `blog_post_element`, módulos de cursos
- Campos sugeridos: `view_count`, `download_count`, `last_accessed`

---

## 🎯 Fase 2: Backend - Endpoints de Analytics

### 2.1 Crear AnalyticsController.cs

**Ubicación**: `C:\ccpvj\Back\CentroCultural.Api\Controllers\AnalyticsController.cs`

**Endpoints a implementar**:

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "administrador")]
public class AnalyticsController : ControllerBase
{
    // GET /api/analytics/summary
    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetSummary()

    // GET /api/analytics/visitors?days=30
    [HttpGet("visitors")]
    public async Task<ActionResult<VisitorsChartDto>> GetVisitors([FromQuery] int days = 30)

    // GET /api/analytics/top-downloads?limit=5
    [HttpGet("top-downloads")]
    public async Task<ActionResult<TopResourcesDto>> GetTopDownloads([FromQuery] int limit = 5)
}
```

### 2.2 Crear DTOs

**Ubicación**: `C:\ccpvj\Back\CentroCultural.Application\DTOs\Analytics\`

```csharp
// AnalyticsSummaryDto.cs
public class AnalyticsSummaryDto
{
    public int TotalVisitors { get; set; }
    public int TotalDownloads { get; set; }
    public int TotalResources { get; set; }
}

// VisitorsChartDto.cs
public class VisitorsChartDto
{
    public List<DailyVisitorDto> Data { get; set; }
}

public class DailyVisitorDto
{
    public string Date { get; set; }
    public int Visitors { get; set; }
}

// TopResourcesDto.cs
public class TopResourcesDto
{
    public List<TopResourceDto> Resources { get; set; }
}

public class TopResourceDto
{
    public string Name { get; set; }
    public int Downloads { get; set; }
    public string Type { get; set; } // 'library', 'blog', 'course'
}
```

### 2.3 Implementar AnalyticsService

**Ubicación**: `C:\ccpvj\Back\CentroCultural.Application\Services\AnalyticsService.cs`

**Métodos principales**:
- `GetSummaryAsync()` - Conteos generales
- `GetVisitorsChartAsync(int days)` - Datos para gráfico
- `GetTopDownloadsAsync(int limit)` - Recursos más descargados

---

## 🔧 Fase 3: Middleware de Tracking

### 3.1 Crear VisitorTrackingMiddleware

**Ubicación**: `C:\ccpvj\Back\CentroCultural.API\Middleware\VisitorTrackingMiddleware.cs`

**Funcionalidad**:
- Detectar visitantes únicos por IP + User-Agent
- Registrar páginas visitadas
- Generar session_id para tracking
- Evitar contar bots/crawlers

### 3.2 Crear DownloadTrackingService

**Ubicación**: `C:\ccpvj\Back\CentroCultural.Application\Services\DownloadTrackingService.cs`

**Funcionalidad**:
- Método `TrackDownload(resourceId, resourceType, fileName, userId, ipAddress)`
- Llamar desde endpoints de descarga existentes

---

## 📥 Fase 4: Integrar Tracking en Endpoints Existentes

### 4.1 Endpoints de descarga a modificar:

**Library downloads**:
- Buscar endpoints que sirven archivos de `library_item`
- Agregar llamada a `DownloadTrackingService.TrackDownload()`

**Blog media downloads**:
- Endpoints que sirven archivos de `blog_post_element`
- Trackear descargas de imágenes, videos, documentos

**Course media downloads**:
- Endpoints de descarga de materiales de cursos
- Trackear archivos de `post_element` relacionados con cursos

### 4.2 Modificar controladores existentes:
- `LibraryController` - agregar tracking en métodos de descarga
- `BlogController` - trackear acceso a media
- `CourseController` - trackear descargas de materiales

---

## 🌐 Fase 5: Frontend - Conectar con Backend

### 5.1 Crear servicio de analytics

**Ubicación**: `C:\ccpvj\Front\src\lib\services\analytics\analyticsService.ts`

```typescript
export interface AnalyticsSummary {
  visitors: number;
  downloads: number;
  resources: number;
}

export interface VisitorsChart {
  date: string;
  visitors: number;
}

export interface TopResource {
  name: string;
  downloads: number;
  type: string;
}

class AnalyticsService {
  private baseURL = 'http://localhost:5251/api/analytics';

  async getSummary(): Promise<AnalyticsSummary>
  async getVisitorsChart(days: number = 30): Promise<VisitorsChart[]>
  async getTopDownloads(limit: number = 5): Promise<TopResource[]>
}
```

### 5.2 Actualizar componente analytics

**Ubicación**: `C:\ccpvj\Front\src\routes\admin\analytics\+page.svelte`

- Reemplazar datos simulados con llamadas al servicio
- Agregar manejo de errores
- Implementar refresh automático (opcional)

---

## 🧪 Fase 6: Testing y Validación

### 6.1 Crear datos de prueba
- Script para generar datos históricos de visitantes
- Datos de ejemplo para descargas
- Verificar conteos con queries directas a BD

### 6.2 Tests de endpoints
- Unit tests para AnalyticsService
- Integration tests para AnalyticsController
- Validar performance con datasets grandes

### 6.3 Tests de frontend
- Verificar carga de datos reales
- Testear estados de error
- Validar responsividad de gráficos

---

## 🚀 Fase 7: Optimización y Performance

### 7.1 Caching
- Implementar cache para estadísticas (Redis o In-Memory)
- Cache de 1 hora para datos de resumen
- Invalidar cache al detectar nueva actividad

### 7.2 Agregación de datos
- Crear tabla de estadísticas pre-calculadas por día
- Job nocturno para calcular estadísticas diarias
- Optimizar queries para rangos de fechas grandes

### 7.3 Paginación y filtros
- Agregar filtros por fecha en frontend
- Paginación para lista de recursos
- Exportar estadísticas a CSV/Excel

---

## 📋 Checklist de Implementación

### Base de Datos
- [ ] Crear tabla `visitor_tracking`
- [ ] Crear tabla `download_tracking`
- [ ] Crear índices necesarios
- [ ] Agregar campos de tracking a tablas existentes

### Backend
- [ ] Crear `AnalyticsController`
- [ ] Crear DTOs de analytics
- [ ] Implementar `AnalyticsService`
- [ ] Crear `VisitorTrackingMiddleware`
- [ ] Crear `DownloadTrackingService`
- [ ] Integrar tracking en endpoints existentes

### Frontend
- [ ] Crear `analyticsService.ts`
- [ ] Actualizar componente analytics
- [ ] Reemplazar datos simulados
- [ ] Agregar manejo de errores
- [ ] Testing en navegador

### Testing
- [ ] Crear datos de prueba
- [ ] Tests unitarios backend
- [ ] Tests integración
- [ ] Validación frontend
- [ ] Performance testing

### Optimización
- [ ] Implementar caching
- [ ] Agregación de datos
- [ ] Optimizar queries
- [ ] Documentar API

---

## 📝 Notas Importantes

1. **Privacidad**: No almacenar información personal identificable
2. **GDPR**: Considerar políticas de retención de datos
3. **Performance**: Monitorear impacto del tracking en performance
4. **Escalabilidad**: Diseñar para crecimiento futuro de datos
5. **Backup**: Incluir tablas de analytics en respaldos

---

## 🔄 Mantenimiento Continuo

- Revisar y limpiar datos antiguos mensualmente
- Monitorear performance de queries de analytics
- Actualizar dashboard según necesidades del negocio
- Documentar cambios y mejoras

---

**Estado**: ✅ Plan creado
**Próximo paso**: Comenzar con Fase 1 - Preparación de Base de Datos
**Estimación**: 2-3 sesiones de desarrollo para completar funcionalidad básica