// Script to create uppercase Course table for backend
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function createUppercaseCourse() {
    try {
        console.log('🔧 Creando tabla Course (mayúscula) para backend .NET...\n');

        // 1. Crear tabla Course para backend
        console.log('📝 Creando tabla Course (.NET)...');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS "Course" (
                "Id" TEXT NOT NULL PRIMARY KEY,
                "Title" TEXT NOT NULL,
                "Description" TEXT NOT NULL,
                "Subject" TEXT NOT NULL DEFAULT 'General',
                "ImagePath" TEXT,
                "IsActive" INTEGER NOT NULL DEFAULT 1,
                "IsFeatured" INTEGER NOT NULL DEFAULT 0,
                "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
                "UpdatedAt" TEXT,
                "EducatorId" INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY ("EducatorId") REFERENCES "Usuario" ("IdUsuario")
            )
        `);

        // 2. Crear tabla Module para backend
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

        console.log('✅ Tablas creadas exitosamente!');

        // 3. Verificar que las tablas se crearon
        const courseCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Course'");
        const moduleCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Module'");

        console.log(`\n📊 Tabla "Course": ${courseCheck.rows.length > 0 ? '✅ EXISTE' : '❌ NO EXISTE'}`);
        console.log(`📊 Tabla "Module": ${moduleCheck.rows.length > 0 ? '✅ EXISTE' : '❌ NO EXISTE'}`);

        // 4. Mostrar estructura de Course si existe
        if (courseCheck.rows.length > 0) {
            console.log('\n📋 ESTRUCTURA DE TABLA "Course":');
            const structure = await client.execute("PRAGMA table_info(Course)");
            structure.rows.forEach(col => {
                console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
            });

            // Verificar si tiene la columna IsFeatured
            const hasIsFeatured = structure.rows.some(col => col.name === 'IsFeatured');
            console.log(`\n✨ Columna "IsFeatured": ${hasIsFeatured ? '✅ PRESENTE' : '❌ FALTANTE'}`);
        }

        // 5. Insertar algunos datos de ejemplo
        console.log('\n📝 Insertando curso de ejemplo...');
        await client.execute(`
            INSERT OR IGNORE INTO "Course" (
                "Id",
                "Title",
                "Description",
                "Subject",
                "IsActive",
                "IsFeatured",
                "EducatorId"
            ) VALUES (
                '${crypto.randomUUID()}',
                'Curso de Ejemplo',
                'Este es un curso de ejemplo para probar la funcionalidad',
                'General',
                1,
                1,
                1
            )
        `);

        console.log('✅ Curso de ejemplo insertado');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.close();
    }
}

createUppercaseCourse().then(() => {
    console.log('\n🎉 ¡Proceso completado! Tabla Course lista para usar');
    process.exit(0);
});