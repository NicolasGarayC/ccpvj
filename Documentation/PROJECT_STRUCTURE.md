# 📁 Centro Cultural Víctor Jara - Estructura del Proyecto Organizada

## 🏗️ Arquitectura Organizacional

El proyecto está organizado siguiendo principios de arquitectura limpia y separación de responsabilidades:

```
/home/user/ccpvj/
├── 📂 Back/                    # 🔧 Backend .NET (API, Servicios, Dominio)
├── 📂 Front/                   # 🎨 Frontend SvelteKit (UI, Cliente)
├── 📂 Data/                    # 🗄️ Datos, Base de Datos y Scripts
├── 📂 Infraestructure/         # 🌐 Configuraciones de Infraestructura
├── 📂 Documentation/           # 📚 Toda la Documentación
├── 📂 tests/                   # 🧪 Tests Unitarios e Integración
└── 📂 .git/                    # 📝 Control de Versiones
```

---

## 📂 Detalle de Directorios

### 🔧 `/Back/` - Backend .NET
**Propósito**: API REST, lógica de negocio, servicios

```
Back/
├── CentroCultural.API/         # Controladores, endpoints HTTP
│   └── Controllers/            # AuthController, CourseController, etc.
├── CentroCultural.Application/ # Servicios de aplicación, DTOs
│   ├── DTOs/                  # Data Transfer Objects
│   ├── Interfaces/            # Contratos de servicios
│   └── Services/              # Implementación de servicios
├── CentroCultural.Domain/      # Entidades de dominio, reglas de negocio
│   ├── Entities/              # Course, Module, WorkItem, User, etc.
│   ├── Enums/                 # Estados, tipos, categorías
│   └── Exceptions/            # Excepciones personalizadas
├── CentroCultural.Infrastructure/ # Acceso a datos, servicios externos
│   ├── Data/                  # DbContext, repositorios
│   ├── Services/              # Servicios de infraestructura
│   └── Middleware/            # Middleware personalizado
└── Properties/                 # Configuración de proyecto
```

**Archivos Clave:**
- `Back.sln` - Solución principal de .NET
- Configuración de capas (API → Application → Domain → Infrastructure)

### 🎨 `/Front/` - Frontend SvelteKit
**Propósito**: Interfaz de usuario, experiencia del usuario

```
Front/
├── src/
│   ├── routes/                # Páginas y API routes
│   │   ├── auth/login/        # Página de login
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── blog/              # Sistema de blog
│   │   ├── courses/           # Gestión de cursos
│   │   └── api/               # API endpoints del frontend
│   └── lib/
│       ├── components/        # Componentes reutilizables
│       ├── server/db/         # Configuración de base de datos
│       └── services/          # Servicios del cliente
├── static/                    # Archivos estáticos
├── project.inlang/           # Configuración de internacionalización
└── package.json              # Dependencias y scripts
```

**Características:**
- SvelteKit 5 con TypeScript
- Drizzle ORM para base de datos
- Componentes contextuales para multimedia
- Sistema de autenticación por sesiones

### 🗄️ `/Data/` - Datos y Base de Datos
**Propósito**: Almacenamiento de datos, scripts de mantenimiento

```
Data/
├── scripts/                   # Scripts de inicialización y mantenimiento
│   ├── init_contextual_database.sh  # Inicialización contextual
│   └── init_database.sh      # Script original de base de datos
├── media/                     # Multimedia contextual organizada
│   ├── courses/               # Banners e imágenes de cursos
│   ├── workitems/            # Imágenes y videos de WorkItems
│   ├── blog/                 # Multimedia de posts de blog
│   ├── events/               # Posters e imágenes de eventos
│   └── temp/                 # Uploads temporales
│       └── uploads/          # Estructura temporal por contexto
├── backups/                  # Respaldos automáticos de base de datos
├── ccpvj.db                  # Base de datos SQLite principal
├── database_tables_contextual_fixed.sql # Schema contextual
└── var/                      # Variables del sistema
```

**Principios de Organización:**
- **Multimedia contextual**: Nunca archivos huérfanos
- **Jerarquía**: courses/ → workitems/ → media files
- **Backups automáticos**: Con timestamps
- **Scripts ejecutables**: Con permisos de ejecución

### 🌐 `/Infraestructure/` - Configuraciones de Infraestructura
**Propósito**: Configuraciones de servidores, proxy, networking

```
Infraestructure/
└── nginx/                    # Configuraciones NGINX
    ├── nginx.conf            # Configuración principal optimizada
    └── sites-available/      # Configuraciones de sitios
        └── centro-cultural.conf # Configuración del sitio principal
```

**Características:**
- Optimizado para redes mesh offline
- Proxy para desarrollo (SvelteKit hot-reload)
- Servido estático para producción
- Cache inteligente para multimedia
- Configuración de uploads contextuales

### 📚 `/Documentation/` - Documentación Completa
**Propósito**: Toda la documentación técnica y de usuario

```
Documentation/
├── README.md                        # Descripción general del proyecto
├── DEVELOPMENT_SETUP.md            # Guía de configuración de desarrollo
├── DEPLOYMENT_GUIDE.md             # Guía completa de despliegue
├── PROJECT_STRUCTURE.md            # Este archivo - estructura del proyecto
├── CLAUDE.md                       # Contexto para Claude AI
├── WORKITEMS_DOCUMENTATION.md      # Documentación específica de WorkItems
├── CONTEXTUAL_MULTIMEDIA_GUIDE.md  # Guía de multimedia contextual
└── DATABASE_SCHEMA.md              # Documentación del schema de base de datos
```

**Principios de Documentación:**
- **Separación por propósito**: Setup, deployment, arquitectura
- **Guías paso a paso**: Para diferentes audiencias
- **Contextual**: Documentación específica por componente
- **Actualizada**: Refleja la arquitectura actual

### 🧪 `/tests/` - Tests y Pruebas
**Propósito**: Tests unitarios, integración y end-to-end

```
tests/
└── Back.Tests/               # Tests del backend .NET
    ├── bin/                  # Compilados de tests
    └── obj/                  # Objetos temporales de compilación
```

**Expansión Futura:**
```
tests/ (estructura sugerida)
├── Back.Tests/               # Tests backend .NET
├── Front.Tests/              # Tests frontend (Vitest/Playwright)
├── Integration.Tests/        # Tests de integración completa
└── E2E.Tests/               # Tests end-to-end (Playwright)
```

---

## 🎯 Principios de Organización

### 🔄 Separación de Responsabilidades
- **`Back/`**: Lógica de negocio, API, servicios
- **`Front/`**: Interfaz de usuario, experiencia
- **`Data/`**: Persistencia, multimedia, scripts
- **`Infraestructure/`**: Configuración de servidores
- **`Documentation/`**: Conocimiento y guías
- **`tests/`**: Calidad y validación

### 📁 Multimedia Contextual
**Principio Clave**: Nunca archivos huérfanos

```
Data/media/[context]/[content-id]/files
             ↓
    courses/matematicas-basica-001/banner.jpg
    workitems/algebra-ecuaciones-001/diagram.png
    workitems/algebra-ecuaciones-001/video.mp4
    blog/post-nuevos-talleres/featured.jpg
    events/evento-navidad-2024/poster.jpg
```

### 🗂️ Convenciones de Archivos
- **Scripts**: `.sh` en `/Data/scripts/` con permisos ejecutables
- **SQL**: `.sql` en `/Data/` 
- **Documentación**: `.md` en `/Documentation/`
- **Configuraciones**: En `/Infraestructure/`
- **Media**: En `/Data/media/[context]/`

---

## 🚀 Flujo de Desarrollo

### 1️⃣ Desarrollo Frontend
```bash
# Trabajar en: /Front/src/
cd Front/
npm run dev  # Hot reload automático
```

### 2️⃣ Desarrollo Backend
```bash
# Trabajar en: /Back/CentroCultural.*/
cd Back/
dotnet run
```

### 3️⃣ Cambios en Base de Datos
```bash
# Scripts en: /Data/scripts/
./Data/scripts/init_contextual_database.sh
```

### 4️⃣ Configuración de Infraestructura
```bash
# Configuraciones en: /Infraestructure/nginx/
sudo cp Infraestructure/nginx/* /etc/nginx/
```

### 5️⃣ Actualización de Documentación
```bash
# Documentación en: /Documentation/
# Actualizar según cambios realizados
```

---

## 📊 Métricas del Proyecto

### 📂 Distribución por Directorio
```bash
# Contar archivos por directorio
find Back/ -type f | wc -l          # Archivos backend
find Front/src/ -type f | wc -l      # Archivos frontend
find Data/ -type f | wc -l           # Archivos de datos
find Documentation/ -type f | wc -l  # Archivos de documentación
```

### 💾 Uso de Espacio
```bash
# Tamaño por directorio
du -sh Back/                  # Backend
du -sh Front/                 # Frontend  
du -sh Data/                  # Datos (incluye multimedia)
du -sh Documentation/         # Documentación
```

### 🗄️ Base de Datos
```sql
-- Contar entidades contextuales
SELECT 
    'Courses' as Entity, COUNT(*) as Count FROM Course
UNION ALL SELECT 
    'Modules', COUNT(*) FROM Module  
UNION ALL SELECT 
    'WorkItems', COUNT(*) FROM WorkItem
UNION ALL SELECT 
    'BlogPosts', COUNT(*) FROM BlogPost
UNION ALL SELECT 
    'Events', COUNT(*) FROM Event
UNION ALL SELECT 
    'MediaFiles', COUNT(*) FROM MediaFile;
```

---

## 🔍 Navegación Rápida

### 📍 Archivos Clave de Configuración
- **Database Schema**: `/Data/database_tables_contextual_fixed.sql`
- **NGINX Config**: `/Infraestructure/nginx/sites-available/centro-cultural.conf`
- **Frontend Package**: `/Front/package.json`
- **Backend Solution**: `/Back.sln`
- **Database Init**: `/Data/scripts/init_contextual_database.sh`

### 📖 Documentación Principal
- **Setup Development**: `/Documentation/DEVELOPMENT_SETUP.md`
- **Full Deployment**: `/Documentation/DEPLOYMENT_GUIDE.md`
- **WorkItems Guide**: `/Documentation/WORKITEMS_DOCUMENTATION.md`
- **Project Overview**: `/Documentation/README.md`

### 🎯 Puntos de Entrada
- **Frontend Dev**: `cd Front/ && npm run dev`
- **Backend Dev**: `cd Back/ && dotnet run`
- **Database Init**: `./Data/scripts/init_contextual_database.sh`
- **NGINX Apply**: `sudo cp Infraestructure/nginx/* /etc/nginx/`

---

## ✅ Validación de Estructura

### 🧪 Verificar Organización Correcta
```bash
# Verificar que todos los archivos están en su lugar correcto
[ -d "Back/" ] && echo "✅ Backend directory exists"
[ -d "Front/" ] && echo "✅ Frontend directory exists"
[ -d "Data/" ] && echo "✅ Data directory exists"  
[ -d "Infraestructure/" ] && echo "✅ Infrastructure directory exists"
[ -d "Documentation/" ] && echo "✅ Documentation directory exists"
[ -d "tests/" ] && echo "✅ Tests directory exists"

# Verificar archivos clave
[ -f "Data/ccpvj.db" ] && echo "✅ Database exists"
[ -f "Data/scripts/init_contextual_database.sh" ] && echo "✅ Init script exists"
[ -f "Documentation/DEPLOYMENT_GUIDE.md" ] && echo "✅ Deployment guide exists"
[ -f "Infraestructure/nginx/nginx.conf" ] && echo "✅ NGINX config exists"
```

### 🎯 Estructura Validada
- ✅ **Backend separado**: Arquitectura por capas en `/Back/`
- ✅ **Frontend separado**: SvelteKit en `/Front/`
- ✅ **Datos organizados**: Base de datos y media en `/Data/`
- ✅ **Infraestructura separada**: Configuraciones en `/Infraestructure/`
- ✅ **Documentación centralizada**: Todo en `/Documentation/`
- ✅ **Tests organizados**: Estructura para testing en `/tests/`

---

## 🎉 Beneficios de la Organización

### 👥 Para Desarrolladores
- **Claridad**: Cada archivo tiene su lugar específico
- **Mantenimiento**: Fácil localizar y modificar componentes
- **Colaboración**: Estructura estándar comprensible
- **Escalabilidad**: Preparado para crecimiento del proyecto

### 🔧 Para DevOps
- **Despliegue**: Configuraciones separadas y versionadas
- **Backups**: Datos claramente identificados
- **Monitoreo**: Logs y métricas organizados
- **Debugging**: Estructura predictible para troubleshooting

### 📚 Para Documentación
- **Centralizada**: Una sola fuente de verdad
- **Actualizada**: Refleja la estructura real
- **Accesible**: Fácil navegación y búsqueda
- **Completa**: Cobertura de todos los aspectos

¡Tu proyecto Centro Cultural Víctor Jara está perfectamente organizado y listo para desarrollo profesional! 🚀