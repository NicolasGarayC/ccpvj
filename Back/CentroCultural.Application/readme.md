Te ayudo a crear ejemplos completos de Postman para probar todas las funcionalidades de autenticación. Aquí tienes los requests organizados por flujo:

## 1. **LOGIN - Iniciar sesión**
```
Method: POST
URL: https://localhost:7000/api/auth/login
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "nombreUsuario": "admin",
  "contrasena": "admin123"
}
```

**Respuesta esperada:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "Ax2vF8kL9mN0pQ3sT6uW...",
  "expiresAt": "2024-12-17T10:30:00Z",
  "usuario": {
    "idUsuario": 1,
    "nombreUsuario": "admin",
    "nombre": "Administrador",
    "apellido": "Sistema",
    "telefono": "",
    "nombreRol": "Educador"
  }
}
```

---

## 2. **REFRESH TOKEN - Renovar token**
```
Method: POST
URL: https://localhost:7000/api/auth/refresh
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "refreshToken": "Ax2vF8kL9mN0pQ3sT6uW..."
}
```

**Respuesta esperada:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "Bx3wG9lM0nN1qR4tU7vX...",
  "expiresAt": "2024-12-17T10:45:00Z",
  "usuario": {
    "idUsuario": 1,
    "nombreUsuario": "admin",
    "nombre": "Administrador",
    "apellido": "Sistema",
    "telefono": "",
    "nombreRol": "Educador"
  }
}
```

---

## 3. **LOGOUT - Cerrar sesión (dispositivo actual)**
```
Method: POST
URL: https://localhost:7000/api/auth/logout
```

**Headers:**

```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body (raw JSON):**
```json
{
  "refreshToken": "Bx3wG9lM0nN1qR4tU7vX..."
}
```

**Respuesta esperada:**
```json
{
  "message": "Logout exitoso"
}
```

---

## 4. **LOGOUT ALL - Cerrar sesión en todos los dispositivos**
```
Method: POST
URL: https://localhost:7000/api/auth/logout-all
```

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:** (Vacío)

**Respuesta esperada:**
```json
{
  "message": "Logout de todos los dispositivos exitoso"
}
```

---

## 5. **ENDPOINT PROTEGIDO - Ejemplo para probar autenticación**

Primero, necesitas crear un endpoint de prueba:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CentroCultural.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TestController : ControllerBase
    {
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userName = User.FindFirst(ClaimTypes.Name)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var jti = User.FindFirst("jti")?.Value;

            return Ok(new
            {
                userId,
                userName,
                role,
                jti,
                message = "Endpoint protegido funcionando correctamente"
            });
        }
    }
}
```
```
Method: GET
URL: https://localhost:7000/api/test/profile
```

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta esperada:**
```json
{
  "userId": "1",
  "userName": "admin",
  "role": "Educador",
  "jti": "12345678-1234-5678-9abc-123456789012",
  "message": "Endpoint protegido funcionando correctamente"
}
```

---

## **COLECCIÓN COMPLETA PARA POSTMAN**

Aquí tienes la configuración JSON completa para importar en Postman:

```json
{
  "info": {
    "name": "CentroCultural Auth API",
    "description": "Colección para probar autenticación JWT con refresh tokens",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://localhost:7000"
    },
    {
      "key": "accessToken",
      "value": ""
    },
    {
      "key": "refreshToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"nombreUsuario\": \"admin\",\n  \"contrasena\": \"admin123\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "login"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const response = pm.response.json();",
              "    pm.collectionVariables.set('accessToken', response.accessToken);",
              "    pm.collectionVariables.set('refreshToken', response.refreshToken);",
              "    console.log('Tokens guardados automáticamente');",
              "}"
            ]
          }
        }
      ]
    },
    {
      "name": "2. Refresh Token",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/refresh",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "refresh"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const response = pm.response.json();",
              "    pm.collectionVariables.set('accessToken', response.accessToken);",
              "    pm.collectionVariables.set('refreshToken', response.refreshToken);",
              "    console.log('Tokens actualizados automáticamente');",
              "}"
            ]
          }
        }
      ]
    },
    {
      "name": "3. Get Profile (Protected)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/test/profile",
          "host": ["{{baseUrl}}"],
          "path": ["api", "test", "profile"]
        }
      }
    },
    {
      "name": "4. Logout",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/logout",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "logout"]
        }
      }
    },
    {
      "name": "5. Logout All Devices",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/auth/logout-all",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "logout-all"]
        }
      }
    },
    {
      "name": "6. Try Access After Logout (Should Fail)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/test/profile",
          "host": ["{{baseUrl}}"],
          "path": ["api", "test", "profile"]
        }
      }
    }
  ]
}
```

---

## **FLUJO DE PRUEBAS RECOMENDADO:**

### **Escenario 1: Flujo completo exitoso**
1. **Login** → Guarda automáticamente los tokens
2. **Get Profile** → Debe funcionar con el access token
3. **Refresh Token** → Debe generar nuevos tokens
4. **Get Profile** → Debe funcionar con el nuevo access token

### **Escenario 2: Prueba de blacklist**
1. **Login** → Obtener tokens
2. **Get Profile** → Confirmar que funciona
3. **Logout** → Agregar token a blacklist
4. **Get Profile** → Debe fallar con 401 "Token has been revoked"

### **Escenario 3: Prueba de refresh token expirado/inválido**
1. **Login** → Obtener tokens
2. **Refresh Token** con token inválido → Debe fallar con 401
3. **Refresh Token** con token válido → Debe funcionar

### **Escenario 4: Logout de todos los dispositivos**
1. **Login** desde múltiples "sesiones" (ejecutar login varias veces)
2. **Logout All** → Revocar todos los refresh tokens
3. **Refresh Token** → Debe fallar para todos los tokens previos

---

## **RESPUESTAS DE ERROR ESPERADAS:**

**401 Unauthorized (Credenciales inválidas):**
```json
{
  "message": "Credenciales inválidas"
}
```

**401 Unauthorized (Token expirado/inválido):**
```json
{
  "message": "Refresh token inválido o expirado"
}
```

**401 Unauthorized (Token en blacklist):**
```
Token has been revoked
```
