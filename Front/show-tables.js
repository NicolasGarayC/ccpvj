// Script para mostrar todas las tablas de la base de datos
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function showTables() {
    try {
        console.log('📋 TODAS LAS TABLAS EN LA BASE DE DATOS:\n');

        // Obtener todas las tablas
        const result = await client.execute(`
            SELECT name, type, sql
            FROM sqlite_master
            WHERE type='table'
            ORDER BY name
        `);

        console.log('Número total de tablas:', result.rows.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        result.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}`);
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.close();
    }
}

showTables().then(() => {
    process.exit(0);
});