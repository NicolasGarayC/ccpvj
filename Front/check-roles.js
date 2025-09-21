// Script para verificar roles en tabla user
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function checkRoles() {
    try {
        console.log('🔍 VERIFICANDO ROLES EN TABLA "user":\n');

        // Mostrar estructura de roles en tabla user
        const userStructure = await client.execute("PRAGMA table_info(user)");
        console.log('📊 ESTRUCTURA DE TABLA "user":');
        userStructure.rows.forEach(col => {
            console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });

        // Mostrar usuarios y sus roles
        console.log('\n👥 USUARIOS Y SUS ROLES:');
        const users = await client.execute('SELECT id, username, role FROM user');
        users.rows.forEach(user => {
            console.log(`   Usuario: ${user.username}, Rol: ${user.role}`);
        });

        // Mostrar roles únicos disponibles
        console.log('\n🎭 ROLES ÚNICOS DISPONIBLES:');
        const uniqueRoles = await client.execute('SELECT DISTINCT role FROM user ORDER BY role');
        uniqueRoles.rows.forEach(roleRow => {
            console.log(`   - ${roleRow.role}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.close();
    }
}

checkRoles().then(() => {
    process.exit(0);
});