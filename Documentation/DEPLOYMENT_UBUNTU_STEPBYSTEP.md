# 🚀 Guía de Despliegue Paso a Paso - Centro Cultural PVJ

## Servidor Ubuntu - Despliegue Completo

> **Última Actualización**: 29 de Octubre 2025
> **Estado**: ✅ Configuración Probada y Funcional
> **Cambios Recientes**: Configuración PM2, Backend Network Binding, URLs Relativas Frontend

Esta guía te llevará paso a paso para desplegar la aplicación Centro Cultural PVJ en un servidor Ubuntu con arquitectura Frontend (SvelteKit) + Backend (.NET) + Base de Datos (SQLite).

---

## 📋 Requisitos Previos

- Servidor Ubuntu 20.04+ con acceso root/sudo
- Repositorio clonado en `/home/user/ccpvj`
- Conexión a internet estable

---

## 🔧 PASO 1: Configurar el Entorno del Servidor

### Actualizar el sistema e instalar dependencias básicas

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
sudo apt install -y curl wget git nginx sqlite3 unzip

# Instalar Node.js (versión LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar versiones
node --version
npm --version
```

### Instalar .NET 8 SDK

```bash
# Instalar .NET 8 SDK
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install -y dotnet-sdk-8.0

# Verificar .NET
dotnet --version
```

### Instalar PM2 para gestión de procesos

```bash
# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Configurar PM2 para iniciarse automáticamente al reiniciar
pm2 startup
# Seguir las instrucciones que aparezcan
```

---

## 📁 PASO 2: Preparar Estructura de Directorios

```bash
# Crear estructura de directorios de producción
sudo mkdir -p /var/www/centro-cultural
sudo mkdir -p /var/log/centro-cultural

# Cambiar permisos (reemplaza $USER con tu usuario de Ubuntu)
sudo chown -R $USER:$USER /var/www/centro-cultural
sudo chmod -R 755 /var/www/centro-cultural
```

---

## 📦 PASO 3: Copiar y Configurar el Proyecto

```bash
# Navegar al directorio del proyecto clonado
cd /home/user/ccpvj

# Copiar archivos al directorio de producción
sudo rsync -av --exclude='.git' --exclude='node_modules' \
  --exclude='Front/.svelte-kit' --exclude='Back/obj' \
  --exclude='Back/bin/Debug' \
  . /var/www/centro-cultural/

# Cambiar permisos
sudo chown -R $USER:$USER /var/www/centro-cultural
```

---

## 🗄️ PASO 4: Configurar la Base de Datos

**IMPORTANTE**: La base de datos se mantiene en `/home/user/ccpvj/Data/ccpvj.db` y se crea un symlink para que el backend la encuentre.

```bash
# Usar el script automatizado
cd /home/user/ccpvj
./Infraestructure/scripts/setup-database.sh

# O manualmente:
# Eliminar archivos temporales existentes
rm -f /tmp/ccpvj.db

# Crear symlink a la base de datos real
ln -s /home/user/ccpvj/Data/ccpvj.db /tmp/ccpvj.db

# Verificar el symlink
ls -lh /tmp/ccpvj.db
readlink -f /tmp/ccpvj.db  # Debe mostrar: /home/user/ccpvj/Data/ccpvj.db
```

**Estructura de Base de Datos**:
- **Ubicación real**: `/home/user/ccpvj/Data/ccpvj.db`
- **Symlink para backend**: `/tmp/ccpvj.db` → `/home/user/ccpvj/Data/ccpvj.db`

---

## ⚙️ PASO 5: Configurar el Backend .NET

### Compilar la aplicación en modo Release

```bash
# Navegar al directorio del backend
cd /var/www/centro-cultural/Back

# Compilar la aplicación en modo Release
dotnet build --configuration Release --no-incremental

# Verificar que la compilación fue exitosa
ls -lh bin/Release/net8.0/
```

---

## 🎨 PASO 6: Configurar el Frontend SvelteKit

### Instalar dependencias y compilar

```bash
# Navegar al directorio del frontend
cd /var/www/centro-cultural/Front

# Instalar dependencias
npm install --legacy-peer-deps

# Compilar la aplicación SvelteKit para producción
npm run build

# Verificar que el build fue exitoso
ls -lh build/
# Debe existir el archivo: build/index.js
```

### Configurar variables de entorno

```bash
# Crear archivo .env con configuración correcta
cat > /var/www/centro-cultural/Front/.env << 'EOF'
# Backend URL (vacío = URLs relativas en navegador, evita CORS)
PUBLIC_BACKEND_BASE_URL=

# Backend URL para server-side (solo usado en SSR)
BACKEND_URL=http://192.168.68.101:5251

# Database
DATABASE_URL=file:/tmp/ccpvj.db
EOF

# Verificar el archivo
cat /var/www/centro-cultural/Front/.env
```

**Importante**: `PUBLIC_BACKEND_BASE_URL` debe estar vacío para que el navegador use URLs relativas (`/api/...`). Nginx se encarga del proxy automáticamente, evitando problemas de CORS.

---

## 🔧 PASO 7: Configurar PM2

**IMPORTANTE**: El archivo `ecosystem.config.js` está correctamente configurado con:
- **Frontend**: Script `./build/index.js` en puerto 3000
- **Backend**: Escuchando en `0.0.0.0:5251` (acepta conexiones de red)
- **Rutas**: Apuntando a `/var/www/centro-cultural/`

```bash
# Iniciar servicios con el archivo de configuración desde producción
pm2 start /var/www/centro-cultural/Infraestructure/pm2/ecosystem.config.js

# Verificar que ambos servicios estén corriendo
pm2 status

# Guardar configuración para que persista tras reinicios
pm2 save
```

**Verificación**: Ambos servicios deben aparecer como `online`:
- `centro-cultural-backend`
- `centro-cultural-frontend`

### Comandos PM2 útiles:

```bash
# Ver estado de servicios
pm2 status

# Ver logs en tiempo real
pm2 logs centro-cultural-frontend
pm2 logs centro-cultural-backend
pm2 logs  # Todos los logs

# Reiniciar servicios
pm2 restart centro-cultural-frontend
pm2 restart centro-cultural-backend
pm2 restart all

# Detener servicios
pm2 stop centro-cultural-frontend
pm2 stop all

# Eliminar servicios
pm2 delete centro-cultural-frontend
pm2 delete all
```

---

## 🌐 PASO 8: Configurar Nginx

**IMPORTANTE**: Usa la configuración del proyecto que incluye CORS y proxy correctamente configurados.

### Instalar configuración de Nginx

```bash
# Copiar configuración desde el proyecto
sudo cp /home/user/ccpvj/Infraestructure/nginx/sites-available/centro-cultural.conf \
        /etc/nginx/sites-available/centro-cultural

# Crear symlink para habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/centro-cultural \
            /etc/nginx/sites-enabled/centro-cultural

# Eliminar configuración default (opcional)
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
sudo nginx -t

# Si la verificación es exitosa, recargar Nginx
sudo systemctl reload nginx
sudo systemctl enable nginx
```

**Verificación de configuración correcta**:
```bash
# Verificar que el proxy del frontend apunta al puerto 3000 (producción)
grep "proxy_pass.*3000" /etc/nginx/sites-available/centro-cultural
# Debe devolver: proxy_pass http://127.0.0.1:3000;

# Verificar server names configurados
grep "server_name" /etc/nginx/sites-available/centro-cultural
# Debe incluir: localhost ccpvj.com www.ccpvj.com 192.168.68.101
```

### Características de la Configuración de Nginx:

1. **Proxy Inverso**:
   - `/` → Frontend (puerto 3000)
   - `/api/` → Backend (puerto 5251)
   - `/upload/` → Backend (puerto 5251)

2. **CORS Completamente Configurado** ✅:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
   - Headers completos para preflight requests

3. **Archivos Multimedia Optimizados**:
   - Servicio directo desde `/var/www/centro-cultural/Back/Data/media`
   - Cache de 30 días
   - Range requests para videos/audio
   - CORS habilitado

4. **Límites de Tamaño**:
   - API normal: 500MB
   - Uploads: 5GB
   - Timeouts configurados (60s API, 3600s uploads)

---

## 🚀 PASO 9: Despliegue Automatizado (Recomendado)

**Para deployments futuros**, usa el script automatizado:

```bash
cd /home/user/ccpvj
./Infraestructure/scripts/deploy.sh
```

Este script ejecuta automáticamente:
1. Actualiza código desde Git (`git pull`)
2. Compila backend (.NET Release)
3. Compila frontend (SvelteKit build)
4. Sincroniza archivos a `/var/www/centro-cultural`
5. Configura base de datos (symlink)
6. Reinicia servicios PM2
7. Verifica estado

---

## ✅ PASO 10: Verificar el Despliegue

### 1. Verificar Puertos Activos

```bash
netstat -tlnp | grep -E ":(80|3000|5251)"
# o
ss -tlnp | grep -E ":(80|3000|5251)"
```

**Esperado**:
```
tcp  0.0.0.0:80      ESCUCHAR  nginx
tcp  0.0.0.0:3000    ESCUCHAR  node (frontend)
tcp  0.0.0.0:5251    ESCUCHAR  dotnet (backend)
```

**IMPORTANTE**: El backend debe escuchar en `0.0.0.0:5251` (NO `127.0.0.1:5251`) para aceptar conexiones desde equipos remotos en la red local.

### 2. Verificar Servicios PM2

```bash
pm2 status
```

Ambos servicios deben estar **online**:
- `centro-cultural-backend`
- `centro-cultural-frontend`

### 3. Verificar CORS (Crucial)

```bash
curl -X OPTIONS \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v http://localhost/api/blog 2>&1 | grep "Access-Control"
```

**Esperado**:
```
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
< Access-Control-Allow-Headers: DNT,User-Agent,...
```

### 4. Verificar API

```bash
# Obtener posts de blog
curl -s http://localhost/api/blog

# Estadísticas de material de apoyo
curl -s http://localhost/api/material-apoyo/statistics
```

### 5. Verificar Frontend

```bash
curl -I http://localhost
```

Esperado: `HTTP/1.1 200 OK`

### 6. Verificar Base de Datos

```bash
# Verificar symlink
ls -lh /tmp/ccpvj.db

# Verificar tamaño de BD
ls -lh /home/user/ccpvj/Data/ccpvj.db

# Debe ser > 0 bytes (NO debe estar vacía)
```

---

## 🔄 Para Futuras Actualizaciones

### Opción 1: Script Automatizado (Recomendado)

```bash
cd /home/user/ccpvj
git pull origin desarrollo
./Infraestructure/scripts/deploy.sh
```

### Opción 2: Actualización Manual

```bash
# 1. Actualizar código en desarrollo
cd /home/user/ccpvj
git pull origin desarrollo

# 2. Copiar a producción
sudo rsync -av --exclude='.git' --exclude='node_modules' \
  --exclude='Front/.svelte-kit' --exclude='Back/obj' \
  --exclude='Back/bin/Debug' \
  /home/user/ccpvj/ /var/www/centro-cultural/
sudo chown -R $USER:$USER /var/www/centro-cultural

# 3. Configurar .env si es necesario
cat > /var/www/centro-cultural/Front/.env << 'EOF'
PUBLIC_BACKEND_BASE_URL=
BACKEND_URL=http://192.168.68.101:5251
DATABASE_URL=file:/tmp/ccpvj.db
EOF

# 4. Compilar Backend
cd /var/www/centro-cultural/Back
dotnet build --configuration Release --no-incremental

# 5. Compilar Frontend
cd /var/www/centro-cultural/Front
npm install --legacy-peer-deps
npm run build

# 6. Verificar symlink de BD
ls -lh /tmp/ccpvj.db

# 7. Actualizar Nginx si cambió
sudo cp /home/user/ccpvj/Infraestructure/nginx/sites-available/centro-cultural.conf \
        /etc/nginx/sites-available/centro-cultural
sudo nginx -t && sudo systemctl reload nginx

# 8. Reiniciar servicios
pm2 delete all
pm2 start /var/www/centro-cultural/Infraestructure/pm2/ecosystem.config.js
pm2 save

# 9. Verificar estado
pm2 status
```

---

## 🎯 Resumen del Despliegue

### **Arquitectura Final:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet / Usuario                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                     Puerto 80 (HTTP)
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Nginx                                  │
│  - Proxy inverso                                             │
│  - CORS configurado ✅                                       │
│  - Servicio de archivos multimedia                          │
└───────┬────────────────────┬────────────────────────────────┘
        │                    │
        │ /                  │ /api/
        │                    │
        ▼                    ▼
┌───────────────┐    ┌──────────────────┐
│   Frontend    │    │     Backend      │
│  (SvelteKit)  │    │     (.NET 8)     │
│   Puerto 3000 │    │   Puerto 5251    │
│   (PM2)       │    │   (PM2)          │
└───────┬───────┘    └────────┬─────────┘
        │                     │
        │                     │ SQLite
        │                     ▼
        │            ┌─────────────────────┐
        │            │   Base de Datos     │
        │            │    ccpvj.db         │
        │            │  Ubicación Real:    │
        │            │  /home/user/ccpvj/  │
        │            │  Data/ccpvj.db      │
        │            │                     │
        │            │  Symlink Backend:   │
        └────────────│  /tmp/ccpvj.db      │
                     └─────────────────────┘
```

### **Ubicaciones Clave:**

| Componente | Ubicación |
|------------|-----------|
| **Proyecto Dev** | `/home/user/ccpvj` |
| **Proyecto Producción** | `/var/www/centro-cultural` |
| **Base de Datos** | `/home/user/ccpvj/Data/ccpvj.db` |
| **Symlink BD** | `/tmp/ccpvj.db` → BD real |
| **Multimedia** | `/var/www/centro-cultural/Back/Data/media` |
| **Logs PM2** | `/home/user/.pm2/logs/` |
| **Logs Nginx** | `/var/log/nginx/` |

### **Puertos:**
- **Nginx**: 80 (entrada principal)
- **Frontend**: 3000 (interno, via Nginx)
- **Backend**: 5251 (interno, via Nginx)

### **Archivos de Configuración:**
- **Nginx**: `Infraestructure/nginx/sites-available/centro-cultural.conf`
- **PM2**: `Infraestructure/pm2/ecosystem.config.js`
- **Scripts**: `Infraestructure/scripts/*.sh`

---

## 🐛 Solución de Problemas Comunes

### Frontend no responde

```bash
# Ver logs
pm2 logs centro-cultural-frontend --lines 50

# Verificar que el puerto 3000 esté disponible
netstat -tlnp | grep :3000

# Reiniciar
pm2 restart centro-cultural-frontend

# Ver estado del build
ls -lh /var/www/centro-cultural/Front/.svelte-kit/output/
```

### Backend no responde

```bash
# Ver logs
pm2 logs centro-cultural-backend --lines 50

# Verificar que el puerto 5251 esté disponible
netstat -tlnp | grep :5251

# Verificar conexión a BD
ls -lh /tmp/ccpvj.db
readlink -f /tmp/ccpvj.db

# Reiniciar
pm2 restart centro-cultural-backend
```

### API devuelve datos vacíos / "Error retrieving..."

**Causa**: Base de datos vacía o symlink incorrecto.

```bash
# 1. Verificar tamaño de BD
ls -lh /home/user/ccpvj/Data/ccpvj.db
# Debe ser > 0 bytes

# 2. Verificar symlink
ls -lh /tmp/ccpvj.db
readlink -f /tmp/ccpvj.db

# 3. Recrear symlink
rm -f /tmp/ccpvj.db
ln -s /home/user/ccpvj/Data/ccpvj.db /tmp/ccpvj.db

# 4. Reiniciar backend
pm2 restart centro-cultural-backend

# 5. Verificar
curl -s http://localhost/api/blog
```

### Errores CORS

**Síntoma**: El frontend no puede comunicarse con el backend.

```bash
# 1. Verificar configuración de Nginx
sudo nginx -t
cat /etc/nginx/sites-enabled/centro-cultural | grep "Access-Control"

# 2. Verificar que se use la configuración correcta
readlink -f /etc/nginx/sites-enabled/centro-cultural

# 3. Reinstalar configuración del proyecto
./Infraestructure/scripts/setup-nginx.sh

# 4. Probar CORS
curl -X OPTIONS \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v http://localhost/api/blog 2>&1 | grep "Access-Control"
```

### Nginx no inicia

```bash
# Ver logs de error
sudo tail -f /var/log/nginx/error.log

# Verificar configuración
sudo nginx -t

# Verificar que no haya otro servicio en puerto 80
sudo lsof -i :80

# Reiniciar
sudo systemctl restart nginx
```

### PM2 servicios en estado "errored"

```bash
# Ver logs detallados
pm2 logs centro-cultural-backend --lines 100
pm2 logs centro-cultural-frontend --lines 100

# Eliminar y reiniciar desde configuración
pm2 delete all
pm2 start /home/user/ccpvj/Infraestructure/pm2/ecosystem.config.js

# Guardar configuración
pm2 save
```

---

## 🔒 PASO 11: Configuración del Firewall (Opcional)

```bash
# Configurar UFW si lo usas
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # Para HTTPS futuro
sudo ufw allow 22/tcp   # SSH
sudo ufw enable
```

---

## 🔐 Consideraciones de Seguridad para Producción

### 1. Configurar HTTPS con Let's Encrypt

```bash
# Instalar certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado (reemplaza tu-dominio.com)
sudo certbot --nginx -d tu-dominio.com

# Renovación automática (ya configurado por defecto)
sudo certbot renew --dry-run
```

### 2. Restringir CORS a dominio específico

Editar `/etc/nginx/sites-available/centro-cultural`:

```nginx
# Cambiar de:
add_header 'Access-Control-Allow-Origin' '*' always;

# A:
add_header 'Access-Control-Allow-Origin' 'https://tu-dominio.com' always;
```

### 3. Configurar contraseñas fuertes

```bash
# Cambiar contraseñas de usuarios en la base de datos
# Usar bcrypt o similar para hashear contraseñas
```

---

## 📝 Notas Adicionales

### Backup de Base de Datos

```bash
# Crear backup manual
cp /home/user/ccpvj/Data/ccpvj.db \
   /home/user/ccpvj/Data/backups/ccpvj_$(date +%Y%m%d_%H%M%S).db

# Crear directorio de backups si no existe
mkdir -p /home/user/ccpvj/Data/backups

# Script de backup automático (opcional)
# Agregar a crontab: 0 2 * * * /path/to/backup-script.sh
```

### Logs y Monitoreo

```bash
# Logs de PM2
pm2 logs --lines 100

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitoreo en tiempo real de PM2
pm2 monit
```

### Variables de Entorno Importantes

```bash
# Frontend (/var/www/centro-cultural/Front/.env)
PUBLIC_BACKEND_BASE_URL=          # Vacío = URLs relativas (evita CORS)
BACKEND_URL=http://192.168.68.101:5251  # Solo para server-side (SSR)
DATABASE_URL=file:/tmp/ccpvj.db

# Backend (configurado en PM2 ecosystem.config.js)
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:5251  # Escucha en todas las interfaces de red
```

---

## 🎯 Configuraciones Clave del Sistema

### Resumen de Parámetros Críticos

| Componente | Parámetro | Valor Correcto | Ubicación |
|-----------|-----------|----------------|-----------|
| **PM2 Frontend** | script | `./build/index.js` | `ecosystem.config.js` |
| **PM2 Frontend** | PORT | `3000` | `ecosystem.config.js` |
| **PM2 Backend** | ASPNETCORE_URLS | `http://0.0.0.0:5251` | `ecosystem.config.js` |
| **Frontend .env** | PUBLIC_BACKEND_BASE_URL | (vacío) | `/var/www/.../Front/.env` |
| **Frontend .env** | BACKEND_URL | `http://192.168.68.101:5251` | `/var/www/.../Front/.env` |
| **Nginx** | Frontend proxy | `http://127.0.0.1:3000` | `sites-available/centro-cultural` |
| **Nginx** | Backend proxy | `http://127.0.0.1:5251` | `sites-available/centro-cultural` |
| **Nginx** | Server names | `localhost ccpvj.com www.ccpvj.com 192.168.68.101` | `sites-available/centro-cultural` |

### Puertos del Sistema

```
Puerto 80    → Nginx (entrada principal HTTP)
Puerto 3000  → Frontend SvelteKit (interno, via Nginx)
Puerto 5251  → Backend .NET (interno, via Nginx)
```

### Flujo de Datos

```
Usuario (Navegador)
    ↓
    http://ccpvj.com (puerto 80)
    ↓
Nginx (proxy inverso)
    ├─→ / → Frontend (localhost:3000)
    └─→ /api/ → Backend (localhost:5251)
         ↓
    SQLite Database (/tmp/ccpvj.db)
```

---

## 📞 Contacto y Soporte

Para problemas específicos del despliegue, revisa:

1. **Logs de PM2**: `pm2 logs`
2. **Logs de Nginx**: `sudo tail -f /var/log/nginx/error.log`
3. **Estado de servicios**: `pm2 status` y `sudo systemctl status nginx`
4. **Documentación del proyecto**: `Documentation/`
5. **Configuraciones de infraestructura**: `Infraestructure/`

---

## 📚 Recursos Adicionales

- **Configuración de Nginx**: `Infraestructure/nginx/sites-available/centro-cultural.conf`
- **Configuración de PM2**: `Infraestructure/pm2/ecosystem.config.js`
- **Scripts de deployment**: `Infraestructure/scripts/`
- **Documentación completa**: `Documentation/`

---

**¡Despliegue completado! 🎉**

Tu aplicación Centro Cultural PVJ debería estar funcionando en:
- **URL principal**: `http://tu-ip-del-servidor` o `http://localhost`
- **API**: `http://tu-ip-del-servidor/api/`
- **Verificación rápida**: `curl http://localhost/api/blog`
