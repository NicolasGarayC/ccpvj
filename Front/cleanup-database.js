// Script para limpiar base de datos: eliminar tabla Usuario duplicada
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function cleanupDatabase() {
    try {
        console.log('🧹 LIMPIANDO BASE DE DATOS...\n');

        // 1. Verificar qué tablas vamos a eliminar
        console.log('📋 Verificando tablas a eliminar:');

        const usuarioCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Usuario'");
        const rolCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Rol'");

        console.log(`   - Tabla "Usuario": ${usuarioCheck.rows.length > 0 ? '✅ EXISTE (será eliminada)' : '❌ NO EXISTE'}`);
        console.log(`   - Tabla "Rol": ${rolCheck.rows.length > 0 ? '✅ EXISTE (será eliminada)' : '❌ NO EXISTE'}`);

        // 2. Eliminar tabla Usuario (backend duplicado)
        if (usuarioCheck.rows.length > 0) {
            console.log('\n🗑️  Eliminando tabla "Usuario"...');
            await client.execute('DROP TABLE IF EXISTS "Usuario"');
            console.log('✅ Tabla "Usuario" eliminada');
        }

        // 3. Eliminar tabla Rol (backend duplicado)
        if (rolCheck.rows.length > 0) {
            console.log('🗑️  Eliminando tabla "Rol"...');
            await client.execute('DROP TABLE IF EXISTS "Rol"');
            console.log('✅ Tabla "Rol" eliminada');
        }

        // 4. Verificar tabla user (que debe quedarse)
        console.log('\n📊 Verificando tabla "user" (debe conservarse):');
        const userCheck = await client.execute("SELECT COUNT(*) as count FROM user");
        console.log(`✅ Tabla "user" tiene ${userCheck.rows[0].count} usuarios`);

        // 5. Mostrar usuarios en tabla user
        const users = await client.execute('SELECT id, username, role FROM user');
        console.log('\n👥 Usuarios en tabla "user":');
        users.rows.forEach(user => {
            console.log(`   - ${user.username} (${user.role})`);
        });

        console.log('\n✅ Limpieza completada. Solo queda tabla "user" para autenticación.');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        client.close();
    }
}

cleanupDatabase().then(() => {
    console.log('🎉 Base de datos limpia. Ahora configurar backend para usar tabla "user"');
    process.exit(0);
});