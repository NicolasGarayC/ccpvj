// Script to check specifically for Course table
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function checkCourseTable() {
    try {
        console.log('🔍 Verificando tabla Course específicamente...\n');

        // 1. Buscar todas las tablas que contengan "course" (case insensitive)
        const allTables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        console.log('📋 TODAS LAS TABLAS:');
        allTables.rows.forEach(row => {
            const name = row.name.toString();
            if (name.toLowerCase().includes('course')) {
                console.log(`   ✅ ${name} (contiene 'course')`);
            } else {
                console.log(`   • ${name}`);
            }
        });

        // 2. Buscar específicamente "Course" y "course"
        const courseUpper = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Course'");
        const courseLower = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='course'");

        console.log(`\n📊 Tabla "Course" (mayúscula): ${courseUpper.rows.length > 0 ? '✅ EXISTE' : '❌ NO EXISTE'}`);
        console.log(`📊 Tabla "course" (minúscula): ${courseLower.rows.length > 0 ? '✅ EXISTE' : '❌ NO EXISTE'}`);

        // 3. Si existe course (minúscula), mostrar su estructura
        if (courseLower.rows.length > 0) {
            console.log('\n📋 ESTRUCTURA DE "course" (minúscula):');
            const structure = await client.execute("PRAGMA table_info(course)");
            structure.rows.forEach(col => {
                console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
            });
        }

        // 4. Si existe Course (mayúscula), mostrar su estructura
        if (courseUpper.rows.length > 0) {
            console.log('\n📋 ESTRUCTURA DE "Course" (mayúscula):');
            const structure = await client.execute("PRAGMA table_info(Course)");
            structure.rows.forEach(col => {
                console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.close();
    }
}

checkCourseTable().then(() => {
    console.log('\n🎉 Verificación completada');
    process.exit(0);
});