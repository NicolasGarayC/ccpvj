// Script para verificar usuarios existentes en ambas tablas
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function checkUsers() {
    try {
        console.log('👥 VERIFICANDO USUARIOS EXISTENTES:\n');

        // 1. Verificar tabla Usuario (backend .NET)
        console.log('📋 TABLA "Usuario" (backend .NET):');
        try {
            const usuariosBackend = await client.execute('SELECT IdUsuario, NombreUsuario, Contrasena, IdRol FROM Usuario');
            if (usuariosBackend.rows.length > 0) {
                usuariosBackend.rows.forEach(user => {
                    console.log(`   ID: ${user.IdUsuario}, Usuario: ${user.NombreUsuario}, Rol: ${user.IdRol}`);
                    console.log(`   Password: ${user.Contrasena.substring(0, 20)}... (${user.Contrasena.length} chars)`);
                });
            } else {
                console.log('   (sin usuarios)');
            }
        } catch (error) {
            console.log('   Error:', error.message);
        }

        console.log('\n📋 TABLA "user" (frontend):');
        try {
            const usuariosFrontend = await client.execute('SELECT id, username, password_hash, role FROM user');
            if (usuariosFrontend.rows.length > 0) {
                usuariosFrontend.rows.forEach(user => {
                    console.log(`   ID: ${user.id}, Usuario: ${user.username}, Rol: ${user.role}`);
                    console.log(`   Password: ${user.password_hash.substring(0, 20)}... (${user.password_hash.length} chars)`);
                });
            } else {
                console.log('   (sin usuarios)');
            }
        } catch (error) {
            console.log('   Error:', error.message);
        }

        // Verificar específicamente usuario admin
        console.log('\n🔍 BUSCANDO USUARIO "admin":');

        // En tabla Usuario
        const adminBackend = await client.execute('SELECT IdUsuario, NombreUsuario, Contrasena FROM Usuario WHERE NombreUsuario = ?', ['admin']);
        if (adminBackend.rows.length > 0) {
            const admin = adminBackend.rows[0];
            console.log(`✅ Admin encontrado en tabla "Usuario": ${admin.NombreUsuario}`);
            console.log(`   Password actual: ${admin.Contrasena}`);
            console.log(`   ¿Es BCrypt?: ${admin.Contrasena.startsWith('$2') ? 'SÍ' : 'NO (texto plano)'}`);
        } else {
            console.log('❌ Admin NO encontrado en tabla "Usuario"');
        }

        // En tabla user
        const adminFrontend = await client.execute('SELECT id, username, password_hash FROM user WHERE username = ?', ['admin']);
        if (adminFrontend.rows.length > 0) {
            const admin = adminFrontend.rows[0];
            console.log(`✅ Admin encontrado en tabla "user": ${admin.username}`);
            console.log(`   Password actual: ${admin.password_hash.substring(0, 30)}...`);
            console.log(`   ¿Es BCrypt?: ${admin.password_hash.startsWith('$2') ? 'SÍ' : 'NO'}`);
        } else {
            console.log('❌ Admin NO encontrado en tabla "user"');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.close();
    }
}

checkUsers().then(() => {
    process.exit(0);
});