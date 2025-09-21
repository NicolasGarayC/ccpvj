// Script para agregar la columna IsFeatured a la tabla Course
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function addIsFeaturedColumn() {
    try {
        console.log('🔧 Agregando columna IsFeatured a la tabla Course...\n');

        // 1. Verificar si la tabla Course existe
        const courseCheck = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Course'");
        if (courseCheck.rows.length === 0) {
            console.error('❌ La tabla "Course" no existe');
            return;
        }
        console.log('✅ Tabla "Course" encontrada');

        // 2. Verificar si la columna IsFeatured ya existe
        const columnCheck = await client.execute("PRAGMA table_info(Course)");
        const hasIsFeatured = columnCheck.rows.some(col => col.name === 'IsFeatured');

        if (hasIsFeatured) {
            console.log('⚠️ La columna "IsFeatured" ya existe en la tabla Course');
            return;
        }

        // 3. Agregar la columna IsFeatured
        await client.execute("ALTER TABLE Course ADD COLUMN IsFeatured INTEGER DEFAULT 0");
        console.log('✅ Columna "IsFeatured" agregada exitosamente');

        // 4. Verificar que la columna se agregó correctamente
        const verifyColumn = await client.execute("PRAGMA table_info(Course)");
        const columnExists = verifyColumn.rows.some(col => col.name === 'IsFeatured');

        if (columnExists) {
            console.log('✅ Verificación exitosa: columna "IsFeatured" está presente');

            // 5. Mostrar la estructura actualizada de la tabla
            console.log('\n📊 ESTRUCTURA ACTUALIZADA DE TABLA "Course":');
            verifyColumn.rows.forEach(col => {
                console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
            });
        } else {
            console.error('❌ Error: la columna no se agregó correctamente');
        }

    } catch (error) {
        console.error('❌ Error agregando columna IsFeatured:', error);
    } finally {
        client.close();
    }
}

addIsFeaturedColumn().then(() => {
    console.log('\n🎉 Operación completada');
    process.exit(0);
});