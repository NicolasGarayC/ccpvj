# 🚀 Guía de Despliegue Paso a Paso - Centro Cultural PVJ

## Servidor Ubuntu - Despliegue Completo

Esta guía te llevará paso a paso para desplegar la aplicación Centro Cultural PVJ en un servidor Ubuntu con arquitectura Frontend (SvelteKit) + Backend (.NET) + Base de Datos (SQLite).

---

## 📋 Requisitos Previos

- Servidor Ubuntu 20.04+ con acceso root/sudo
- Repositorio clonado en el servidor
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
```

---

## 📁 PASO 2: Preparar Estructura de Directorios

```bash
# Crear estructura de directorios
sudo mkdir -p /var/www/centro-cultural
sudo mkdir -p /var/www/centro-cultural/data
sudo mkdir -p /var/www/centro-cultural/media
sudo mkdir -p /var/log/centro-cultural

# Cambiar permisos (reemplaza $USER con tu usuario de Ubuntu)
sudo chown -R $USER:$USER /var/www/centro-cultural
sudo chmod -R 755 /var/www/centro-cultural
```

---

## 📦 PASO 3: Copiar y Configurar el Proyecto

```bash
# Navegar al directorio del proyecto clonado
cd /ruta/a/tu/repositorio/ccpvj

# Copiar archivos al directorio de producción
sudo cp -r . /var/www/centro-cultural/
cd /var/www/centro-cultural

# Cambiar permisos
sudo chown -R $USER:$USER /var/www/centro-cultural
```

---

## 🗄️ PASO 4: Configurar la Base de Datos

```bash
# Navegar al directorio de datos
cd /var/www/centro-cultural

# Copiar base de datos existente (si existe)
cp Data/ccpvj.db /var/www/centro-cultural/data/ 2>/dev/null || echo "No se encontró BD existente, se creará una nueva"

# Si no existe, crear una nueva base de datos SQLite
touch /var/www/centro-cultural/data/ccpvj.db

# Configurar permisos para la base de datos
chmod 664 /var/www/centro-cultural/data/ccpvj.db
sudo chown $USER:www-data /var/www/centro-cultural/data/ccpvj.db
sudo chown $USER:www-data /var/www/centro-cultural/data
```

---

## ⚙️ PASO 5: Configurar el Backend .NET

### Crear archivo de configuración de producción

```bash
# Navegar al directorio del backend
cd /var/www/centro-cultural/Back

# Crear archivo de configuración de producción
cat > appsettings.Production.json << 'EOF'
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=/var/www/centro-cultural/data/ccpvj.db"
  },
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://localhost:5251"
      }
    }
  },
  "MediaSettings": {
    "BasePath": "/var/www/centro-cultural/media",
    "BaseUrl": "/media"
  }
}
EOF
```

### Compilar la aplicación

```bash
# Compilar la aplicación
dotnet build --configuration Release
dotnet publish --configuration Release --output ./publish
```

### Crear archivo de configuración PM2 para el backend

```bash
# Crear archivo de configuración PM2 para el backend
cat > ecosystem.backend.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'centro-cultural-backend',
    cwd: '/var/www/centro-cultural/Back/publish',
    script: 'dotnet',
    args: 'CentroCultural.API.dll',
    env: {
      ASPNETCORE_ENVIRONMENT: 'Production',
      ASPNETCORE_URLS: 'http://localhost:5251'
    },
    error_file: '/var/log/centro-cultural/backend-error.log',
    out_file: '/var/log/centro-cultural/backend-out.log',
    log_file: '/var/log/centro-cultural/backend.log',
    time: true
  }]
};
EOF
```

---

## 🎨 PASO 6: Configurar el Frontend SvelteKit

### Instalar dependencias y configurar

```bash
# Navegar al directorio del frontend
cd /var/www/centro-cultural/Front

# Instalar dependencias
npm install
# (El script start-app.sh también ejecuta este paso automáticamente.)

# Crear archivo de variables de entorno
# Crear archivo de variables de entorno
cat > .env.production << 'EOF'
PUBLIC_BACKEND_BASE_URL=http://localhost
DATABASE_URL=file:/var/www/centro-cultural/data/ccpvj.db
EOF

# Notas:
# - `PUBLIC_BACKEND_BASE_URL` debe apuntar a la raíz pública del backend (sin `/api` al final), por ejemplo `https://tu-dominio.com`.
# - `DATABASE_URL` apunta al archivo SQLite dentro del directorio de despliegue. Ajusta la ruta si cambias la ubicación de la base de datos.
# - Puedes usar `Front/env.production.example` como plantilla y copiarlo a `.env.production`.

```

### Compilar la aplicación SvelteKit

```bash
# Compilar la aplicación SvelteKit
# Este paso es opcional. El script de despliegue automático (PASO 8) ejecuta la build por ti.
npm run build
```

---

## 🌐 PASO 7: Configurar Nginx

### Crear configuración de Nginx

```bash
# Crear configuración de Nginx
sudo cat > /etc/nginx/sites-available/centro-cultural << 'EOF'
server {
    listen 80;
    server_name tu-dominio.com;  # Reemplaza con tu dominio o IP

    # Logs
    access_log /var/log/nginx/centro-cultural.access.log;
    error_log /var/log/nginx/centro-cultural.error.log;

    # Frontend SvelteKit
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5251/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Archivos estáticos de media
    location /media/ {
        alias /var/www/centro-cultural/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Configuración de archivos estáticos del frontend
    location /_app/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### Habilitar el sitio y reiniciar Nginx

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/centro-cultural /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## ▶️ PASO 8: Despliegue automático con `start-app.sh`

El repositorio incluye el script `start-app.sh` que automatiza la instalación de dependencias npm, la compilación de frontend y backend y el arranque en PM2. Úsalo siempre que actualices el código.

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x /var/www/centro-cultural/start-app.sh

# Ejecutar el despliegue automatizado
cd /var/www/centro-cultural
./start-app.sh

# Si ejecutas el script desde otra ruta (por ejemplo, /opt/scripts), puedes forzar
# el directorio del proyecto con:
# PROJECT_DIR_OVERRIDE=/var/www/centro-cultural ./start-app.sh
# Asegúrate de que PUBLIC_BACKEND_BASE_URL esté definido (en .env.production o en el entorno).
```

El script:
- Corre `npm install --no-audit --no-fund` antes de construir el frontend.
- Compila el backend en modo Release.
- Reinicia los procesos `centro-cultural-backend` y `centro-cultural-frontend` en PM2.
- Ejecuta `pm2 save` para persistir la configuración tras reinicios del servidor.

Al finalizar verás un resumen de procesos. Verifica que ambos servicios estén en estado `online`.

---

## ✅ PASO 9: Verificar el Despliegue

### Verificar servicios

```bash
# Verificar que los servicios estén funcionando
sudo systemctl status nginx
pm2 status

# Verificar logs
pm2 logs centro-cultural-backend --lines 50
pm2 logs centro-cultural-frontend --lines 50

# Verificar conectividad
curl http://localhost:3000  # Frontend
curl http://localhost:5251/api/  # Backend

# Verificar desde el navegador
# http://tu-ip-del-servidor o http://tu-dominio.com
```

---

## 🔧 Comandos Útiles para Administración

### Gestión de aplicaciones

```bash
# Reiniciar aplicaciones
pm2 restart centro-cultural-backend
pm2 restart centro-cultural-frontend

# Ver logs en tiempo real
pm2 logs centro-cultural-backend --follow
pm2 logs centro-cultural-frontend --follow

# Parar aplicaciones
pm2 stop centro-cultural-backend
pm2 stop centro-cultural-frontend

# Reiniciar todas las aplicaciones
pm2 restart all

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Base de datos

```bash
# Ver estado de la base de datos
sqlite3 /var/www/centro-cultural/data/ccpvj.db ".tables"

# Hacer backup de la base de datos
cp /var/www/centro-cultural/data/ccpvj.db /var/www/centro-cultural/data/ccpvj.db.backup.$(date +%Y%m%d_%H%M%S)
```

---

## 🔒 PASO 10: Configuración del Firewall (Opcional)

```bash
# Configurar UFW si lo usas
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # Para HTTPS futuro
sudo ufw allow 22/tcp   # SSH
sudo ufw enable
```

---

## 🔄 Para Futuras Actualizaciones

```bash
# Ir al directorio del proyecto y actualizar desde git
cd /var/www/centro-cultural
git pull origin desarrollo  # Ajusta la rama si usas otra en producción

# Ejecutar el script de despliegue para compilar y reiniciar servicios
./start-app.sh

# Verificar que todo funcione
pm2 status
```

---

## 🎯 Resumen del Despliegue

### **Arquitectura Final:**
- **Frontend**: SvelteKit en puerto 3000 (gestionado por PM2)
- **Backend**: .NET API en puerto 5251 (gestionado por PM2)
- **Base de Datos**: SQLite en `/var/www/centro-cultural/data/ccpvj.db`
- **Proxy**: Nginx en puerto 80 como punto de entrada

### **URLs de Acceso:**
- **Aplicación**: `http://tu-ip-del-servidor`
- **API**: `http://tu-ip-del-servidor/api/`
- **Media**: `http://tu-ip-del-servidor/media/`

### **Puntos Importantes:**
1. **Reemplaza `tu-dominio.com`** en la configuración de Nginx con tu dominio real o IP
2. **Asegúrate** de que los puertos 3000 y 5251 no estén bloqueados internamente
3. **Revisa los logs** si algo no funciona: `pm2 logs`
4. **La base de datos** se crea automáticamente cuando el backend se ejecuta por primera vez
5. **Utiliza `./start-app.sh`** después de cada actualización para recompilar y reiniciar los servicios sin pasos manuales.

---

## 🆘 Solución de Problemas Comunes

### Si el frontend no carga:
```bash
# Verificar que el proceso esté corriendo
pm2 status

# Ver logs del frontend
pm2 logs centro-cultural-frontend

# Verificar que el puerto 3000 esté disponible
netstat -tlnp | grep :3000
```

### Si el backend no responde:
```bash
# Ver logs del backend
pm2 logs centro-cultural-backend

# Verificar permisos de la base de datos
ls -la /var/www/centro-cultural/data/

# Verificar que el puerto 5251 esté disponible
netstat -tlnp | grep :5251
```

### Si Nginx no funciona:
```bash
# Verificar configuración
sudo nginx -t

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 📞 Contacto y Soporte

Para problemas específicos del despliegue, revisa:
1. Los logs de PM2: `pm2 logs`
2. Los logs de Nginx: `sudo tail -f /var/log/nginx/error.log`
3. El estado de los servicios: `pm2 status` y `sudo systemctl status nginx`

---

**¡Despliegue completado! 🎉**

Tu aplicación Centro Cultural PVJ debería estar funcionando en `http://tu-ip-del-servidor`
