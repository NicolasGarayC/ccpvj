


# Contexto Completo del Proyecto - Centro Cultural Víctor Jara

## 📌 Instrucciones de Comunicación
**IMPORTANTE**: Responde de manera **concisa y al punto**, sin textos innecesarios. Mantén precisión técnica pero evita explicaciones extensas.

## 📌 Contexto General del Proyecto

Desarrollo de una **plataforma web offline**, integrada en una **red MESH local**, para un centro cultural comunitario en Bogotá (Centro Cultural Víctor Jara).

**Objetivo principal**: Potenciar y expandir el acceso a contenidos culturales, educativos y comunicativos, incluso sin conexión a internet, utilizando una red distribuida entre dispositivos de la comunidad.

**Prioridad crítica**: **Consumir los menos recursos posibles en procesamiento**, no en almacenamiento.

## 📌 Tecnologías Seleccionadas

### Frontend
- **Svelte 5**: Framework elegido por ligereza, reactividad y bajo consumo de recursos
- Páginas de calendario, catálogo de eventos, interfaces de usuario
- Búsqueda con filtros optimizada para móviles

### Backend
- **.NET 8 (ASP.NET Core)**: Lógica de negocio, seguridad y acceso a BD
- **Arquitectura en capas**:
  - Capa de Presentación (APIs/Controllers)
  - Capa de Aplicación (casos de uso)
  - Capa de Dominio (entidades y validaciones)
  - Capa de Infraestructura (BD y servicios externos)

### Servidor Web
- **NGINX**: Proxy inverso y manejo de multimedia
- Balanceo de carga, compresión Gzip/Brotli, terminado SSL
- **Optimización multimedia**: sendfile, tcp_nopush, Range Requests
- **Upload directo**: Los archivos van directo a NGINX, no pasan por .NET para ahorrar recursos

### Base de Datos
- **SQLite**: Ligera, portable, ideal para offline
- Un archivo .db por nodo MESH
- Administrada con Entity Framework Core

## 📌 Arquitectura de Archivos Implementada

### Estructura del Proyecto
```
proyecto/
├── Back/
├── Front/
├── Data/
│   └── media/
│       ├── uploads/
│       │   ├── images/
│       │   ├── videos/
│       │   ├── audio/
│       │   └── documents/
│       ├── processed/
│       │   ├── images/
│       │   │   ├── thumbnails/
│       │   │   └── optimized/
│       │   ├── videos/
│       │   │   └── compressed/
│       │   └── audio/
│       │       └── compressed/
│       └── temp/
│           └── uploads/
│               ├── images/
│               ├── videos/
│               └── audio/
├── Infrastructure/
│   └── nginx/
│       ├── nginx.conf
│       ├── sites-available/
│       │   └── centro-cultural.conf
│       └── scripts/
│           └── cleanup-media.sh
├── back.sln
└── README.md
```

## 📌 Configuración NGINX Implementada

### nginx.conf (Configuración Global)
```nginx
worker_processes auto;
worker_cpu_affinity auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
    accept_mutex off;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Cache de archivos del SO
    open_file_cache max=10000 inactive=5m;
    open_file_cache_valid 2m;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
    
    # Compresión inteligente (solo texto)
    gzip on;
    gzip_vary on;
    gzip_comp_level 3;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types
        text/plain text/css text/xml text/javascript
        application/javascript application/json application/xml+rss
        application/atom+xml image/svg+xml;
    
    # Buffers optimizados
    client_body_buffer_size 16k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;
    output_buffers 2 32k;
    postpone_output 1460;
    
    # Timeouts balanceados
    client_body_timeout 12s;
    client_header_timeout 12s;
    keepalive_timeout 65s;
    send_timeout 10s;
    keepalive_requests 1000;
    
    # Proxy optimizado
    proxy_buffering on;
    proxy_buffer_size 8k;
    proxy_buffers 16 8k;
    proxy_busy_buffers_size 16k;
    
    # Backend pool
    upstream backend {
        server 127.0.0.1:5000;
        keepalive 32;
    }
    
    # Cache paths
    proxy_cache_path /tmp/nginx-cache-static 
        levels=1:2 keys_zone=static_cache:10m 
        max_size=100m inactive=24h use_temp_path=off;
    
    proxy_cache_path /tmp/nginx-cache-media 
        levels=1:2 keys_zone=media_cache:50m 
        max_size=500m inactive=7d use_temp_path=off;
    
    # Logging optimizado
    log_format optimized '$remote_addr - $remote_user [$time_local] '
                        '"$request" $status $body_bytes_sent '
                        '"$http_referer" rt=$request_time';
    
    access_log /var/log/nginx/access.log optimized;
    error_log /var/log/nginx/error.log warn;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=5r/m;
    
    include /etc/nginx/sites-enabled/*;
}
```

### centro-cultural.conf (Configuración del Sitio)
**Características implementadas**:
- **Archivos multimedia**: Servicio directo desde NGINX sin pasar por .NET
- **Upload optimizado**: Archivos van directo a disco, solo metadata pasa por .NET
- **Cache diferenciado**: 30d imágenes, 7d videos, 14d audio
- **Range requests**: Streaming eficiente para video/audio
- **Rate limiting**: Protección anti-spam específica por tipo
- **Validación por extensión**: Filtrado antes de procesamiento
- **Cleanup automático**: Endpoint para limpiar archivos temporales

### Rutas Configuradas
- `GET /media/*`: Servicio directo de archivos multimedia
- `POST /upload/images`: Upload de imágenes (máx 20MB)
- `POST /upload/videos`: Upload de videos (máx 500MB)
- `POST /upload/audio`: Upload de audio (máx 100MB)
- `POST /cleanup`: Limpieza automática de temporales
- `GET|POST /api/*`: Proxy hacia backend .NET
- `GET /*`: Frontend SPA con cache inteligente

## 📌 Integración Backend Implementada

### Endpoints Requeridos en .NET
```csharp
[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    [HttpPost("images")]
    [Authorize]
    public async Task<IActionResult> ProcessImageUpload()
    {
        // NGINX pasa archivo en X-File-Path header
        var tempFilePath = Request.Headers["X-File-Path"].FirstOrDefault();
        
        // Validar, procesar y mover de /temp/ a /uploads/
        // Generar thumbnail, guardar metadata en BD
        // Retornar URL final para el frontend
    }
    
    [HttpPost("videos")]
    [Authorize] 
    public async Task<IActionResult> ProcessVideoUpload()
    {
        // Procesamiento asíncrono para archivos grandes
        // Retorna uploadId para tracking de progreso
    }
    
    [HttpPost("audio")]
    [Authorize]
    public async Task<IActionResult> ProcessAudioUpload()
    
    [HttpPost("cleanup")]
    [AllowAnonymous] // Solo localhost
    public async Task<IActionResult> CleanupTempFiles()
    
    [HttpGet("status/{uploadId}")]
    public async Task<IActionResult> GetUploadStatus(Guid uploadId)
    
    [HttpDelete("{mediaId}")]
    [Authorize]
    public async Task<IActionResult> DeleteMedia(int mediaId)
    
    [HttpGet]
    public async Task<IActionResult> GetMediaList([FromQuery] MediaFilterDto filter)
}
```

### Modelos de Datos
```csharp
public class MediaEntity
{
    public int Id { get; set; }
    public string FileName { get; set; }
    public string RelativePath { get; set; }
    public string ThumbnailPath { get; set; }
    public MediaType Type { get; set; } // Image, Video, Audio
    public long SizeBytes { get; set; }
    public int? DurationSeconds { get; set; }
    public string MimeType { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; }
}

public enum MediaType { Image = 1, Video = 2, Audio = 3, Document = 4 }
```

## 📌 Flujo de Trabajo Multimedia

### Upload Process (Optimizado para Recursos)
1. **Frontend** → Upload a `/upload/images|videos|audio`
2. **NGINX** → Valida extensión y guarda archivo en `/temp/`
3. **NGINX** → Proxy a .NET con header `X-File-Path`
4. **.NET** → Valida, procesa y mueve archivo a `/uploads/`
5. **.NET** → Genera thumbnails/compresión si necesario
6. **.NET** → Guarda metadata en SQLite
7. **.NET** → Retorna URL final para frontend
8. **Cleanup** → Cron job limpia `/temp/` cada hora

### Streaming Process
1. **Frontend** → Solicita `/media/videos/archivo.mp4`
2. **NGINX** → Servicio directo con Range Requests
3. **No pasa por .NET** → Máximo rendimiento

## 📌 Requisitos del Sistema

### Funcionales
- Registro y autenticación de usuarios con roles
- Acceso a calendario de eventos
- Descarga y visualización de materiales multimedia
- Notificaciones locales en red MESH
- Inscripción a talleres y actividades
- Personalización de perfil
- Gestión administrativa (CRUD eventos)
- Búsqueda y filtros en catálogo

### No Funcionales
- **Disponibilidad**: Modo offline con red MESH
- **Rendimiento**: <2s respuesta, 50+ usuarios concurrentes
- **Seguridad**: Autenticación por roles, HTTPS, cifrado contraseñas
- **Escalabilidad**: Backend desacoplado, arquitectura modular
- **Accesibilidad**: Dispositivos gama baja, buenas prácticas web
- **Resiliencia**: Manejo fallos BD, red MESH como respaldo

### Permisos y Seguridad
- **Contenido público**: Todos los archivos multimedia son públicos (sin autenticación para acceso)
- **Gestión privada**: Solo usuarios autenticados pueden subir/crear contenido
- **Sin información privada**: Excepto credenciales de docentes
- **Roles**: Usuarios básicos vs administradores/docentes

## 📌 Optimizaciones Implementadas

### Rendimiento
- **sendfile**: Transferencia kernel-level
- **tcp_nopush/nodelay**: Optimización TCP
- **Range Requests**: Streaming eficiente
- **ETag**: Validación de cache inteligente
- **Keepalive pools**: Conexiones persistentes
- **Rate limiting**: Protección recursos

### Cache Strategy
- **Imágenes**: 30 días, immutable
- **Videos**: 7 días, public
- **Audio**: 14 días, public
- **CSS/JS**: 1 año con versioning
- **HTML**: 1 hora, must-revalidate
- **API**: 5min para GET responses

### Compresión
- **Solo texto**: CSS, JS, JSON, SVG
- **Nunca multimedia**: JPG, MP4, MP3 ya comprimidos
- **Nivel 3**: Balance CPU vs tamaño
- **Gzip estático**: Archivos pre-comprimidos

## 📌 Siguiente Paso: Testing y Validación

Necesidades pendientes:
1. **Pruebas funcionales**: Upload, streaming, API endpoints
2. **Pruebas no funcionales**: Carga, concurrencia, recursos
3. **Configuración producción**: SSL, logs, monitoreo
4. **Scripts deployment**: Instalación automática
5. **Documentación**: Guías de usuario y mantenimiento

## 📌 Estructura de Archivos Creada

```bash
# Directorios ya creados en desarrollo
~/ccpvj/Data/media/
├── uploads/
├── processed/
│   ├── images/
│   │   ├── thumbnails/
│   │   └── optimized/
│   ├── videos/compressed/
│   └── audio/compressed/
└── temp/
    └── uploads/
        ├── images/
        ├── videos/
        └── audio/
```

**Status actual**: Pipeline NGINX completamente configurado, falta implementar endpoints .NET y testing.