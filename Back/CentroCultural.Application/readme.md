# Backend CentroCultural - API .NET 8

> **👥 Para usuarios no técnicos**: Si buscas información sobre cómo usar el sistema (permisos, límites de archivos, reglas de negocio), consulta la sección [**Reglas de Negocio para Usuarios**](../../README.md#-reglas-de-negocio-para-usuarios) en el README principal. Esta documentación es técnica para desarrolladores.

## 📌 Resumen del Backend

**Sistema Backend** para la plataforma del Centro Cultural Víctor Jara construido con **.NET 8** como **API REST complementaria** al frontend SvelteKit.

### 🎯 Estado Actual
- **✅ OPERATIVO**: APIs funcionales con autenticación JWT
- **✅ COMPATIBLE**: Integración completa con frontend SvelteKit
- **✅ MODERNO**: Sistema JWT con Bearer tokens
- **⚠️ OPCIONAL**: El frontend puede operar independientemente

---

## 🛠️ Tecnologías y Dependencias

### **Framework Base**
- **.NET 8.0** - Framework principal con soporte LTS
- **ASP.NET Core Web API** - APIs REST
- **Entity Framework Core 8.0** - ORM para SQLite
- **Microsoft.EntityFrameworkCore.Sqlite** - Proveedor SQLite

### **Autenticación** (JWT-based)
- **Microsoft.AspNetCore.Authentication.JwtBearer** - Autenticación JWT
- **System.IdentityModel.Tokens.Jwt** - Generación y validación de tokens
- **BCrypt.Net-Next 4.0.3** - Hash de contraseñas (no utilizado actualmente)

### **Testing y Desarrollo**
- **Microsoft.AspNetCore.Mvc.Testing** - Testing de integración
- **xunit 2.9.3** - Framework de pruebas
- **Swashbuckle.AspNetCore 6.4.0** - Documentación OpenAPI/Swagger

### **Base de Datos**
- **SQLite** - Base de datos principal (`../Data/ccpvj.db`)
- **Entity Framework Core Design** - Herramientas de migración
- **Foreign Keys Enabled** - Integridad referencial activa

---

## 🏗️ Arquitectura del Backend

```
Back/
├── CentroCultural.API/           # Controladores y configuración
│   ├── Controllers/              # Endpoints REST
│   ├── Program.cs               # Configuración principal
│   └── appsettings.json         # Configuración
│
├── CentroCultural.Application/   # Lógica de negocio
│   ├── Services/                # Servicios de aplicación
│   ├── Interfaces/              # Contratos
│   └── DTOs/                    # Objetos de transferencia
│
├── CentroCultural.Domain/        # Entidades de dominio
│   ├── Entities/                # Modelos de datos
│   ├── Enums/                   # Enumeraciones
│   └── Exceptions/              # Excepciones custom
│
└── CentroCultural.Infrastructure/ # Infraestructura
    ├── Data/                    # Contexto EF Core
    ├── Services/                # Servicios de infraestructura
    └── Configuration/           # Configuración de servicios
```

---

## 🔑 Sistema de Autenticación (JWT-based)

### **Configuración Actual**
```csharp
// Program.cs - JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!)
            )
        };
    });
```

### **Compatibilidad con SvelteKit**
```csharp
// CORS configurado para SvelteKit
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSvelteKit", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

---

## 🌐 Endpoints API Principales

### **🔐 Autenticación** (`/api/auth`)
```
POST   /api/auth/login       # Iniciar sesión (JWT)
POST   /api/auth/logout      # Cerrar sesión (revocar token)
GET    /api/auth/validate    # Validar token actual
```

### **📚 Cursos** (`/api/course`)
```
GET    /api/course           # Lista cursos (paginado)
GET    /api/course/all       # Todos los cursos
GET    /api/course/featured  # Cursos destacados
GET    /api/course/{id}      # Detalle curso con módulos
POST   /api/course           # Crear curso [Colaborador+]
PUT    /api/course/{id}      # Actualizar curso [Colaborador+]
DELETE /api/course/{id}      # Eliminar curso [Colaborador+]
GET    /api/course/my-courses # Cursos del educador [Colaborador+]
GET    /api/course/statistics # Estadísticas [Administrador]
GET    /api/course/subjects  # Materias disponibles
```

### **📋 Módulos** (`/api/course/modules`)
```
GET    /api/course/modules/{id}      # Detalle módulo
POST   /api/course/modules           # Crear módulo [Colaborador+]
PUT    /api/course/modules/{id}      # Actualizar módulo [Colaborador+]
DELETE /api/course/modules/{id}      # Eliminar módulo [Colaborador+]
PATCH  /api/course/modules/{id}/reorder # Reordenar módulo [Colaborador+]
```

### **📝 Blog** (`/api/blog`)
```
GET    /api/blog             # Lista posts (paginado)
GET    /api/blog/{id}        # Detalle post
GET    /api/blog/slug/{slug} # Post por slug
POST   /api/blog             # Crear post [Colaborador+]
PUT    /api/blog/{id}        # Actualizar post [Colaborador+]
DELETE /api/blog/{id}        # Eliminar post [Colaborador+]
POST   /api/blog/{id}/publish # Publicar post [Colaborador+]
GET    /api/blog/featured    # Posts destacados
GET    /api/blog/popular     # Posts populares
GET    /api/blog/recent      # Posts recientes
```

### **📁 Multimedia** (`/api/upload`)
```
POST   /api/upload/{contentType}/{contentId}/images   # Subir imágenes
POST   /api/upload/{contentType}/{contentId}/videos   # Subir videos
POST   /api/upload/{contentType}/{contentId}/audio    # Subir audio
GET    /api/upload/status/{uploadId}                  # Estado upload
DELETE /api/upload/{mediaId}                          # Eliminar media
GET    /api/upload/{contentType}/{contentId}          # Media por contenido
POST   /api/upload/cleanup                            # Limpiar archivos temp
```

### **📚 Biblioteca** (`/api/library`)
```
GET    /api/library          # Recursos biblioteca
POST   /api/library          # Subir recurso [Colaborador+]
GET    /api/library/{id}     # Detalle recurso
DELETE /api/library/{id}     # Eliminar recurso [Colaborador+]
```

---

## 🗄️ Modelo de Datos (Entity Framework)

### **Entidades Principales**
```csharp
// Autenticación
Usuario, Rol, RefreshToken, TokenBlacklist

// Sistema Educativo
MaterialApoyo, Modulo, ModulePost

// Blog y Eventos
BlogPost, BlogCategory, Event, EventRegistration

// Multimedia Contextual
MediaEntity, UploadStatus

// Biblioteca
LibraryResource
```

### **Configuración SQLite**
```csharp
// ApplicationDbContext configurado para SQLite
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString)
           .EnableSensitiveDataLogging(false)
           .EnableServiceProviderCaching());
```

---

## 🚀 Cómo Ejecutar el Backend

### **Desarrollo Local**
```bash
cd Back/
dotnet restore
dotnet run
```
**URL**: https://localhost:5251
**Swagger**: https://localhost:5251/swagger

### **Con Frontend SvelteKit**
```bash
# Terminal 1 - Backend
cd Back/
dotnet run

# Terminal 2 - Frontend
cd Front/
npm run dev
```

### **Base de Datos**
```bash
# La base de datos se crea automáticamente en Program.cs
# Ubicación: D:/ccpvj/Data/ccpvj.db
# Foreign Keys: Habilitados automáticamente
```

---

## 📊 Gestión de Multimedia (Contextual)

### **Sistema Contextual**
- **No archivos independientes**: Todo multimedia pertenece a contenido específico
- **Tipos soportados**: `material-apoyo`, `module-post`, `blog`, `event`
- **Limpieza automática**: Al eliminar contenido se eliminan archivos asociados
- **Compatible con nginx**: Headers para uploads grandes

### **Estructura de Archivos**
```
Data/media/uploads/
├── images/{contentType}/{contentId}/
├── videos/{contentType}/{contentId}/
├── audio/{contentType}/{contentId}/
└── documents/{contentType}/{contentId}/
```

### **Validaciones Implementadas**
- **Imágenes**: JPG, PNG, GIF, WebP (max 200MB)
- **Videos**: MP4, WebM, MOV (max 500MB)
- **Audio**: MP3, WAV, OGG (max 100MB)
- **Documentos**: PDF, Office files (max 100MB)

---

## 🔧 Configuración (appsettings.json)

### **Base de Datos**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=../Data/ccpvj.db"
  }
}
```

### **Legacy JWT Settings** (No utilizados)
```json
{
  "JwtSettings": {
    "SecretKey": "clave_super_secreta_123456",
    "Issuer": "SistemaEducativoMesh",
    "Audience": "CentroCultural",
    "ExpirationMinutes": 120
  }
}
```

### **Configuración de Aplicación**
```json
{
  "Application": {
    "Name": "Red Mesh Comunitaria",
    "Version": "1.0.0",
    "MaxConcurrentUsers": 30
  }
}
```

---

## 🧪 Testing y Desarrollo

### **Swagger UI**
- **URL**: https://localhost:5251/swagger
- **Documentación**: OpenAPI 3.0 generada automáticamente
- **Testing**: Interface para probar endpoints

### **Datos de Prueba**
```json
// Usuario administrador (seeding automático)
{
  "nombreUsuario": "admin",
  "contrasena": "admin123"
}

// Curso de ejemplo incluido
{
  "title": "Introducción a la Programación",
  "educator": "admin"
}
```

---

## 🔐 Sistema JWT Implementado

### **Características**
- ✅ **JWT Tokens**: Autenticación con Bearer tokens
- ✅ **Token Revocation**: Sistema de revocación de tokens
- ✅ **Compatible**: Headers CORS para SvelteKit
- ✅ **Expirable**: Tokens con tiempo de expiración configurable

### **SimpleAuthController**
```csharp
// Login genera JWT token
var token = _jwtService.GenerateToken(
    userId,
    username,
    role,
    nombre,
    apellido
);

return Ok(new {
    success = true,
    token = token,
    user = new { id, username, role },
    expiresAt = _jwtService.GetTokenExpiration(token)
});

// Logout revoca token
_jwtService.RevokeToken(token);
```

---

## 📈 Estado de Desarrollo

### **✅ Funcional**
- APIs CRUD completas para material educativo, módulos, blog
- Autenticación JWT operativa con Bearer tokens
- Sistema multimedia contextual implementado
- Base de datos SQLite con foreign keys
- Documentación Swagger actualizada

### **⚠️ En Desarrollo**
- Testing unitario e integración
- Optimización de rendimiento
- Refresh tokens automáticos

### **🔄 Integración con Frontend**
- **SvelteKit**: Consume APIs via `/api/` routes
- **JWT Tokens**: Stored en localStorage del frontend
- **CORS**: Configurado para desarrollo local
- **Opcional**: Frontend puede operar sin backend

---

## 📝 Notas para Desarrolladores

### **Autenticación**
- Usar `[Authorize]` para endpoints protegidos
- Roles: `"Colaborador,Administrador"` para creación/edición
- Claims disponibles: `NameIdentifier`, `Name`, `Role`

### **Base de Datos**
- Foreign keys habilitados automáticamente
- Seeding de datos inicial incluido
- Migraciones automáticas en desarrollo

### **Multimedia**
- Validar contenido existe antes de upload
- Usar servicios de limpieza para eliminar archivos
- Headers nginx para uploads grandes

---

**⚠️ Importante**: Este backend es **complementario** al frontend SvelteKit. El sistema puede operar completamente desde el frontend usando sus propias APIs.
