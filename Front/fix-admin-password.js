// Script para crear un hash BCrypt válido para el usuario admin
import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function fixAdminPassword() {
    try {
        console.log('🔧 Actualizando password del usuario admin con hash BCrypt válido...');

        // Generar hash BCrypt para el password "admin123"
        const plainPassword = 'admin123';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

        console.log('🔑 Hash generado:', hashedPassword.substring(0, 20) + '...');

        // Actualizar el usuario admin con el hash correcto
        await client.execute({
            sql: 'UPDATE user SET password_hash = ? WHERE username = ?',
            args: [hashedPassword, 'admin']
        });

        console.log('✅ Password del usuario admin actualizado correctamente');

        // Verificar el usuario
        const adminCheck = await client.execute('SELECT id, username, role FROM user WHERE username = ?', ['admin']);
        if (adminCheck.rows.length > 0) {
            const admin = adminCheck.rows[0];
            console.log(`👤 Usuario admin verificado: ID ${admin.id}, Rol ${admin.role}`);
            console.log('🔑 Credenciales actualizadas: usuario=admin, password=admin123');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        client.close();
    }
}

fixAdminPassword().then(() => {
    console.log('🎉 ¡Password actualizado! Ahora puedes autenticarte con admin/admin123');
    process.exit(0);
});