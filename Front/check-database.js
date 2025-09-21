// Script para verificar la estructura actual de la base de datos
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function checkDatabase() {
    try {
        console.log('🔍 Verificando estructura actual de la base de datos...\n');

        // 1. Listar todas las tablas
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        console.log('📋 TABLAS EXISTENTES:');
        tables.rows.forEach(row => {
            console.log(`   • ${row.name}`);
        });

        // 2. Verificar si existe tabla Usuario (backend .NET)
        const usuarioCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Usuario'");
        console.log(`\n👤 Tabla "Usuario" (backend .NET): ${usuarioCheck.rows.length > 0 ? '✅ EXISTE' : '❌ NO EXISTE'}`);

        // 3. Verificar si existe tabla user (frontend)
        const userCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'");
        console.log(`👤 Tabla "user" (frontend): ${userCheck.rows.length > 0 ? '✅ EXISTE' : '❌ NO EXISTE'}`);

        // 4. Verificar si existe tabla Rol
        const rolCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Rol'");
        console.log(`🔐 Tabla "Rol": ${rolCheck.rows.length > 0 ? '✅ EXISTE' : '❌ NO EXISTE'}`);

        // 5. Si Usuario existe, mostrar su estructura
        if (usuarioCheck.rows.length > 0) {
            console.log('\n📊 ESTRUCTURA DE TABLA "Usuario":');
            const usuarioStructure = await client.execute("PRAGMA table_info(Usuario)");
            usuarioStructure.rows.forEach(col => {
                console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
            });

            // Mostrar usuarios existentes
            const usuarios = await client.execute("SELECT IdUsuario, NombreUsuario, IdRol FROM Usuario LIMIT 5");
            console.log('\n👥 USUARIOS EXISTENTES:');
            if (usuarios.rows.length > 0) {
                usuarios.rows.forEach(user => {
                    console.log(`   ID: ${user.IdUsuario}, Usuario: ${user.NombreUsuario}, Rol: ${user.IdRol}`);
                });
            } else {
                console.log('   (sin usuarios)');
            }
        }

        // 6. Si user existe, mostrar su estructura
        if (userCheck.rows.length > 0) {
            console.log('\n📊 ESTRUCTURA DE TABLA "user":');
            const userStructure = await client.execute("PRAGMA table_info(user)");
            userStructure.rows.forEach(col => {
                console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
            });
        }

        // 7. Verificar tablas de cursos
        const courseCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Course'");
        const courseLowerCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='course'");

        console.log(`\n📚 Tabla "Course" (backend .NET): ${courseCheck.rows.length > 0 ? '✅ EXISTE' : '❌ NO EXISTE'}`);
        console.log(`📚 Tabla "course" (frontend): ${courseLowerCheck.rows.length > 0 ? '✅ EXISTE' : '❌ NO EXISTE'}`);

    } catch (error) {
        console.error('❌ Error verificando base de datos:', error);
    } finally {
        client.close();
    }
}

checkDatabase().then(() => {
    console.log('\n🎉 Verificación completada');
    process.exit(0);
});