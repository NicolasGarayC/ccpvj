# 🎬 Corrección de Gestión Multimedia - Deployment

## 📋 Problema Identificado

### Inconsistencias de Rutas Entre Desarrollo y Producción

**Antes de la corrección:**

| Componente | Desarrollo | Producción (Configurada) | Producción (Real) |
|------------|-----------|--------------------------|-------------------|
| Upload endpoints | `Data/media/` (relativa) | ❌ Sin configurar | Variable según CWD |
| Media serving | `../Back/Data/media/` (relativa) | ❌ Sin configurar | Variable según CWD |
| Nginx | N/A | `/var/www/centro-cultural/media/` | ✅ Configurado |

**Problemas:**
1. ❌ Rutas relativas que dependen del `process.cwd()` (no portables)
2. ❌ Nginx configurado para servir desde ruta diferente a donde se guardan
3. ❌ Sin variable de entorno para configurar ruta de medios
4. ❌ Deployment no copia/sincroniza archivos a la ubicación correcta

---

## ✅ Solución Implementada

### 1. Nuevo Módulo de Rutas Centralizadas

**Archivo:** `/Front/src/lib/server/utils/media-paths.ts`

```typescript
import path from 'path';
import { env } from '$env/dynamic/private';

export function getMediaDir(): string {
    if (env.MEDIA_DIR) {
        return path.resolve(env.MEDIA_DIR);
    }
    // Default para desarrollo
    return path.resolve(process.cwd(), '../Back/Data/media');
}
```

**Beneficios:**
- ✅ Configuración centralizada
- ✅ Compatible con variables de entorno
- ✅ Fallback inteligente para desarrollo
- ✅ Rutas absolutas resueltas correctamente

---

### 2. Archivos Actualizados

#### Endpoint de Servicio de Medios
**Archivo:** `/Front/src/routes/media/[...path]/+server.ts`

**Antes:**
```typescript
const MEDIA_DIR = path.resolve(process.cwd(), '../Back/Data/media');
```

**Después:**
```typescript
import { getMediaDir } from '$lib/server/utils/media-paths';
const MEDIA_DIR = getMediaDir();
```

#### Endpoints de Upload
**Archivos actualizados:**
- `/Front/src/routes/api/upload/images/+server.ts`
- `/Front/src/routes/api/upload/videos/+server.ts`

**Antes:**
```typescript
const UPLOAD_DIR = 'Data/media/image';  // Ruta relativa
```

**Después:**
```typescript
import { getMediaDir } from '$lib/server/utils/media-paths';

const mediaDir = getMediaDir();
const uploadDir = path.join(mediaDir, 'image');
```

---

### 3. Configuración de Variables de Entorno

#### Desarrollo (.env)
```bash
# Opcional - se auto-detecta desde estructura del proyecto
# MEDIA_DIR=/home/user/ccpvj/Back/Data/media
```

#### Producción (.env.production)
```bash
PUBLIC_BACKEND_BASE_URL=http://localhost
DATABASE_URL=file:/var/www/centro-cultural/data/ccpvj.db

# IMPORTANTE: Configurar ruta absoluta en producción
MEDIA_DIR=/var/www/centro-cultural/Back/Data/media
```

---

### 4. Script de Deployment Actualizado

**Archivo:** `/start-app.sh`

**Cambios:**
```bash
# Líneas 43-46: Auto-configuración de MEDIA_DIR
if [ -z "${MEDIA_DIR:-}" ]; then
    export MEDIA_DIR="$BACKEND_DIR/Data/media"
fi

# Línea 113: Pasar variable al frontend en PM2
MEDIA_DIR="$MEDIA_DIR" pm2 start build/index.js --name centro-cultural-frontend

# Líneas 134-135: Mostrar ruta configurada
echo -e "\n${YELLOW}Directorio de medios:${NC}"
echo -e "  $MEDIA_DIR"
```

---

## 🚀 Instrucciones de Deployment

### Opción A: Usar Nginx para Servir Medios (RECOMENDADO)

**Ventajas:**
- ⚡ Mejor rendimiento (Nginx sirve archivos estáticos)
- 🔒 Menos carga en Node.js
- 📦 Caching optimizado

**Configuración Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend SvelteKit (maneja rutas dinámicas)
    location / {
        proxy_pass http://localhost:3000;
        # ... headers proxy ...
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5251/api/;
        # ... headers proxy ...
    }

    # IMPORTANTE: Archivos multimedia servidos directamente por Nginx
    location /media/ {
        alias /var/www/centro-cultural/Back/Data/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";

        # Security
        add_header X-Content-Type-Options nosniff;
    }
}
```

**Pasos:**
1. Configurar Nginx con la ruta correcta
2. El frontend subirá archivos a `/var/www/centro-cultural/Back/Data/media/`
3. Nginx los servirá directamente desde esa ubicación
4. ✅ No necesitas configurar `MEDIA_DIR` (Nginx intercepta las peticiones)

---

### Opción B: Usar Endpoint de SvelteKit (Alternativa)

**Cuándo usar:**
- Sin Nginx disponible
- Desarrollo local
- Necesitas tracking de descargas/analytics

**Configuración:**
1. **Crear `.env.production`:**
```bash
PUBLIC_BACKEND_BASE_URL=http://localhost
DATABASE_URL=file:/var/www/centro-cultural/data/ccpvj.db
MEDIA_DIR=/var/www/centro-cultural/Back/Data/media
```

2. **Asegurar estructura de directorios:**
```bash
sudo mkdir -p /var/www/centro-cultural/Back/Data/media
sudo chown -R $USER:$USER /var/www/centro-cultural/Back/Data/media
sudo chmod -R 755 /var/www/centro-cultural/Back/Data/media
```

3. **Ejecutar deployment:**
```bash
cd /var/www/centro-cultural
./start-app.sh
```

---

## 🧪 Verificación de Deployment

### 1. Verificar Variable de Entorno
```bash
pm2 logs centro-cultural-frontend | grep MEDIA_DIR
```

### 2. Probar Upload de Archivo
```bash
# Desde la interfaz web:
# 1. Iniciar sesión como administrador
# 2. Ir a cualquier módulo que permita upload
# 3. Subir una imagen de prueba
# 4. Verificar que se guarda en la ubicación correcta:

ls -la /var/www/centro-cultural/Back/Data/media/image/
```

### 3. Probar Servicio de Archivos
```bash
# Opción A: Con Nginx
curl -I http://tu-dominio.com/media/image/test.jpg

# Opción B: Directamente desde Node.js
curl -I http://localhost:3000/media/image/test.jpg
```

**Respuesta esperada:**
```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Cache-Control: public, max-age=31536000
```

---

## 📁 Estructura Final de Medios

```
/var/www/centro-cultural/
├── Back/
│   └── Data/
│       └── media/              ← DIRECTORIO DE MEDIOS
│           ├── image/          ← Imágenes
│           ├── video/          ← Videos
│           ├── audio/          ← Audio
│           ├── documents/      ← Documentos
│           └── library/        ← Biblioteca digital
├── Front/
│   ├── build/                  ← Build de producción
│   └── .env.production         ← Variables de entorno
└── data/
    └── ccpvj.db               ← Base de datos
```

---

## ⚠️ Consideraciones Importantes

### 1. Permisos de Archivos
```bash
# El usuario que ejecuta PM2 debe tener permisos de escritura
sudo chown -R $USER:$USER /var/www/centro-cultural/Back/Data/media
sudo chmod -R 755 /var/www/centro-cultural/Back/Data/media
```

### 2. Espacio en Disco
```bash
# Verificar espacio disponible
df -h /var/www/centro-cultural

# Monitorear uso de medios
du -sh /var/www/centro-cultural/Back/Data/media/*
```

### 3. Backup de Medios
```bash
# Crear backup periódico
tar -czf media-backup-$(date +%Y%m%d).tar.gz \
    /var/www/centro-cultural/Back/Data/media/
```

### 4. Limpieza de Archivos Huérfanos
```bash
# Usar endpoint de limpieza (requiere auth admin)
curl -X POST http://tu-dominio.com/api/cleanup/media \
    -H "Authorization: Bearer <token>"
```

---

## 🔧 Troubleshooting

### Problema: Archivos no se encuentran (404)

**Síntomas:**
- Upload funciona
- Pero al cargar imagen aparece 404

**Solución 1 - Con Nginx:**
```bash
# Verificar que Nginx tiene permisos
sudo ls -la /var/www/centro-cultural/Back/Data/media/

# Verificar configuración de Nginx
sudo nginx -t
sudo systemctl reload nginx
```

**Solución 2 - Sin Nginx:**
```bash
# Verificar que MEDIA_DIR está configurado
pm2 env centro-cultural-frontend | grep MEDIA_DIR

# Reiniciar con variable correcta
pm2 restart centro-cultural-frontend --update-env
```

### Problema: Upload falla con error de permisos

**Solución:**
```bash
# Dar permisos al directorio de medios
sudo chown -R $USER:$USER /var/www/centro-cultural/Back/Data/media
sudo chmod -R 755 /var/www/centro-cultural/Back/Data/media

# Verificar que el directorio existe
mkdir -p /var/www/centro-cultural/Back/Data/media/{image,video,audio,documents,library}
```

### Problema: Archivos se guardan en lugar incorrecto

**Diagnóstico:**
```bash
# Ver dónde se está guardando realmente
pm2 logs centro-cultural-frontend | grep "Save file"

# Verificar CWD del proceso
pm2 info centro-cultural-frontend | grep cwd
```

**Solución:**
- Asegurar que `.env.production` tiene `MEDIA_DIR` configurado
- Reiniciar PM2 con `pm2 restart all --update-env`

---

## ✅ Checklist de Deployment

- [ ] Variables de entorno configuradas en `.env.production`
- [ ] `MEDIA_DIR` apunta a ruta absoluta correcta
- [ ] Estructura de directorios creada
- [ ] Permisos de escritura configurados
- [ ] Nginx configurado (si aplica)
- [ ] Script `start-app.sh` ejecutado
- [ ] Verificado upload de prueba
- [ ] Verificado servicio de archivos
- [ ] Backup configurado

---

## 📚 Referencias

- **Documentación completa:** `/Documentation/DEPLOYMENT_UBUNTU_STEPBYSTEP.md`
- **Configuración Nginx:** Líneas 217-279 del documento de deployment
- **Script de inicio:** `/start-app.sh`
- **Utilidades de medios:** `/Front/src/lib/server/utils/media-paths.ts`

---

**Última actualización:** Octubre 2025
**Versión:** 1.0
**Estado:** ✅ CORRECCIÓN IMPLEMENTADA Y PROBADA
