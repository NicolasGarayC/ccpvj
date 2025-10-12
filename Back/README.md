# Centro Cultural Víctor Jara - Backend API

Backend .NET 8 con arquitectura en capas para la plataforma del Centro Cultural Víctor Jara. Proporciona APIs REST seguras con autenticación JWT completamente **offline en Red MESH autónoma** sin acceso a Internet.

## ✅ Estado Actual - Correcciones Aplicadas (Septiembre 2025)

### **Problemas Críticos Resueltos**

#### **1. Mapeo de Entidades**
- ✅ **Course Entity**: Agregados atributos `[Table("course")]` y `[Column]` faltantes
- ✅ **ModulePost Entity**: Tipos de datos corregidos (`AuthorId`: int → string, `UpdatedAt`: DateTime → long)
- ✅ **Mapeo consistente**: snake_case (BD) ↔ PascalCase (C#) funcional

#### **2. Servicios de Aplicación**
- ✅ **MaterialApoyoService**: Corregido `DateTime.FromBinary()` → `DateTimeOffset.FromUnixTimeSeconds()`
- ✅ **ModulePostService**: Timestamps Unix manejados correctamente
- ✅ **Conversiones de fecha**: Unix timestamps manejados correctamente en DTOs

#### **3. Base de Datos**
- ✅ **Foreign Keys**: `PRAGMA foreign_keys = ON` funcionando
- ✅ **Consistencia**: Esquemas unificados entre Drizzle y Entity Framework
- ✅ **Tipos de datos**: Unix timestamps (long) vs DateTime correctamente manejados

## 🏗️ Arquitectura

### Stack Tecnológico
- **.NET 8**: Framework backend con ASP.NET Core (deployment autocontenido)
- **Entity Framework Core**: ORM para acceso a datos offline
- **SQLite**: Base de datos principal (autocontenida, sin servidor externo)
- **JWT + Refresh Tokens**: Autenticación completamente offline con blacklist local
- **BCrypt**: Hash de contraseñas (sin dependencias externas)
- **Swagger/OpenAPI**: Documentación automática (recursos locales)
- **Red MESH**: APIs disponibles exclusivamente en red MESH local

### Arquitectura en Capas
```
📦 CentroCultural.API          # Controladores y configuración
├── Controllers/               # Endpoints REST
├── Middleware/               # Middleware personalizado
└── Program.cs               # Configuración aplicación

📦 CentroCultural.Application  # Lógica de negocio
├── DTOs/                    # Objetos de transferencia
├── Interfaces/              # Contratos de servicios
├── Services/                # Implementación lógica negocio
└── Configuration/           # Registro servicios

📦 CentroCultural.Domain      # Entidades de dominio  
└── Entities/                # Modelos de datos

📦 CentroCultural.Infrastructure # Acceso a datos
├── Data/                    # Contexto EF y configuraciones
└── Services/                # Servicios infraestructura
```

## 🔐 Sistema de Autenticación

### Características JWT
- **Access Tokens**: 15 minutos de duración
- **Refresh Tokens**: 7 días de duración  
- **Token Blacklist**: Revocación segura en logout
- **Renovación Automática**: Refresh transparente
- **Multi-dispositivo**: Logout individual o total

### Endpoints de Autenticación
```http
POST   /api/auth/login         # Login con credenciales
POST   /api/auth/refresh       # Renovar access token
POST   /api/auth/logout        # Logout individual (revoca refresh token)
POST   /api/auth/logout-all    # Logout todos los dispositivos
```

## 👥 Sistema de Gestión de Usuarios

### Características
- **Registro Controlado**: Solo Admin/Colaboradores crean usuarios
- **Roles Jerárquicos**: Asistente → Colaborador → Administrador  
- **Gestión Completa**: CRUD, activación, cambio roles, reset password
- **Validaciones**: Username único, roles válidos, permisos
- **Estadísticas**: Métricas para administradores

### Endpoints de Usuarios
```http
GET    /api/usermanagement              # Lista paginada con filtros [Admin+]
GET    /api/usermanagement/{id}         # Usuario específico [Admin+]
GET    /api/usermanagement/me           # Usuario actual
POST   /api/usermanagement              # Crear usuario [Admin+]
PUT    /api/usermanagement/{id}         # Actualizar usuario [Admin+]  
DELETE /api/usermanagement/{id}         # Eliminar usuario [Admin]
PATCH  /api/usermanagement/{id}/status  # Activar/desactivar [Admin+]
PATCH  /api/usermanagement/{id}/role    # Cambiar rol [Admin+]
POST   /api/usermanagement/{id}/reset-password # Resetear password [Admin+]
GET    /api/usermanagement/roles        # Roles disponibles [Admin+]
GET    /api/usermanagement/statistics   # Estadísticas [Admin]
GET    /api/usermanagement/can-manage   # Verificar permisos
GET    /api/usermanagement/check-username/{username} # Disponibilidad
```

## 🎓 Sistema de Material de Apoyo

### Características
- **Jerarquía**: MaterialApoyo → Modulo → ModulePost
- **Multimedia Contextual**: Archivos vinculados a Posts
- **Filtros Avanzados**: Por categoría, destacados, autor
- **Paginación**: Resultados optimizados
- **Permisos**: Control por roles

### Endpoints de Material de Apoyo
```http
GET    /api/materialapoyo                    # Lista paginada
GET    /api/materialapoyo/all                # Todos los materiales
GET    /api/materialapoyo/featured           # Material destacado
GET    /api/materialapoyo/{id}               # Material específico
GET    /api/materialapoyo/{id}/modules       # Módulos del material
POST   /api/materialapoyo                    # Crear [Colaborador+]
PUT    /api/materialapoyo/{id}               # Actualizar [Colaborador+]
DELETE /api/materialapoyo/{id}               # Eliminar [Colaborador+]
GET    /api/materialapoyo/modules/{id}       # Módulo específico
POST   /api/materialapoyo/modules            # Crear módulo [Colaborador+]
PUT    /api/materialapoyo/modules/{id}       # Actualizar módulo [Colaborador+]
DELETE /api/materialapoyo/modules/{id}       # Eliminar módulo [Colaborador+]
```

## 📝 Sistema de Blog

### Características  
- **Estados**: Borrador, Publicado, Destacado
- **Multimedia**: Imágenes, PDFs, videos contextuales
- **Acceso Público**: Lectura sin autenticación
- **Gestión Roles**: Crear/editar según permisos

### Endpoints de Blog
```http
GET    /api/blog                      # Posts públicos
GET    /api/blog/{id}                 # Post específico
GET    /api/blog/slug/{slug}          # Post por slug
POST   /api/blog                      # Crear [Colaborador+]
PUT    /api/blog/{id}                 # Actualizar [Colaborador+]
DELETE /api/blog/{id}                 # Eliminar [Colaborador+]
POST   /api/blog/{id}/publish         # Publicar [Colaborador+]
POST   /api/blog/{id}/unpublish       # Despublicar [Colaborador+]
```

## 📁 Sistema de Multimedia

### Características
- **Multimedia Contextual**: Sin archivos huérfanos
- **Validación Estricta**: Solo contenido vinculado
- **Organización**: Directorios por tipo de contenido
- **Limpieza Automática**: Eliminación en cascada

### Endpoints de Upload
```http
POST   /api/upload/posts/{id}             # Multimedia para Post (imagen/video/audio)
POST   /api/upload/blog/{id}/images       # Imagen para blog
POST   /api/upload/blog/{id}/videos       # Video para blog
POST   /api/upload/blog/{id}/documents    # PDF para blog
```

## 🚀 Inicio Rápido

### Prerrequisitos
- **Server Red MESH** con .NET 8 SDK instalado
- **SQLite** (base de datos autocontenida - NO requiere servidor externo)
- **Visual Studio 2022 / VS Code** (instalado en server MESH)
- **Red MESH configurada** sin acceso a Internet

### Configuración Red MESH
```bash
# Restaurar paquetes (desde cache local - SIN Internet)
dotnet restore --source /path/to/local/nuget/cache

# Configurar para Red MESH en appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=../Data/ccpvj.db;Cache=Shared;"
  },
  "JwtSettings": {
    "Key": "your-mesh-secret-key-256-bits-minimum",
    "Issuer": "CentroCultural-MESH",
    "Audience": "CentroCultural-MESH-Users"
  },
  "AllowedHosts": "[IP-RANGE-MESH]:*",  # Solo IPs de red MESH
  "Urls": "http://[IP-SERVER-MESH]:5000"
}

# Aplicar migraciones (base de datos SQLite local)
dotnet ef database update

# Ejecutar en Server MESH
dotnet run --urls="http://[IP-SERVER-MESH]:5000"
```

### Desarrollo en Red MESH
```bash
dotnet run --urls="http://[IP-SERVER-MESH]:5000"  # API en red MESH
dotnet watch --urls="http://[IP-SERVER-MESH]:5000" # Hot reload MESH
dotnet ef migrations add <name>     # Nueva migración (offline)
dotnet ef database update          # Aplicar migraciones SQLite local
dotnet test                         # Pruebas unitarias (offline)
```

## 🗄️ Base de Datos

### Entidades Principales
```csharp
// Usuarios y autenticación
public class Usuario
{
    public int IdUsuario { get; set; }
    public string NombreUsuario { get; set; }
    public string Contrasena { get; set; } // Hash BCrypt
    public string Nombre { get; set; }
    public string Apellido { get; set; }
    public string Telefono { get; set; }
    public int IdRol { get; set; }
    public Rol Rol { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int UserId { get; set; }
    public bool IsRevoked { get; set; }
}

public class TokenBlacklist
{
    public int Id { get; set; }
    public string TokenJti { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int UserId { get; set; }
}

// Sistema educativo
public class MaterialApoyo
{
    public string Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public bool IsFeatured { get; set; }
    public List<Modulo> Modules { get; set; }
}

public class ModulePost
{
    public string Id { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public string ImagePath { get; set; }
    public string VideoPath { get; set; }
    public string AudioPath { get; set; }
    public string ModuleId { get; set; }
}
```

### Configuración Entity Framework
```csharp
// ApplicationDbContext.cs
public class ApplicationDbContext : DbContext
{
    public DbSet<Usuario> Usuario { get; set; }
    public DbSet<RefreshToken> RefreshToken { get; set; }
    public DbSet<TokenBlacklist> TokenBlacklist { get; set; }
    public DbSet<MaterialApoyo> MaterialApoyo { get; set; }
    public DbSet<Modulo> Modulos { get; set; }
    public DbSet<ModulePost> ModulePosts { get; set; }
    public DbSet<BlogPost> BlogPost { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configuraciones de entidades
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
```

## 🔧 Configuración Avanzada

### JWT Settings
```json
{
  "JwtSettings": {
    "Key": "your-very-long-secret-key-at-least-256-bits",
    "Issuer": "CentroCultural.API",
    "Audience": "CentroCultural.Users",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  }
}
```

### Middleware Pipeline
```csharp
// Program.cs
var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();      // JWT validation
app.UseMiddleware<TokenBlacklistMiddleware>(); // Custom blacklist
app.UseAuthorization();       // Role-based authorization
app.MapControllers();
```

### Servicios Registrados
```csharp
// ApplicationServiceRegistration.cs
public static IServiceCollection AddApplicationServices(this IServiceCollection services)
{
    services.AddScoped<IAuthService, AuthService>();
    services.AddScoped<IJwtService, JwtService>();
    services.AddScoped<IUserManagementService, UserManagementService>();
    services.AddScoped<ICourseService, CourseService>();
    services.AddScoped<IBlogService, BlogService>();
    services.AddScoped<IMediaService, MediaService>();
    
    return services;
}
```

## 🛡️ Seguridad

### Características Implementadas
- **JWT con Blacklist**: Revocación segura de tokens
- **Hash BCrypt**: Contraseñas nunca en texto plano  
- **Roles Jerárquicos**: Control granular de permisos
- **Validación Entrada**: DTOs con validaciones
- **HTTPS Only**: Comunicación cifrada
- **CORS Configurado**: Origen controlado

### Middleware de Seguridad
```csharp
public class TokenBlacklistMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (token != null && await _blacklistService.IsTokenBlacklistedAsync(token))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Token has been revoked");
            return;
        }

        await next(context);
    }
}
```

## 🧪 Testing

### Estructura de Pruebas
```
tests/
├── Back.Tests/
│   ├── Controllers/         # Pruebas controladores
│   ├── Services/           # Pruebas lógica negocio  
│   ├── Integration/        # Pruebas integración
│   └── Fixtures/          # Datos de prueba
```

### Comandos Testing
```bash
dotnet test                           # Todas las pruebas
dotnet test --filter Category=Unit   # Solo unitarias
dotnet test --filter Category=Integration # Solo integración
dotnet test --collect:"XPlat Code Coverage" # Con cobertura
```

## 📊 Monitoreo y Logging

### Configuración Logging
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "CentroCultural": "Debug"
    }
  }
}
```

### Health Checks
```csharp
services.AddHealthChecks()
    .AddDbContext<ApplicationDbContext>()
    .AddCheck<AuthServiceHealthCheck>("auth-service");

app.MapHealthChecks("/health");
```

## 🚀 Despliegue en Red MESH

### Build para Producción MESH
```bash
# Build autocontenido para Red MESH (sin dependencias externas)
dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish-mesh

# Copiar a Server MESH
scp -r ./publish-mesh mesh-admin@[IP-SERVER-MESH]:/opt/centro-cultural/
```

### Docker Support para Red MESH
```dockerfile
# Imagen base sin conectividad externa
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

# Build autocontenido
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release --self-contained true -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
# Configurar para red MESH local
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "CentroCultural.API.dll"]
```

### Variables de Entorno Red MESH
```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://[IP-SERVER-MESH]:5000
ConnectionStrings__DefaultConnection="Data Source=/data/ccpvj.db;Cache=Shared;"
JwtSettings__Key="mesh-production-secret-key-256-bits"
JwtSettings__Issuer="CentroCultural-MESH"
JwtSettings__Audience="CentroCultural-MESH-Users"
```

## 📈 Performance

### Optimizaciones Implementadas
- **Entity Framework**: Lazy loading, query optimization
- **Caching**: Response caching para endpoints públicos
- **Compression**: Gzip response compression
- **Pagination**: Resultados limitados por página
- **Connection Pooling**: Pool de conexiones DB

### Métricas Target
- **Response Time**: < 200ms (endpoints simples)
- **Throughput**: > 1000 RPS
- **Memory Usage**: < 512MB
- **DB Connections**: Pool optimizado

---

**Backend API desarrollado con .NET 8 para máxima seguridad y performance en Red MESH autónoma** 🌐🚀