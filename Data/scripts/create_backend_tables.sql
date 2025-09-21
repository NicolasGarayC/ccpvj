-- Script para crear tablas que espera el backend .NET
-- Estas tablas coexistirán con las tablas del frontend

-- Tabla Rol (si no existe)
CREATE TABLE IF NOT EXISTS "Rol" (
    "IdRol" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "NombreRol" TEXT NOT NULL,
    "Descripcion" TEXT
);

-- Tabla Usuario (esquema .NET)
CREATE TABLE IF NOT EXISTS "Usuario" (
    "IdUsuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "NombreUsuario" TEXT NOT NULL UNIQUE,
    "Contrasena" TEXT NOT NULL,
    "FechaRegistro" TEXT NOT NULL,
    "Nombre" TEXT,
    "Apellido" TEXT,
    "Telefono" TEXT,
    "IdRol" INTEGER NOT NULL,
    "EsActivo" INTEGER NOT NULL DEFAULT 1,
    "FechaCreacion" TEXT NOT NULL DEFAULT (datetime('now')),
    "FechaActualizacion" TEXT,
    FOREIGN KEY ("IdRol") REFERENCES "Rol" ("IdRol")
);

-- Tabla Course (esquema .NET)
CREATE TABLE IF NOT EXISTS "Course" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Title" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Subject" TEXT NOT NULL,
    "IsActive" INTEGER NOT NULL DEFAULT 1,
    "IsFeatured" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "UpdatedAt" TEXT,
    "EducatorId" INTEGER NOT NULL,
    "ImagePath" TEXT,
    FOREIGN KEY ("EducatorId") REFERENCES "Usuario" ("IdUsuario")
);

-- Tabla Module (esquema .NET)
CREATE TABLE IF NOT EXISTS "Module" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Title" TEXT NOT NULL,
    "Description" TEXT NOT NULL DEFAULT '',
    "OrderNumber" INTEGER NOT NULL DEFAULT 0,
    "IsActive" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "UpdatedAt" TEXT,
    "CourseId" TEXT NOT NULL,
    FOREIGN KEY ("CourseId") REFERENCES "Course" ("Id")
);

-- Tabla WorkItem (esquema .NET)
CREATE TABLE IF NOT EXISTS "WorkItem" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Title" TEXT NOT NULL,
    "Description" TEXT,
    "LongText" TEXT,
    "OrderNumber" INTEGER NOT NULL DEFAULT 0,
    "IsActive" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "UpdatedAt" TEXT,
    "ModuleId" TEXT NOT NULL,
    "ImagePath" TEXT,
    "VideoPath" TEXT,
    FOREIGN KEY ("ModuleId") REFERENCES "Module" ("Id")
);

-- Tabla RefreshTokens
CREATE TABLE IF NOT EXISTS "RefreshTokens" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "Token" TEXT NOT NULL UNIQUE,
    "ExpiresAt" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "IsRevoked" INTEGER NOT NULL DEFAULT 0,
    "UserId" INTEGER NOT NULL,
    FOREIGN KEY ("UserId") REFERENCES "Usuario" ("IdUsuario")
);

-- Tabla TokenBlacklist
CREATE TABLE IF NOT EXISTS "TokenBlacklist" (
    "Id" TEXT NOT NULL PRIMARY KEY,
    "TokenJti" TEXT NOT NULL UNIQUE,
    "ExpiresAt" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "UserId" INTEGER NOT NULL,
    FOREIGN KEY ("UserId") REFERENCES "Usuario" ("IdUsuario")
);

-- Insertar roles por defecto si no existen
INSERT OR IGNORE INTO "Rol" ("IdRol", "NombreRol", "Descripcion") VALUES
(1, 'administrador', 'Administrador del sistema'),
(2, 'colaborador', 'Colaborador del centro cultural'),
(3, 'asistente', 'Asistente o usuario básico');

-- Crear usuario administrador por defecto si no existe
INSERT OR IGNORE INTO "Usuario" (
    "IdUsuario",
    "NombreUsuario",
    "Contrasena",
    "FechaRegistro",
    "Nombre",
    "Apellido",
    "IdRol",
    "EsActivo"
) VALUES (
    1,
    'admin',
    '$2a$11$5G8YkQUNqzV5Q5Q5Q5Q5QOuKqzV5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Qu', -- password: admin123
    datetime('now'),
    'Administrador',
    'Sistema',
    1,
    1
);

-- Migrar datos del esquema frontend al backend (si existen)
-- Solo si las tablas del frontend tienen datos
INSERT OR IGNORE INTO "Usuario" (
    "NombreUsuario",
    "Contrasena",
    "FechaRegistro",
    "Nombre",
    "Apellido",
    "Telefono",
    "IdRol",
    "EsActivo"
)
SELECT
    u.username,
    u.passwordHash,
    datetime(u.createdAt/1000, 'unixepoch'),
    u.nombre,
    u.apellido,
    u.telefono,
    CASE
        WHEN u.role = 'administrador' THEN 1
        WHEN u.role = 'colaborador' THEN 2
        ELSE 3
    END,
    1
FROM user u
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='user');

-- Migrar cursos si existen
INSERT OR IGNORE INTO "Course" (
    "Id",
    "Title",
    "Description",
    "Subject",
    "IsActive",
    "IsFeatured",
    "CreatedAt",
    "UpdatedAt",
    "EducatorId",
    "ImagePath"
)
SELECT
    c.id,
    c.title,
    c.description,
    c.subject,
    c.isActive,
    c.isFeatured,
    datetime(c.createdAt/1000, 'unixepoch'),
    CASE WHEN c.updatedAt IS NOT NULL THEN datetime(c.updatedAt/1000, 'unixepoch') ELSE NULL END,
    (SELECT u2.IdUsuario FROM Usuario u2 WHERE u2.NombreUsuario = (SELECT u1.username FROM user u1 WHERE u1.id = c.educatorId) LIMIT 1),
    c.imagePath
FROM course c
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='course');