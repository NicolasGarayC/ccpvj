# Centro Cultural Víctor Jara - Plataforma Web Educativa

## 📌 Resumen Ejecutivo

Plataforma web educativa para centros culturales comunitarios diseñada para funcionar offline-first con arquitectura de red mesh local. **Estado actual: FUNCIONAL**.

### 🎯 Objetivo
Crear una plataforma educativa y cultural para el Centro Cultural Víctor Jara en Bogotá que permita:
- Gestión de cursos educativos organizados por materias
- Sistema multimedia contextual integrado
- Roles diferenciados (asistente, colaborador, administrador)
- Blog y sistema de noticias del centro

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- .NET 8 SDK (opcional para backend)

### Ejecutar el Proyecto

#### Frontend (Principal)
```bash
cd Front/
npm install
npm run dev
# Disponible en: http://localhost:5173
```

#### Backend (Opcional)
```bash
cd Back/
dotnet restore
dotnet run
# Disponible en: http://localhost:5251
```

## 🛠️ Tecnologías

- **Frontend**: SvelteKit 5 + TypeScript + Tailwind CSS
- **Base de Datos**: SQLite (`Data/ccpvj.db`)
- **Backend**: .NET 8 (opcional/legacy)
- **Autenticación**: Sistema JWT (JSON Web Tokens)

## 📁 Estructura del Proyecto

```
ccpvj/
├── Front/                    # Frontend SvelteKit (Principal)
│   ├── src/routes/          # Páginas y APIs
│   ├── src/lib/components/  # Componentes Svelte
│   └── src/lib/services/    # Servicios frontend
├── Back/                    # Backend .NET (Opcional)
│   ├── CentroCultural.API/
│   ├── CentroCultural.Application/
│   ├── CentroCultural.Domain/
│   ├── CentroCultural.Infrastructure/
│   └── Data/                # Archivos del backend
│       └── media/           # ⚠️ Archivos multimedia (imágenes, videos, documentos)
├── Data/                    # Base de datos
│   └── ccpvj.db            # SQLite database
└── Documentation/          # Documentación completa
```

## ✅ Estado Actual (Octubre 2025)

### **Sistema Completamente Funcional**

#### **Todos los Módulos Operativos**
- ✅ **Material de Apoyo**: Sistema educativo completo (cursos, módulos, posts)
- ✅ **Blog**: Sistema de publicaciones con multimedia
- ✅ **Eventos**: Calendario y gestión de eventos
- ✅ **Biblioteca Digital**: Gestión de recursos y documentos
- ✅ **Autenticación**: Sistema de sesiones con cookies
- ✅ **Multimedia**: Upload, servicio y limpieza automática
- ✅ **DELETE CASCADE**: Eliminación en cascada con limpieza multimedia


## 📚 Documentación

### Documentos Principales
- **[README Completo](Documentation/README.md)** - Documentación técnica detallada
- **[Configuración](Documentation/CONFIGURATION.md)** - Variables de entorno y configuración
- **[Esquema BD](Documentation/DATABASE_SCHEMA.md)** - Estructura de base de datos
- **[Deployment](Documentation/DEPLOYMENT_UBUNTU_STEPBYSTEP.md)** - Guía de despliegue
- **[Claude Context](Documentation/CLAUDE.md)** - Contexto técnico para IA

### Documentos Técnicos Específicos
- **[Estructura Proyecto](Documentation/PROJECT_STRUCTURE.md)** - Organización del código
- **[Gestión Cursos](Documentation/COURSE_MANAGEMENT.md)** - Sistema educativo
- **[WorkItems](Documentation/WORKITEMS_DOCUMENTATION.md)** - Elementos de trabajo

## 🚨 Información Importante

### **Credenciales de Prueba**
```
Usuario: admin
Contraseña: admin123
Rol: administrador
```

### **Puertos Estándar**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5251`
- Base de datos: `Data/ccpvj.db`

### **Comandos Útiles**
```bash
# Frontend
cd Front/
npm run dev               # Servidor de desarrollo
npm run build             # Build producción
npm run check             # Verificar TypeScript
npm run test              # Ejecutar pruebas frontend

# Backend
cd Back/
dotnet build              # Compilar
dotnet test               # Ejecutar tests
```

## 🔄 Flujo de Desarrollo

1. **Desarrollar**: Usar frontend en `http://localhost:5173`
2. **Probar**: APIs disponibles en ambos puertos
3. **Base de datos**: SQLite en `Data/ccpvj.db`
4. **Documentar**: Actualizar archivos en `Documentation/`

## 🤝 Contribuir

1. Fork del repositorio
2. Crear branch para tu feature
3. Desarrollar y probar cambios
4. Actualizar documentación si es necesario
5. Pull request con descripción detallada

## 🎥 Sistema Multimedia

### 📂 Ubicación de Archivos
**⚠️ IMPORTANTE**: Los archivos multimedia se almacenan en `Back/Data/media/`, **NO** en `Data/media/`

```
Back/Data/media/
├── library/                         # Biblioteca Digital
│   └── {itemId}_{timestamp}_{nombre}.ext
├── material-apoyo/                  # Material de Apoyo
│   └── {id}/
│       ├── banner.jpg               # Imagen de portada
│       └── modules/{moduleId}/
│           └── posts/{postId}/
│               ├── images/          # Imágenes del post
│               ├── videos/          # Videos del post
│               └── audios/          # Audios del post
└── blog/                            # Blog y Noticias
    └── {postId}/
        ├── images/
        ├── videos/
        └── audios/
```

### 📋 Especificaciones
- **Formatos soportados**:
  - Imágenes: JPG, PNG, WebP, GIF
  - Videos: MP4, WebM, AVI
  - Audio: MP3, WAV, OGG
  - Documentos: PDF, DOC, DOCX, TXT
- **Límites de tamaño**:
  - Imágenes: 20MB
  - Videos: 20GB (para películas educativas)
  - Audio: 100MB
  - Documentos: 20GB
- **Limpieza automática**: Eliminación de archivos huérfanos cada hora
- **Eliminación en cascada**: Al eliminar contenido, se eliminan automáticamente los archivos físicos asociados
- **Nginx compatible**: Para uploads grandes en producción

---

## 📞 Contacto

Proyecto desarrollado para el Centro Cultural Víctor Jara - Bogotá, Colombia.

**Estado**: ✅ Sistema completamente funcional (Octubre 2025)
