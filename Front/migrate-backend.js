// Script para migrar la base de datos para compatibilidad con backend .NET
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Configurar conexión a la base de datos
const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function executeSqlScript() {
    try {
        console.log('🔧 Iniciando migración de base de datos para backend .NET...');

        // Leer el script SQL
        const scriptPath = path.join(process.cwd(), '..', 'Data', 'scripts', 'create_backend_tables.sql');
        const sqlScript = fs.readFileSync(scriptPath, 'utf8');

        // Dividir el script en comandos individuales
        const commands = sqlScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);

        // Ejecutar cada comando
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command.trim()) {
                try {
                    console.log(`⚡ Ejecutando comando ${i + 1}/${commands.length}...`);
                    await client.execute(command);
                } catch (error) {
                    // Ignorar errores de "table already exists" y similares
                    if (!error.message.includes('already exists') &&
                        !error.message.includes('UNIQUE constraint failed')) {
                        console.warn(`⚠️  Warning en comando ${i + 1}:`, error.message);
                    }
                }
            }
        }

        console.log('✅ Migración completada exitosamente!');

        // Verificar las tablas creadas
        console.log('📊 Verificando tablas creadas...');
        const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        console.log('📋 Tablas en la base de datos:');
        result.rows.forEach(row => {
            console.log(`   - ${row.name}`);
        });

        // Verificar usuario admin
        const adminCheck = await client.execute("SELECT COUNT(*) as count FROM Usuario WHERE NombreUsuario = 'admin'");
        console.log(`👤 Usuarios administrador: ${adminCheck.rows[0].count}`);

        if (adminCheck.rows[0].count === 0) {
            console.log('⚠️  No se encontró usuario admin. Creando usuario por defecto...');

            // Hash básico para testing (NO usar en producción)
            await client.execute(`
                INSERT INTO Usuario (NombreUsuario, Contrasena, FechaRegistro, Nombre, Apellido, IdRol, EsActivo)
                VALUES ('admin', 'admin123', datetime('now'), 'Administrador', 'Sistema', 1, 1)
            `);

            console.log('✅ Usuario admin creado (usuario: admin, password: admin123)');
        }

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    } finally {
        client.close();
    }
}

// Ejecutar la migración
executeSqlScript().then(() => {
    console.log('🎉 Proceso de migración finalizado');
    process.exit(0);
});