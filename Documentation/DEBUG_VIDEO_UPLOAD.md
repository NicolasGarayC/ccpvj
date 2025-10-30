# 🐛 DEBUG: Error de Carga de Videos en Producción

**Fecha**: 30 Octubre 2025
**Tamaño del archivo**: 1.5GB (1481.44 MB)
**Entorno afectado**: Producción (ccpvj.com)
**Entorno funcional**: Desarrollo local (localhost:5173)

---

## 🔴 PROBLEMA

Al intentar cargar un video de 1.5GB a través del módulo de Material de Apoyo → Posts, el upload falla después de **exactamente 30 segundos** con el error:

```
TypeError: Failed to fetch
[UPLOAD-CLIENT] ❌ Upload failed after 30.18s
```

### ❌ Síntoma Crítico

**La petición NUNCA llega al servidor SvelteKit ni al backend .NET**
- ✅ Logs del navegador aparecen: `[UPLOAD-CLIENT]`
- ❌ Logs del servidor SvelteKit NO aparecen: `[UPLOAD]`
- ❌ Logs del backend .NET NO aparecen: `[BACKEND-UPLOAD]`

Esto indica que la petición está siendo **bloqueada/matada antes de llegar a la aplicación**.

---

## 📊 LOGS DEL ERROR

### En el navegador (completos):
```
[UPLOAD-CLIENT] 🚀 Starting upload at 2025-10-30T04:32:05.506Z
[UPLOAD-CLIENT] 📂 File: {name: 'pelicula.mp4', size: '1481.44 MB', type: 'video/mp4', ...}
[UPLOAD-CLIENT] 📦 Creating FormData...
[UPLOAD-CLIENT] ✅ FormData created
[UPLOAD-CLIENT] 🌐 Fetch URL: /api/upload/posts/post-ab57a7d6-47ad-4105-8c0b-b17f93d5aebb
[UPLOAD-CLIENT] ⏳ Sending fetch request...
[UPLOAD-CLIENT] ❌ Upload failed after 30.18s
TypeError: Failed to fetch
```

### En el servidor (vacíos):
```
(NO HAY LOGS - La petición nunca llega)
```

---

## 🔍 DIAGNÓSTICO ACTUAL

### Culpable Probable: **Nginx `client_body_timeout`**

El timeout de **exactamente 30 segundos** sugiere que Nginx está matando la conexión porque el cliente (navegador) está tardando más de 30s en enviar el cuerpo de la petición (el archivo de 1.5GB).

#### Configuración Actual (problema):
```nginx
# En /etc/nginx/sites-available/centro-cultural.conf
location /api/ {
    proxy_read_timeout 60s;      # ✅ OK para respuesta
    proxy_send_timeout 60s;      # ✅ OK para envío
    proxy_connect_timeout 300s;  # ✅ OK para conexión

    # ❌ FALTA: client_body_timeout (default: 60s, pero parece estar en 30s)
}
```

#### Otros Culpables Posibles:
1. **`client_body_timeout`** global de Nginx (30s)
2. **`send_timeout`** global de Nginx (30s)
3. **PM2** matando el proceso por uso de memoria
4. **Límites de buffer** de Nginx

---

## 🚀 COMANDOS DE DEBUGGING NECESARIOS

Ejecutar en el servidor de producción:

### 1. Verificar timeouts actuales de Nginx
```bash
sudo nginx -T 2>&1 | grep -i timeout
```

**Buscar específicamente:**
- `client_body_timeout`
- `client_header_timeout`
- `send_timeout`
- `proxy_read_timeout`
- `proxy_send_timeout`

### 2. Verificar configuración de body/buffer
```bash
sudo nginx -T 2>&1 | grep -i client_body
```

**Buscar:**
- `client_max_body_size` (debe ser 5G)
- `client_body_buffer_size`
- `client_body_timeout`

### 3. Ver logs en tiempo real durante upload

**Terminal 1 - Nginx:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Terminal 2 - Frontend PM2:**
```bash
pm2 logs frontend --raw
```

**Terminal 3 - Backend PM2:**
```bash
pm2 logs backend --raw
```

Luego intentar upload y observar QUÉ aparece (si es que aparece algo).

### 4. Verificar estado de PM2
```bash
pm2 list
pm2 describe frontend
pm2 describe backend
```

### 5. Verificar última compilación
```bash
ls -lh /var/www/centro-cultural/Front/build/
stat /var/www/centro-cultural/Front/build/ | grep Modify
```

---

## ✅ SOLUCIONES PROPUESTAS

### Solución 1: Aumentar Timeouts de Nginx (CRÍTICO)

```bash
# Editar configuración
sudo nano /etc/nginx/sites-available/centro-cultural.conf
```

**Agregar DENTRO del bloque `server { }` (antes de location /):**
```nginx
# Timeouts para uploads grandes
client_body_timeout 3600s;      # 1 hora para recibir body del cliente
client_header_timeout 3600s;    # 1 hora para recibir headers
send_timeout 3600s;             # 1 hora para enviar respuesta
```

**Agregar DENTRO del bloque `location /api/ { }`:**
```nginx
# Ya existen estos, verificar que sean 3600s o más:
proxy_connect_timeout 300s;
proxy_send_timeout 3600s;       # ← Cambiar de 60s a 3600s
proxy_read_timeout 3600s;       # ← Cambiar de 60s a 3600s
```

**Luego:**
```bash
# Probar configuración
sudo nginx -t

# Si es válida, recargar
sudo systemctl reload nginx
```

---

### Solución 2: Verificar Buffers de Nginx

```nginx
# En el bloque server o http
client_body_buffer_size 128k;
client_max_body_size 5G;  # Ya debe estar configurado
```

---

### Solución 3: Verificar PM2 Memory Limit

```bash
# Ver configuración actual
pm2 describe frontend | grep -i memory

# Si hay límite bajo, aumentar:
pm2 stop frontend
pm2 start /var/www/centro-cultural/Front/ecosystem.config.js --max-memory-restart 4G
```

---

## 🎯 SIGUIENTE PASO INMEDIATO

**Ejecutar en orden:**

1. ✅ **Obtener configuración actual de timeouts:**
   ```bash
   sudo nginx -T 2>&1 | grep -E "(client_body_timeout|client_header_timeout|send_timeout)" | head -10
   ```

2. ✅ **Aplicar Solución 1** (aumentar timeouts)

3. ✅ **Probar upload nuevamente**

4. ✅ **Si falla, compartir:**
   - Logs de Nginx error.log durante el upload
   - Logs de PM2 frontend durante el upload
   - Configuración completa de Nginx: `sudo nginx -T > /tmp/nginx-config.txt`

---

## 📋 ARCHIVOS MODIFICADOS CON LOGS

Ya se agregaron logs exhaustivos en:

### Frontend:
- `/home/user/ccpvj/Front/src/routes/api/upload/posts/[postId]/+server.ts` - Logs `[UPLOAD]`
- `/home/user/ccpvj/Front/src/lib/application/services/upload/ContextualUploadService.ts` - Logs `[UPLOAD-CLIENT]`

### Backend:
- `/home/user/ccpvj/Back/CentroCultural.API/Controllers/UploadController.cs` - Logs `[BACKEND-UPLOAD]`

### Configuración:
- `/home/user/ccpvj/Front/.env` - Cambiado `PUBLIC_BACKEND_BASE_URL=""` (URLs relativas)

**IMPORTANTE:** En producción necesitas:
```bash
cd /var/www/centro-cultural/Front
npm run build
pm2 restart frontend
```

---

## 🔑 INFORMACIÓN CLAVE

### Stack de Producción:
- **Nginx**: Puerto 80 (proxy reverso)
- **Frontend SvelteKit**: Puerto 3000 (PM2)
- **Backend .NET**: Puerto 5251 (PM2)
- **Dominio**: ccpvj.com

### Límites Configurados:
- **SvelteKit**: 20GB (`svelte.config.js`)
- **Backend .NET**: 20GB (`Program.cs`)
- **Nginx (actual)**: 5GB + timeouts 60s ❌ (necesita ser 3600s)

### Flujo del Upload en Producción:
```
Navegador → Nginx (puerto 80)
         → Frontend SvelteKit (puerto 3000)
         → Endpoint /api/upload/posts/[postId]
         → Streaming a disco
```

**El problema está en el primer salto: Nginx → SvelteKit**

---

## 🚨 CHECKLIST DE VERIFICACIÓN

- [ ] ¿Nginx tiene `client_body_timeout 3600s`?
- [ ] ¿Nginx tiene `proxy_read_timeout 3600s` en location /api/?
- [ ] ¿Nginx tiene `proxy_send_timeout 3600s` en location /api/?
- [ ] ¿PM2 está corriendo ambos servicios (frontend y backend)?
- [ ] ¿Frontend fue recompilado (`npm run build`) después de agregar logs?
- [ ] ¿Logs de Nginx muestran algo cuando falla el upload?
- [ ] ¿Kaspersky está deshabilitado?

---

## 📞 INFORMACIÓN PARA CONTINUAR DEBUG

Si después de aplicar Solución 1 aún falla, necesito:

1. **Salida de:** `sudo nginx -T > nginx-full-config.txt` (archivo completo)
2. **Contenido de:** `/var/log/nginx/error.log` durante el upload
3. **Salida de:** `pm2 logs frontend` durante el upload
4. **Verificar si el problema es de red:**
   ```bash
   # En el servidor, probar upload local
   curl -X POST -F "file=@/path/to/video.mp4" -F "mediaType=video" \
        -F "courseId=test" -F "moduleId=test" \
        http://localhost:3000/api/upload/posts/test-id
   ```

---

## 💡 WORKAROUND TEMPORAL

Si no puedes modificar Nginx inmediatamente, implementar **upload por chunks** (subir en pedazos de 50MB):
- Requiere cambios en frontend y backend
- Evita timeouts completamente
- Permite reanudar uploads interrumpidos
- Tiempo estimado de implementación: 2-3 horas
