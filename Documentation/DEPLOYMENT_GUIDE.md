# 🚀 Centro Cultural Víctor Jara - Guía de Despliegue Completa

## 📁 Estructura Organizacional del Proyecto

```
/home/user/ccpvj/
├── 📂 Back/                    # Backend .NET
├── 📂 Front/                   # Frontend SvelteKit
├── 📂 Data/                    # Datos y base de datos
│   ├── 📂 scripts/            # Scripts de inicialización
│   ├── 📂 media/              # Archivos multimedia contextuales
│   └── ccpvj.db              # Base de datos SQLite
├── 📂 Infraestructure/        # Configuraciones de infraestructura
│   └── 📂 nginx/             # Configuraciones NGINX
├── 📂 Documentation/          # Toda la documentación
├── 📂 tests/                  # Tests unitarios e integración
└── 📂 .git/                   # Control de versiones
```

---

## 🎯 Principios de Despliegue

### 🔧 Arquitectura Contextual
- **Multimedia contextual**: Nunca archivos huérfanos
- **Jerarquía**: Course → Module → WorkItem → MediaFiles
- **Offline-first**: Optimizado para redes mesh
- **Desarrollo + Producción**: Configuraciones separadas

### 📋 Prerrequisitos del Sistema

```bash
# Sistema base
Ubuntu/Debian Linux (recomendado)

# Dependencias principales
Node.js >= 18.x
npm >= 9.x
.NET 8 SDK
NGINX >= 1.18
SQLite3

# Herramientas adicionales
git
curl
sqlite3
```

---

## 🛠️ PASO 1: Instalación de Dependencias del Sistema

### 1.1 Actualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar Node.js y npm
```bash
# Instalar Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # >= v18.x
npm --version   # >= 9.x
```

### 1.3 Instalar .NET 8 SDK
```bash
# Agregar repositorio Microsoft
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Instalar .NET 8
sudo apt update
sudo apt install -y dotnet-sdk-8.0

# Verificar instalación
dotnet --version  # >= 8.0.x
```

### 1.4 Instalar NGINX y SQLite
```bash
sudo apt install -y nginx sqlite3

# Verificar instalación
nginx -v        # >= 1.18
sqlite3 --version
```

---

## 🏗️ PASO 2: Configuración del Proyecto

### 2.1 Clonar y Acceder al Proyecto
```bash
cd /home/user/ccpvj
```

### 2.2 Instalar Dependencias del Frontend
```bash
cd Front/

# Instalar todas las dependencias
npm install

# Verificar que todas las dependencias están instaladas
npm list --depth=0
```

### 2.3 Instalar Dependencias del Backend
```bash
cd ../Back/

# Restaurar paquetes NuGet
dotnet restore

# Verificar compilación
dotnet build
```

---

## 🗄️ PASO 3: Configuración de Base de Datos Contextual

### 3.1 Ejecutar Script de Inicialización
```bash
cd /home/user/ccpvj

# Ejecutar script contextual
chmod +x Data/scripts/init_contextual_database.sh
./Data/scripts/init_contextual_database.sh
```

**Resultado esperado:**
```
✅ Contextual database schema created successfully!
📊 Tables created: BlogCategory, BlogPost, Course, Event, MediaFile, etc.
📈 Database populated with test data
🗂️ Media directory structure created
```

### 3.2 Verificar Base de Datos
```bash
# Conectar a la base de datos
sqlite3 Data/ccpvj.db

# Verificar tablas contextuales
.tables

# Verificar datos de prueba
SELECT COUNT(*) FROM user;
SELECT COUNT(*) FROM Course;
SELECT COUNT(*) FROM BlogCategory;

# Salir
.exit
```

### 3.3 Configurar Variables de Entorno
```bash
# Crear archivo de entorno para Frontend
cat > Front/.env.local << EOF
DATABASE_URL="file:/home/user/ccpvj/Data/ccpvj.db"
NODE_ENV="development"
EOF

# Crear archivo de entorno para Backend (si es necesario)
cat > Back/.env << EOF
ConnectionStrings__DefaultConnection="Data Source=/home/user/ccpvj/Data/ccpvj.db"
Environment="Development"
EOF
```

---

## 🌐 PASO 4: Configuración de NGINX

### 4.1 Respaldar Configuración Actual
```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
sudo cp -r /etc/nginx/sites-available /etc/nginx/sites-available.backup
```

### 4.2 Aplicar Configuración del Proyecto
```bash
# Usar configuración principal del proyecto
sudo cp Infraestructure/nginx/nginx.conf /etc/nginx/nginx.conf

# Usar configuración del sitio del proyecto
sudo cp Infraestructure/nginx/sites-available/centro-cultural.conf /etc/nginx/sites-available/centro-cultural

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/centro-cultural /etc/nginx/sites-enabled/centro-cultural

# Deshabilitar sitio por defecto
sudo rm -f /etc/nginx/sites-enabled/default
```

### 4.3 Configurar Modo Desarrollo (Frontend Proxy)
```bash
# Editar configuración para desarrollo
sudo nano /etc/nginx/sites-available/centro-cultural
```

**Buscar la sección "Frontend SPA" y reemplazar con:**
```nginx
    # ==========================================
    # FRONTEND SPA - MODO DESARROLLO
    # ==========================================
    location / {
        # Proxy a servidor de desarrollo SvelteKit para hot-reload
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Soporte WebSocket para hot reloading
        proxy_set_header Connection "upgrade";
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        
        # Timeouts para desarrollo
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
```

### 4.4 Crear Directorios de Cache NGINX
```bash
# Crear directorios de cache necesarios
sudo mkdir -p /tmp/nginx-cache-static /tmp/nginx-cache-media
sudo chown -R www-data:www-data /tmp/nginx-cache-*
sudo chmod -R 755 /tmp/nginx-cache-*
```

### 4.5 Verificar y Aplicar Configuración
```bash
# Verificar sintaxis de configuración
sudo nginx -t

# Si la verificación es exitosa, recargar NGINX
sudo systemctl reload nginx

# Verificar estado de NGINX
sudo systemctl status nginx
```

---

## 🎯 PASO 5: Configuración de Estructura de Media Contextual

### 5.1 Crear Estructura de Directorios
```bash
# El script de base de datos ya creó la estructura, pero verificamos:
ls -la Data/media/
```

**Estructura esperada:**
```
Data/media/
├── courses/     # Banners de cursos
├── workitems/   # Imágenes y videos de WorkItems
├── blog/        # Multimedia de posts de blog
├── events/      # Posters de eventos
└── temp/        # Uploads temporales
    └── uploads/
        ├── courses/
        ├── workitems/
        ├── blog/
        └── events/
```

### 5.2 Configurar Permisos
```bash
# Configurar permisos para que NGINX pueda servir archivos
sudo chown -R $USER:www-data Data/media/
sudo chmod -R 755 Data/media/

# Permisos especiales para uploads temporales
sudo chmod -R 775 Data/media/temp/
```

### 5.3 Probar Servido de Media
```bash
# Crear archivos de prueba
echo "Test course image" > Data/media/courses/test-course.jpg
echo "Test workitem image" > Data/media/workitems/test-workitem.png
echo "Test blog image" > Data/media/blog/test-blog.jpg
echo "Test event poster" > Data/media/events/test-event.jpg
```

---

## ⚡ PASO 6: Inicialización de Servicios

### 6.1 Terminal 1 - Frontend SvelteKit (Desarrollo)
```bash
cd /home/user/ccpvj/Front/

# Configurar variable de entorno
export DATABASE_URL="file:/home/user/ccpvj/Data/ccpvj.db"

# Verificar que Drizzle puede conectar
npm run db:studio & 
# Esto abre Drizzle Studio en http://localhost:4983

# Iniciar servidor de desarrollo
npm run dev -- --host 0.0.0.0 --port 5173

# ✅ El frontend estará disponible en: http://localhost:5173
# ✅ Pero accederás vía NGINX en: http://localhost
```

### 6.2 Terminal 2 - Backend .NET (Opcional)
```bash
cd /home/user/ccpvj/Back/

# Iniciar API backend
dotnet run --urls="http://localhost:5000"

# ✅ El backend estará disponible en: http://localhost:5000
# ✅ Las APIs se acceden vía NGINX en: http://localhost/api/*
```

### 6.3 Terminal 3 - Monitoreo y Testing
```bash
# Verificar servicios corriendo
sudo systemctl status nginx
curl -I http://localhost/

# Verificar logs de NGINX
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🧪 PASO 7: Testing y Validación

### 7.1 Test de Conectividad
```bash
# Test principal - aplicación via NGINX
curl -I http://localhost/
# Esperado: HTTP/1.1 200 OK

# Test directo SvelteKit (bypass NGINX)
curl -I http://localhost:5173/
# Esperado: HTTP/1.1 200 OK

# Test backend directo
curl -I http://localhost:5000/
# Esperado: HTTP/1.1 200 OK o HTTP/1.1 404 (dependiendo de ruta)
```

### 7.2 Test de Autenticación
```bash
# Test endpoint de autenticación
curl http://localhost/api/auth/status

# Test base de datos via API
curl http://localhost/api/test-auth
```

### 7.3 Test de Media Files
```bash
# Test servido contextual de media files
curl -I http://localhost/media/courses/test-course.jpg
curl -I http://localhost/media/workitems/test-workitem.png
curl -I http://localhost/media/blog/test-blog.jpg
curl -I http://localhost/media/events/test-event.jpg

# Todos deberían retornar: HTTP/1.1 200 OK
```

### 7.4 Test de Login Contextual
1. **Abrir navegador**: http://localhost/auth/login
2. **Credenciales de prueba**:
   - **Admin**: `admin` / `admin123`
   - **Estudiante**: `estudiante` / `student123`
3. **Probar login**: Debería redirigir a dashboard
4. **Verificar dashboard**: http://localhost/dashboard

### 7.5 Test de Base de Datos Contextual
```bash
# Conectar a base de datos
sqlite3 Data/ccpvj.db

# Test views contextuales
SELECT * FROM CourseWithMedia LIMIT 5;
SELECT * FROM WorkItemWithMedia LIMIT 5;
SELECT * FROM BlogPostWithMedia LIMIT 5;
SELECT * FROM EventWithMedia LIMIT 5;

# Test conteos
SELECT 
    'Courses' as Entity, COUNT(*) as Count FROM Course
UNION ALL SELECT 
    'Modules', COUNT(*) FROM Module
UNION ALL SELECT 
    'WorkItems', COUNT(*) FROM WorkItem
UNION ALL SELECT 
    'BlogPosts', COUNT(*) FROM BlogPost
UNION ALL SELECT 
    'Events', COUNT(*) FROM Event;

.exit
```

---

## 🔄 PASO 8: Workflow de Desarrollo

### 8.1 Desarrollo Frontend
```bash
cd Front/

# Hacer cambios en src/routes/**, src/lib/**
# Los cambios se reflejan automáticamente en http://localhost

# Regenerar base de datos si cambias schema
npm run db:push

# Ver base de datos
npm run db:studio
```

### 8.2 Desarrollo Backend
```bash
cd Back/

# Hacer cambios en controladores, servicios, etc.
# Reiniciar con Ctrl+C y luego:
dotnet run --urls="http://localhost:5000"
```

### 8.3 Testing Continuo
```bash
# Frontend tests
cd Front/
npm run test

# Linting
npm run lint

# Type checking
npm run check
```

---

## 🛡️ PASO 9: Configuración de Producción

### 9.1 Build del Frontend
```bash
cd Front/

# Compilar para producción
npm run build

# Verificar build
ls -la build/
```

### 9.2 Revertir NGINX a Modo Producción
```bash
# Editar configuración
sudo nano /etc/nginx/sites-available/centro-cultural
```

**Reemplazar sección frontend con:**
```nginx
    # ==========================================
    # FRONTEND SPA - MODO PRODUCCIÓN
    # ==========================================
    location / {
        root /home/user/ccpvj/Front/build;
        try_files $uri $uri/ /index.html;
        
        # Cache diferenciado por tipo
        location ~* \.(css|js)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            gzip_static on;
        }
        
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, must-revalidate";
            etag on;
        }
        
        # Index.html sin cache (SPA)
        location = /index.html {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
```

### 9.3 Aplicar Cambios de Producción
```bash
# Verificar configuración
sudo nginx -t

# Recargar NGINX
sudo systemctl reload nginx
```

---

## 📊 PASO 10: URLs y Endpoints de Acceso

### 🌐 URLs Principales
- **🏠 Aplicación Principal**: http://localhost
- **🔐 Login**: http://localhost/auth/login
- **📊 Dashboard**: http://localhost/dashboard
- **📚 Blog**: http://localhost/blog
- **🎓 Cursos**: http://localhost/courses

### 🔌 APIs Backend
- **🔐 Autenticación**: http://localhost/api/auth/*
- **📚 Cursos**: http://localhost/api/courses/*
- **📝 Blog**: http://localhost/api/blog/*
- **🎪 Eventos**: http://localhost/api/events/*
- **📁 Upload**: http://localhost/api/upload/*

### 📁 Media Files
- **🎓 Cursos**: http://localhost/media/courses/*
- **📚 WorkItems**: http://localhost/media/workitems/*
- **📝 Blog**: http://localhost/media/blog/*
- **🎪 Eventos**: http://localhost/media/events/*

### 🛠️ Herramientas de Desarrollo
- **📊 Database Studio**: http://localhost:4983 (solo desarrollo)
- **⚡ SvelteKit Direct**: http://localhost:5173 (solo desarrollo)
- **🔧 Backend Direct**: http://localhost:5000 (solo desarrollo)

---

## 🚨 Troubleshooting Común

### ❌ Error: "NGINX failed to start"
```bash
# Verificar sintaxis
sudo nginx -t

# Verificar puertos en uso
sudo netstat -tlnp | grep :80

# Ver logs de error
sudo tail -f /var/log/nginx/error.log

# Reiniciar NGINX
sudo systemctl restart nginx
```

### ❌ Error: "Database connection failed"
```bash
# Verificar que la base de datos existe
ls -la Data/ccpvj.db

# Verificar permisos
chmod 664 Data/ccpvj.db

# Reinicializar base de datos
./Data/scripts/init_contextual_database.sh
```

### ❌ Error: "SvelteKit won't start"
```bash
cd Front/

# Limpiar node_modules
rm -rf node_modules package-lock.json
npm install

# Verificar variable de entorno
echo $DATABASE_URL

# Verificar puerto disponible
netstat -tlnp | grep :5173
```

### ❌ Error: "Media files not served"
```bash
# Verificar permisos de media
sudo chown -R $USER:www-data Data/media/
sudo chmod -R 755 Data/media/

# Verificar configuración NGINX
sudo nginx -t

# Crear archivos de prueba
echo "test" > Data/media/courses/test.jpg
curl -I http://localhost/media/courses/test.jpg
```

### ❌ Error: ".NET backend issues"
```bash
cd Back/

# Verificar instalación .NET
dotnet --version

# Limpiar y restaurar
dotnet clean
dotnet restore
dotnet build

# Verificar puerto
netstat -tlnp | grep :5000
```

---

## 📈 Monitoreo de Performance

### 📊 Métricas Clave
```bash
# Uso de CPU y memoria
htop

# Espacio en disco (importante para multimedia)
df -h
du -sh Data/media/*

# Conexiones NGINX
sudo netstat -plan | grep :80 | wc -l

# Logs de acceso
sudo tail -f /var/log/nginx/access.log | grep -v "\.css\|\.js\|\.ico"
```

### 🔍 Health Checks
```bash
# Script de health check
cat > health_check.sh << 'EOF'
#!/bin/bash
echo "=== Centro Cultural Víctor Jara - Health Check ==="
echo "NGINX Status: $(systemctl is-active nginx)"
echo "Database Size: $(ls -lh Data/ccpvj.db | awk '{print $5}')"
echo "Media Files: $(find Data/media -type f | wc -l)"
echo "Frontend Response: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/)"
echo "API Response: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/auth/status)"
EOF

chmod +x health_check.sh
./health_check.sh
```

---

## 🎉 Indicadores de Éxito

### ✅ Tu aplicación funciona correctamente cuando:

1. **🌐 Acceso Principal**: http://localhost carga la aplicación
2. **🔐 Autenticación**: Login funciona con credenciales de prueba
3. **📊 Dashboard**: Dashboard se carga después del login
4. **🗄️ Base de Datos**: SQLite responde con datos contextuales
5. **📁 Media Files**: Archivos multimedia se sirven correctamente
6. **⚡ Hot Reload**: Cambios en código se reflejan automáticamente
7. **🔌 APIs**: Endpoints responden correctamente via NGINX
8. **📈 Performance**: Aplicación responde rápido para uso offline

### 🎯 Comandos de Verificación Final:
```bash
# Verificación completa
curl -I http://localhost/                           # ✅ 200 OK
curl http://localhost/api/auth/status               # ✅ JSON response
curl -I http://localhost/media/courses/test.jpg     # ✅ 200 OK (si existe)
sqlite3 Data/ccpvj.db "SELECT COUNT(*) FROM user;" # ✅ > 0

echo "🚀 ¡Centro Cultural Víctor Jara está listo para desarrollo!"
```

---

## 📚 Referencias Adicionales

- **📖 Documentación Completa**: `/Documentation/README.md`
- **🔧 Configuración NGINX**: `/Infraestructure/nginx/`
- **🗄️ Schema Base de Datos**: `/Data/database_tables_contextual_fixed.sql`
- **📱 WorkItems Guide**: `/Documentation/WORKITEMS_DOCUMENTATION.md`
- **🎨 Frontend Components**: `/Front/src/lib/components/`

¡Tu plataforma contextual offline está lista para desarrollo y producción! 🎉