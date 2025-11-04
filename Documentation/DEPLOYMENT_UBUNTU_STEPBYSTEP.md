# Guía de Despliegue - Centro Cultural Popular Víctor Jara

## Información del Documento

**Versión:** 1.0
**Fecha:** Noviembre 2025
**Estado:** Configuración validada en ambiente de producción
**Sistema Operativo:** Ubuntu 20.04 LTS o superior

## Resumen Ejecutivo

Este documento describe el proceso de despliegue de la plataforma web Centro Cultural Popular Víctor Jara en un servidor Ubuntu. La arquitectura implementada consiste en un frontend desarrollado con SvelteKit, un backend desarrollado con .NET 8, y una base de datos SQLite, todos coordinados mediante Nginx como proxy inverso y PM2 como gestor de procesos.

---

## 1. Requisitos del Sistema

### 1.1 Requisitos de Hardware
- Servidor con arquitectura x64
- Mínimo 2 GB de RAM
- Mínimo 10 GB de espacio en disco
- Conexión de red estable

### 1.2 Requisitos de Software
- Ubuntu Server 20.04 LTS o superior
- Acceso con privilegios de superusuario (sudo)
- Conexión a Internet para descarga de dependencias

### 1.3 Estructura de Directorios Requerida
- Directorio de desarrollo: `/home/user/ccpvj`
- Directorio de producción: `/var/www/centro-cultural`
- Directorio de logs: `/var/log/centro-cultural`

---

## 2. Instalación de Dependencias del Sistema

### 2.1 Actualización del Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Instalación de Paquetes Base

```bash
sudo apt install -y curl wget git nginx sqlite3 unzip
```

### 2.3 Instalación de Node.js

Se requiere la versión LTS (Long Term Support) de Node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

Verificación de la instalación:

```bash
node --version
npm --version
```

### 2.4 Instalación de .NET 8 SDK

```bash
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install -y dotnet-sdk-8.0
```

Verificación de la instalación:

```bash
dotnet --version
```

### 2.5 Instalación de PM2

PM2 (Process Manager 2) se utiliza para gestionar los procesos de Node.js y .NET:

```bash
sudo npm install -g pm2
```

Configuración de PM2 para inicio automático:

```bash
pm2 startup
```

Nota: Ejecutar el comando que PM2 indique después de ejecutar `pm2 startup`.

---

## 3. Preparación del Entorno de Producción

### 3.1 Creación de Estructura de Directorios

```bash
sudo mkdir -p /var/www/centro-cultural
sudo mkdir -p /var/log/centro-cultural
```

### 3.2 Configuración de Permisos

```bash
sudo chown -R $USER:$USER /var/www/centro-cultural
sudo chmod -R 755 /var/www/centro-cultural
```

---

## 4. Despliegue del Código Fuente

### 4.1 Sincronización de Archivos

Desde el directorio de desarrollo hacia el directorio de producción:

```bash
cd /home/user/ccpvj

sudo rsync -av \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='Front/.svelte-kit' \
  --exclude='Back/obj' \
  --exclude='Back/bin/Debug' \
  . /var/www/centro-cultural/

sudo chown -R $USER:$USER /var/www/centro-cultural
```

---

## 5. Configuración de la Base de Datos

### 5.1 Arquitectura de Base de Datos

La base de datos SQLite se mantiene en el directorio de desarrollo y se accede mediante un enlace simbólico desde `/tmp/ccpvj.db`.

**Ubicación física:** `/home/user/ccpvj/Data/ccpvj.db`
**Enlace simbólico:** `/tmp/ccpvj.db`

### 5.2 Creación del Enlace Simbólico

```bash
rm -f /tmp/ccpvj.db
ln -s /home/user/ccpvj/Data/ccpvj.db /tmp/ccpvj.db
```

### 5.3 Verificación

```bash
ls -lh /tmp/ccpvj.db
readlink -f /tmp/ccpvj.db
```

El comando `readlink` debe mostrar: `/home/user/ccpvj/Data/ccpvj.db`

---

## 6. Compilación del Backend

### 6.1 Proceso de Compilación

```bash
cd /var/www/centro-cultural/Back
dotnet build --configuration Release --no-incremental
```

### 6.2 Verificación de la Compilación

```bash
ls -lh bin/Release/net8.0/
```

Debe existir el archivo ejecutable del proyecto.

---

## 7. Compilación del Frontend

### 7.1 Instalación de Dependencias

```bash
cd /var/www/centro-cultural/Front
npm install --legacy-peer-deps
```

### 7.2 Compilación para Producción

```bash
npm run build
```

### 7.3 Verificación de la Compilación

```bash
ls -lh build/
```

Debe existir el archivo `build/index.js`.

### 7.4 Configuración de Variables de Entorno

Crear el archivo `.env` en el directorio del frontend:

```bash
cat > /var/www/centro-cultural/Front/.env << 'EOF'
PUBLIC_BACKEND_BASE_URL=
BACKEND_URL=http://192.168.68.101:5251
DATABASE_URL=file:/tmp/ccpvj.db
VITE_ALLOWED_HOSTS=ccpvj.com,www.ccpvj.com,192.168.68.101,localhost
EOF
```

**Explicación de variables:**

- `PUBLIC_BACKEND_BASE_URL`: Vacío para permitir URLs relativas y evitar problemas de CORS
- `BACKEND_URL`: URL del backend accesible desde el servidor (usar IP estática en producción)
- `DATABASE_URL`: Ruta al archivo de base de datos
- `VITE_ALLOWED_HOSTS`: Hosts permitidos cuando Vite opera en modo desarrollo

---

## 8. Configuración de PM2

### 8.1 Inicio de Servicios

El archivo de configuración PM2 está ubicado en `Infraestructure/pm2/ecosystem.config.js` y contiene la configuración para ambos servicios (frontend y backend).

```bash
pm2 start /var/www/centro-cultural/Infraestructure/pm2/ecosystem.config.js
```

### 8.2 Verificación del Estado

```bash
pm2 status
```

Ambos servicios deben aparecer con estado "online":
- `centro-cultural-backend`
- `centro-cultural-frontend`

### 8.3 Persistencia de Configuración

```bash
pm2 save
```

### 8.4 Comandos de Gestión

```bash
# Visualizar logs en tiempo real
pm2 logs

# Visualizar logs de un servicio específico
pm2 logs centro-cultural-frontend
pm2 logs centro-cultural-backend

# Reiniciar servicios
pm2 restart all
pm2 restart centro-cultural-frontend
pm2 restart centro-cultural-backend

# Detener servicios
pm2 stop all

# Eliminar servicios
pm2 delete all
```

---

## 9. Configuración de Nginx

### 9.1 Instalación de Configuración

```bash
sudo cp /home/user/ccpvj/Infraestructure/nginx/sites-available/centro-cultural.conf \
        /etc/nginx/sites-available/centro-cultural
```

### 9.2 Activación del Sitio

```bash
sudo ln -sf /etc/nginx/sites-available/centro-cultural \
            /etc/nginx/sites-enabled/centro-cultural
```

### 9.3 Desactivación del Sitio Predeterminado (Opcional)

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

### 9.4 Verificación de Configuración

```bash
sudo nginx -t
```

### 9.5 Aplicación de Cambios

```bash
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### 9.6 Características de la Configuración

La configuración de Nginx implementa:

1. **Proxy Inverso:**
   - Rutas del frontend (`/`) dirigidas al puerto 3000
   - Rutas del API (`/api/`) dirigidas al puerto 5251
   - Rutas de upload (`/upload/`) dirigidas al puerto 5251

2. **Configuración CORS:**
   - Cabeceras CORS configuradas para permitir peticiones cross-origin
   - Soporte para métodos HTTP: GET, POST, PUT, DELETE, PATCH, OPTIONS
   - Manejo de preflight requests (OPTIONS)

3. **Servicio de Archivos Multimedia:**
   - Servicio directo desde `/var/www/centro-cultural/Back/Data/media`
   - Cache de 30 días para optimización
   - Soporte para range requests (streaming y descargas parciales)
   - Tipos MIME configurados para imágenes, audio, video y documentos

4. **Límites y Timeouts:**
   - Tamaño máximo de carga: 20 GB
   - Timeout de lectura: 1800 segundos (30 minutos)
   - Timeout de envío: 1800 segundos

---

## 10. Verificación del Despliegue

### 10.1 Verificación de Puertos

```bash
netstat -tlnp | grep -E ":(80|3000|5251)"
```

O alternativamente:

```bash
ss -tlnp | grep -E ":(80|3000|5251)"
```

**Resultado esperado:**
```
tcp  0.0.0.0:80      LISTEN    nginx
tcp  0.0.0.0:3000    LISTEN    node
tcp  0.0.0.0:5251    LISTEN    dotnet
```

Nota: El backend debe escuchar en `0.0.0.0:5251` (todas las interfaces) para aceptar conexiones de red.

### 10.2 Verificación de Servicios PM2

```bash
pm2 status
```

### 10.3 Verificación de CORS

```bash
curl -X OPTIONS \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v http://localhost/api/blog 2>&1 | grep "Access-Control"
```

**Resultado esperado:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

### 10.4 Verificación del API

```bash
curl -s http://localhost/api/blog
curl -s http://localhost/api/material-apoyo/statistics
```

### 10.5 Verificación del Frontend

```bash
curl -I http://localhost
```

**Resultado esperado:** `HTTP/1.1 200 OK`

### 10.6 Verificación de Base de Datos

```bash
ls -lh /tmp/ccpvj.db
ls -lh /home/user/ccpvj/Data/ccpvj.db
```

El tamaño del archivo debe ser mayor a 0 bytes.

---

## 11. Procedimiento de Actualización

### 11.1 Script Automatizado

```bash
cd /home/user/ccpvj
git pull origin desarrollo
./Infraestructure/scripts/deploy.sh
```

El script `deploy.sh` ejecuta automáticamente:
1. Actualización del código desde Git
2. Compilación del backend en modo Release
3. Compilación del frontend para producción
4. Sincronización de archivos al directorio de producción
5. Configuración de la base de datos
6. Reinicio de servicios PM2
7. Verificación del estado del sistema

### 11.2 Actualización Manual

```bash
# 1. Actualizar código
cd /home/user/ccpvj
git pull origin desarrollo

# 2. Sincronizar a producción
sudo rsync -av \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='Front/.svelte-kit' \
  --exclude='Back/obj' \
  --exclude='Back/bin/Debug' \
  /home/user/ccpvj/ /var/www/centro-cultural/

sudo chown -R $USER:$USER /var/www/centro-cultural

# 3. Actualizar variables de entorno
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

# 6. Verificar base de datos
ls -lh /tmp/ccpvj.db

# 7. Actualizar Nginx si es necesario
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

## 12. Arquitectura del Sistema

### 12.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente (Navegador)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                      Puerto 80 (HTTP)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       Nginx                                  │
│  - Proxy inverso                                             │
│  - Configuración CORS                                        │
│  - Servicio de archivos multimedia                          │
└───────┬──────────────────┬──────────────────────────────────┘
        │                  │
        │ /                │ /api/
        │                  │
        ▼                  ▼
┌──────────────┐    ┌─────────────────┐
│   Frontend   │    │     Backend     │
│  (SvelteKit) │    │    (.NET 8)     │
│  Puerto 3000 │    │  Puerto 5251    │
│    (PM2)     │    │     (PM2)       │
└──────┬───────┘    └────────┬────────┘
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
       │            │  Enlace Simbólico:  │
       └────────────│  /tmp/ccpvj.db      │
                    └─────────────────────┘
```

### 12.2 Puertos del Sistema

| Puerto | Servicio | Acceso |
|--------|----------|--------|
| 80 | Nginx (HTTP) | Externo |
| 3000 | Frontend SvelteKit | Interno (vía Nginx) |
| 5251 | Backend .NET | Interno (vía Nginx) |

### 12.3 Ubicaciones del Sistema

| Componente | Ubicación |
|------------|-----------|
| Proyecto de Desarrollo | `/home/user/ccpvj` |
| Proyecto de Producción | `/var/www/centro-cultural` |
| Base de Datos | `/home/user/ccpvj/Data/ccpvj.db` |
| Enlace Simbólico BD | `/tmp/ccpvj.db` |
| Archivos Multimedia | `/var/www/centro-cultural/Back/Data/media` |
| Logs PM2 | `/home/user/.pm2/logs/` |
| Logs Nginx | `/var/log/nginx/` |

### 12.4 Archivos de Configuración

| Componente | Ubicación |
|------------|-----------|
| Nginx | `Infraestructure/nginx/sites-available/centro-cultural.conf` |
| PM2 | `Infraestructure/pm2/ecosystem.config.js` |
| Scripts de Despliegue | `Infraestructure/scripts/` |

---

## 13. Resolución de Problemas

### 13.1 Frontend No Responde

**Diagnóstico:**

```bash
pm2 logs centro-cultural-frontend --lines 50
netstat -tlnp | grep :3000
ls -lh /var/www/centro-cultural/Front/build/
```

**Solución:**

```bash
pm2 restart centro-cultural-frontend
```

### 13.2 Backend No Responde

**Diagnóstico:**

```bash
pm2 logs centro-cultural-backend --lines 50
netstat -tlnp | grep :5251
ls -lh /tmp/ccpvj.db
readlink -f /tmp/ccpvj.db
```

**Solución:**

```bash
pm2 restart centro-cultural-backend
```

### 13.3 Base de Datos Inaccesible

**Síntoma:** API devuelve datos vacíos o mensajes de error.

**Diagnóstico:**

```bash
ls -lh /home/user/ccpvj/Data/ccpvj.db
ls -lh /tmp/ccpvj.db
readlink -f /tmp/ccpvj.db
```

**Solución:**

```bash
rm -f /tmp/ccpvj.db
ln -s /home/user/ccpvj/Data/ccpvj.db /tmp/ccpvj.db
pm2 restart centro-cultural-backend
```

### 13.4 Errores CORS

**Diagnóstico:**

```bash
sudo nginx -t
cat /etc/nginx/sites-enabled/centro-cultural | grep "Access-Control"
readlink -f /etc/nginx/sites-enabled/centro-cultural
```

**Solución:**

```bash
sudo cp /home/user/ccpvj/Infraestructure/nginx/sites-available/centro-cultural.conf \
        /etc/nginx/sites-available/centro-cultural
sudo nginx -t
sudo systemctl reload nginx
```

### 13.5 Nginx No Inicia

**Diagnóstico:**

```bash
sudo tail -f /var/log/nginx/error.log
sudo nginx -t
sudo lsof -i :80
```

**Solución:**

```bash
sudo systemctl restart nginx
```

### 13.6 PM2 Servicios en Estado de Error

**Diagnóstico:**

```bash
pm2 logs centro-cultural-backend --lines 100
pm2 logs centro-cultural-frontend --lines 100
```

**Solución:**

```bash
pm2 delete all
pm2 start /var/www/centro-cultural/Infraestructure/pm2/ecosystem.config.js
pm2 save
```

---

## 14. Configuración de Firewall

Si se utiliza UFW (Uncomplicated Firewall):

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## 15. Consideraciones de Seguridad

### 15.1 Implementación de HTTPS

```bash
# Instalación de Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtención de certificado SSL
sudo certbot --nginx -d tu-dominio.com

# Verificación de renovación automática
sudo certbot renew --dry-run
```

### 15.2 Restricción de CORS

Para ambientes de producción, se recomienda restringir CORS a dominios específicos:

En `/etc/nginx/sites-available/centro-cultural`, cambiar:

```nginx
# De:
add_header 'Access-Control-Allow-Origin' '*' always;

# A:
add_header 'Access-Control-Allow-Origin' 'https://tu-dominio.com' always;
```

### 15.3 Gestión de Contraseñas

Las contraseñas de usuarios deben gestionarse mediante algoritmos de hash seguros como bcrypt.

---

## 16. Mantenimiento del Sistema

### 16.1 Respaldo de Base de Datos

```bash
# Crear directorio de respaldos
mkdir -p /home/user/ccpvj/Data/backups

# Crear respaldo manual
cp /home/user/ccpvj/Data/ccpvj.db \
   /home/user/ccpvj/Data/backups/ccpvj_$(date +%Y%m%d_%H%M%S).db
```

### 16.2 Monitoreo de Logs

```bash
# Logs de PM2
pm2 logs --lines 100

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor en tiempo real de PM2
pm2 monit
```

### 16.3 Variables de Entorno en Producción

**Frontend (`/var/www/centro-cultural/Front/.env`):**

```
PUBLIC_BACKEND_BASE_URL=
BACKEND_URL=http://192.168.68.101:5251
DATABASE_URL=file:/tmp/ccpvj.db
```

**Backend (configurado en `ecosystem.config.js`):**

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:5251
```

---

## 17. Parámetros Críticos del Sistema

| Componente | Parámetro | Valor | Ubicación |
|-----------|-----------|-------|-----------|
| PM2 Frontend | script | `./build/index.js` | `ecosystem.config.js` |
| PM2 Frontend | PORT | `3000` | `ecosystem.config.js` |
| PM2 Backend | ASPNETCORE_URLS | `http://0.0.0.0:5251` | `ecosystem.config.js` |
| Frontend .env | PUBLIC_BACKEND_BASE_URL | (vacío) | `/var/www/.../Front/.env` |
| Frontend .env | BACKEND_URL | `http://192.168.68.101:5251` | `/var/www/.../Front/.env` |
| Nginx | Frontend proxy | `http://127.0.0.1:3000` | `sites-available/centro-cultural` |
| Nginx | Backend proxy | `http://127.0.0.1:5251` | `sites-available/centro-cultural` |

---

## 18. Conclusiones

Este documento ha descrito el proceso completo de despliegue de la plataforma Centro Cultural Popular Víctor Jara en un servidor Ubuntu. La arquitectura implementada proporciona:

1. Separación clara entre frontend y backend
2. Gestión eficiente de procesos mediante PM2
3. Proxy inverso con Nginx para enrutamiento y optimización
4. Base de datos SQLite con arquitectura de enlace simbólico
5. Configuración CORS adecuada para comunicación cliente-servidor
6. Servicio optimizado de archivos multimedia

El sistema resultante es escalable, mantenible y apropiado para ambientes de producción.

---

## 19. Referencias

- Documentación de SvelteKit: https://kit.svelte.dev/docs
- Documentación de .NET 8: https://learn.microsoft.com/en-us/dotnet/
- Documentación de Nginx: https://nginx.org/en/docs/
- Documentación de PM2: https://pm2.keymetrics.io/docs/
- Documentación de SQLite: https://www.sqlite.org/docs.html
