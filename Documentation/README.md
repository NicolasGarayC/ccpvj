# Centro Cultural Víctor Jara - Plataforma Web Educativa

## 📌 Resumen del Proyecto

**PROYECTO EN DESARROLLO**: Plataforma web para centros culturales comunitarios diseñada para ser offline-first con arquitectura de red mesh local.

### 🎯 Objetivo
Crear una plataforma educativa y cultural para el Centro Cultural Víctor Jara en Bogotá, que funcione sin internet y permita gestionar:
- Cursos educativos organizados por materias
- Contenido multimedia contextual
- Sistema de roles diferenciados
- Blog y noticias del centro

### 🚧 Estado Actual: **EN DESARROLLO - PARCIALMENTE FUNCIONAL**

- ⚠️ **Sistema Educativo**: Frontend creado, APIs con problemas de conexión
- ⚠️ **Base de Datos**: SQLite configurada, conexión inconsistente
- ❌ **Sistema Blog**: No implementado funcionalmente
- ⚠️ **Autenticación**: Parcialmente implementada, requiere depuración
- ❌ **Multimedia Contextual**: Solo concepto documentado

## 🛠️ Tecnologías Utilizadas

### Frontend Principal
- **SvelteKit 5** - Framework web moderno
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Drizzle ORM** - Manejo de base de datos

### Base de Datos
- **SQLite** - Base de datos local (`D:/ccpvj/Data/ccpvj.db` - 278KB)
- **ORM Dual**: Drizzle (frontend) + Entity Framework (.NET backend)
- **⚠️ Problema**: Esquemas inconsistentes entre ORMs
- **Estado**: Tabla estructuras creadas, datos mínimos (2 usuarios, 0 contenido)

### Backend Opcional
- **.NET 8** - APIs REST (opcional/legacy)
- **JWT** - Autenticación (opcional)

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
dotnet run
```

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
- Esquema de base de datos
- Documentación técnica

### ⚠️ En Desarrollo/Con Problemas
- Conexión frontend-backend
- Autenticación y manejo de sesiones
- APIs funcionales de cursos
- Sistema de roles operativo

### ❌ Pendiente
- Sistema de blog funcional
- Multimedia contextual
- Testing completo
- Sistema de upload
- Documentación de usuario

## 🐛 Problemas Conocidos

### 🔴 **Críticos - Base de Datos**
1. **Esquemas Duplicados**: Tablas `work_item` (Drizzle) vs `WorkItem` (.NET) - conflicto
2. **Falta tabla `module`**: Drizzle espera `module`, solo existe `Module` (mayúscula)
3. **Roles Inconsistentes**: Schema dice "Asistente", BD tiene "Estudiante" por defecto
4. **Datos Vacíos**: Solo 2 usuarios, 0 cursos, 0 módulos, 0 elementos de trabajo

### ⚠️ **Funcionalidad**
5. **APIs no funcionan**: Endpoints fallan por problemas de schema
6. **Servicios frontend**: No conectan por inconsistencias de BD
7. **Autenticación**: Sistema parcial con errores de sesión
8. **Blog**: Completamente no funcional

## 🔜 Próximos Pasos

### **Prioridad 1: Arreglar Base de Datos**
1. **Unificar esquemas**: Resolver conflictos entre Drizzle y .NET schemas
2. **Crear tabla `module`**: Falta tabla requerida por Drizzle
3. **Corregir roles**: Unificar "Asistente" vs "Estudiante"
4. **Poblar datos**: Crear contenido de prueba

### **Prioridad 2: Funcionalidad**
5. **Depurar APIs**: Una vez arreglada BD, corregir endpoints
6. **Completar autenticación**: Sistema de sesiones funcional
7. **Implementar blog**: Desarrollo completo del módulo
8. **Testing**: Pruebas de todos los componentes

## 🤝 Contribuir al Proyecto

El proyecto está en desarrollo activo. Para contribuir:

1. Fork del repositorio
2. Crear branch para tu feature
3. Desarrollar y probar cambios
4. Pull request con descripción detallada

## 📞 Contacto

Proyecto desarrollado para el Centro Cultural Víctor Jara - Bogotá, Colombia.

---

**⚠️ Advertencia**: El proyecto NO está listo para producción. Se requiere desarrollo adicional significativo.