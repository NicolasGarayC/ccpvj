// Script to add sample course data
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:../Data/ccpvj.db';
const client = createClient({ url: dbUrl });

async function addSampleCourse() {
    try {
        console.log('📝 Agregando curso de ejemplo a la base de datos...\n');

        // Generate a random ID for the course
        const courseId = crypto.randomUUID();

        // Insert sample course
        await client.execute({
            sql: `INSERT OR IGNORE INTO course (
                id, title, description, subject, image_path,
                is_active, is_featured, created_at, educator_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                courseId,
                'Curso de Programación Web',
                'Aprende los fundamentos del desarrollo web moderno con HTML, CSS y JavaScript',
                'Tecnología',
                '/uploads/course-web-programming.jpg',
                1, // is_active
                1, // is_featured
                Date.now(), // created_at (unix timestamp)
                '1' // educator_id
            ]
        });

        console.log('✅ Curso de ejemplo agregado:');
        console.log(`   ID: ${courseId}`);
        console.log('   Título: Curso de Programación Web');
        console.log('   Materia: Tecnología');
        console.log('   Destacado: Sí');

        // Verify the course was added
        const result = await client.execute('SELECT COUNT(*) as count FROM course');
        console.log(`\n📊 Total de cursos en la base de datos: ${result.rows[0].count}`);

        // Show all courses
        const allCourses = await client.execute('SELECT id, title, subject, is_featured FROM course');
        console.log('\n📚 Cursos existentes:');
        allCourses.rows.forEach(course => {
            const featured = course.is_featured ? '⭐ Destacado' : '';
            console.log(`   • ${course.title} (${course.subject}) ${featured}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.close();
    }
}

addSampleCourse().then(() => {
    console.log('\n🎉 ¡Proceso completado!');
    process.exit(0);
});