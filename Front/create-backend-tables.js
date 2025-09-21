// Script simplificado para crear tablas del backend .NET
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function createBackendTables() {
    try {
        console.log('🔧 Creando tablas para backend .NET...');

        // 1. Crear tabla Rol
        console.log('📝 Creando tabla Rol...');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS "Rol" (
                "IdRol" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "NombreRol" TEXT NOT NULL,
                "Descripcion" TEXT
            )
        `);

        // 2. Insertar roles por defecto
        console.log('📝 Insertando roles por defecto...');
        await client.execute(`
            INSERT OR IGNORE INTO "Rol" ("IdRol", "NombreRol", "Descripcion") VALUES
            (1, 'administrador', 'Administrador del sistema'),
            (2, 'colaborador', 'Colaborador del centro cultural'),
            (3, 'asistente', 'Asistente o usuario básico')
        `);

        // 3. Crear tabla Usuario
        console.log('📝 Creando tabla Usuario...');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS "Usuario" (
                "IdUsuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "NombreUsuario" TEXT NOT NULL UNIQUE,
                "Contrasena" TEXT NOT NULL,
                "FechaRegistro" TEXT NOT NULL,
                "Nombre" TEXT,
                "Apellido" TEXT,
                "Telefono" TEXT,
                "IdRol" INTEGER NOT NULL DEFAULT 3,
                "EsActivo" INTEGER NOT NULL DEFAULT 1,
                "FechaCreacion" TEXT NOT NULL DEFAULT (datetime('now')),
                "FechaActualizacion" TEXT,
                FOREIGN KEY ("IdRol") REFERENCES "Rol" ("IdRol")
            )
        `);

        // 4. Crear usuario admin por defecto
        console.log('📝 Creando usuario administrador...');
        await client.execute(`
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
                'admin123',
                datetime('now'),
                'Administrador',
                'Sistema',
                1,
                1
            )
        `);

        // 5. Crear tabla Course para backend
        console.log('📝 Creando tabla Course (.NET)...');
        await client.execute(`
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
            )
        `);

        // 6. Crear tabla Module para backend
        console.log('📝 Creando tabla Module (.NET)...');
        await client.execute(`
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
            )
        `);

        console.log('✅ Tablas del backend creadas exitosamente!');

        // Verificar tablas
        const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Rol', 'Usuario', 'Course', 'Module') ORDER BY name");
        console.log('📋 Tablas del backend .NET:');
        result.rows.forEach(row => {
            console.log(`   ✅ ${row.name}`);
        });

        // Verificar usuario admin
        const adminCheck = await client.execute("SELECT IdUsuario, NombreUsuario, IdRol FROM Usuario WHERE NombreUsuario = 'admin'");
        if (adminCheck.rows.length > 0) {
            console.log(`👤 Usuario admin creado: ID ${adminCheck.rows[0].IdUsuario}, Rol ${adminCheck.rows[0].IdRol}`);
            console.log('🔑 Credenciales: usuario=admin, password=admin123');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        client.close();
    }
}

createBackendTables().then(() => {
    console.log('🎉 ¡Proceso completado! Ahora puedes reiniciar el backend .NET');
    process.exit(0);
});