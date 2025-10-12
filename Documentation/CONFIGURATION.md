# Configuración del Sistema de Archivos

Este documento explica cómo configurar las rutas del sistema de archivos multimedia para diferentes entornos.

## Variables de Entorno

### `PROJECT_ROOT`
Ruta base donde se encuentra el proyecto (sin barra diagonal final).

**Ejemplos por plataforma:**
- **Windows**: `D:`
- **Linux**: `/var/www`
- **macOS**: `/Users/username`
- **Docker**: `/app`

### Estructura de Directorios

El sistema utiliza la siguiente estructura consistente:
```
${PROJECT_ROOT}/ccpvj/Data/
├── ccpvj.db                    # Base de datos SQLite
└── var/www/media/              # Archivos multimedia
    ├── image/                  # Imágenes
    ├── video/                  # Videos
    ├── audio/                  # Audio
    ├── posts/                  # Media de posts
    │   ├── image/
    │   ├── video/
    │   └── audio/
    └── temp/uploads/           # Archivos temporales nginx
        ├── images/
        ├── videos/
        └── audio/
```

## Configuración por Entorno

### Desarrollo (Windows)
```bash
# Front/.env
PROJECT_ROOT=D:
```

### Producción (Linux)
```bash
# Front/.env
PROJECT_ROOT=/var/www
```

### Docker
```bash
# Front/.env
PROJECT_ROOT=/app
```

## Configuración de Nginx

### Generar Configuración
Usa el script para generar la configuración de nginx:

```bash
# Para Windows
node scripts/generate-nginx-config.js "D:"

# Para Linux
node scripts/generate-nginx-config.js "/var/www"

# Para Docker
node scripts/generate-nginx-config.js "/app"
```

### Aplicar Configuración
1. Ejecuta el script de generación
2. Copia el archivo generado a tu configuración de nginx
3. Reinicia nginx

## Migración

### Desde Sistema Anterior
Si vienes del sistema anterior con rutas hard-coded:

1. **Actualizar variables de entorno:**
   ```bash
   # Editar Front/.env
   PROJECT_ROOT=tu_ruta_base
   ```

2. **Generar nueva configuración nginx:**
   ```bash
   node scripts/generate-nginx-config.js "tu_ruta_base"
   ```

3. **Verificar directorios:**
   ```bash
   # El sistema creará automáticamente la estructura necesaria
   ```

### Archivos Legacy
El sistema incluye compatibilidad con archivos anteriores en `static/uploads/`. Los archivos antiguos se limpiarán automáticamente cuando se suban nuevos archivos.

## Verificación

### Backend
- Verifica que `DATABASE_URL` esté correctamente configurada
- Los logs deben mostrar la ruta base en uso

### Frontend
- Los archivos se guardan en `${PROJECT_ROOT}/ccpvj/Data/var/www/media/`
- Las rutas web son `/media/{tipo}/{archivo}`

### Nginx
- Los archivos estáticos se sirven desde `${PROJECT_ROOT}/ccpvj/Data/var/www/media/`
- Los uploads temporales van a `${PROJECT_ROOT}/ccpvj/Data/var/www/media/temp/uploads/`

## Solución de Problemas

### Error: "File not found"
- Verifica que `PROJECT_ROOT` esté configurada
- Confirma que los directorios existen
- Revisa permisos de escritura

### Error: "Access denied"
- Verifica permisos del directorio
- En Linux/macOS: `chmod 755 ${PROJECT_ROOT}/ccpvj/Data/`
- En Docker: configura volúmenes correctamente

### Nginx no sirve archivos
- Regenera la configuración con el script
- Verifica que las rutas en nginx coincidan con `PROJECT_ROOT`
- Reinicia nginx después de aplicar la configuración