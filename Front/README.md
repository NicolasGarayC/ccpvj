# Sistema Educativo Mesh - Centro Cultural

Aplicación web educativa para red mesh sin conexión a internet, diseñada para soportar hasta 30 Usuario simultáneos con contenido multimedia.

## Arquitectura del Proyecto

### Tecnologías
- **Frontend**: Angular
- **Backend**: C# (.NET)
- **Base de Datos**: SQLite (local)
- **Infraestructura**: Red Mesh con router y antena independiente

### Estructura de Carpetas

```
d:\Tesis\
├── README.md
├── docs/                           # Documentación del proyecto
├── infrastructure/                 # Configuración de infraestructura
│   ├── database/                  # Scripts de BD y migraciones
│   ├── storage/                   # Almacenamiento de archivos multimedia
│   └── network/                   # Configuración de red mesh
├── back/                          # Backend C# - Arquitectura por Capas
│   ├── src/
│   │   ├── Core/                  # Capa de Dominio
│   │   │   ├── Entities/          # Entidades del dominio
│   │   │   ├── Interfaces/        # Contratos e interfaces
│   │   │   └── Services/          # Servicios de dominio
│   │   ├── Infrastructure/        # Capa de Infraestructura
│   │   │   ├── Data/              # Contexto y repositorios
│   │   │   ├── Storage/           # Manejo de archivos
│   │   │   └── Security/          # Autenticación y autorización
│   │   ├── Application/           # Capa de Aplicación
│   │   │   ├── Services/          # Servicios de aplicación
│   │   │   ├── DTOs/              # Objetos de transferencia
│   │   │   └── Validators/        # Validaciones
│   │   └── Presentation/          # Capa de Presentación
│   │       ├── Controllers/       # Controladores API
│   │       ├── Middleware/        # Middleware personalizado
│   │       └── Configuration/     # Configuración de la aplicación
│   ├── tests/                     # Pruebas unitarias e integración
│   └── docs/                      # Documentación del backend
└── front/                         # Frontend Angular - Módulos Funcionales
    ├── src/
    │   ├── app/
    │   │   ├── core/               # Servicios core y guards
    │   │   ├── shared/             # Componentes y servicios compartidos
    │   │   ├── features/           # Módulos funcionales
    │   │   │   ├── blog/           # Módulo de blog/noticias
    │   │   │   ├── courses/        # Módulo de cursos
    │   │   │   ├── auth/           # Módulo de autenticación
    │   │   │   └── forum/          # Módulo de foros
    │   │   └── layout/             # Componentes de layout
    │   ├── assets/                 # Recursos estáticos
    │   └── environments/           # Configuraciones de ambiente
    ├── docs/                       # Documentación del frontend
    └── tests/                      # Pruebas E2E

```

## Funcionalidades Principales

### Roles de Usuario
- **Estudiante**: Acceso libre a contenido, sin autenticación requerida
- **Educador**: Acceso con autenticación, capacidad de gestionar contenido

### Módulos del Sistema
1. **Blog/Noticias**: Publicación de contenido del centro cultural
2. **Gestión de Cursos**: Material de apoyo organizado por módulos
3. **Foros**: Espacios de discusión por curso
4. **Gestión de Usuario**: Autenticación para educadores

### Características Técnicas
- Soporte para 30 Usuario simultáneos
- Streaming de video optimizado para red local
- Almacenamiento local sin dependencia de internet
- Arquitectura escalable por capas

## Instalación y Configuración
comandos para levantar la app:
    dev:
        BACK: dotnet watch run
        FRONT: ng serve
## Contribución

[Pautas de contribución a completar]