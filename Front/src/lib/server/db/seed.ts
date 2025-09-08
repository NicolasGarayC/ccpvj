import { hash } from '@oslojs/crypto/password';
import { generateId } from '@oslojs/crypto/random';
import { db } from './index';
import * as table from './schema';

async function seedDatabase() {
	console.log('Seeding database...');

	// Crear usuarios de prueba
	const adminId = generateId(15);
	const studentId = generateId(15);
	
	const adminPasswordHash = await hash('admin123');
	const studentPasswordHash = await hash('student123');

	const users: table.InsertUser[] = [
		{
			id: adminId,
			username: 'admin',
			passwordHash: adminPasswordHash,
			nombre: 'Administrador',
			apellido: 'Sistema',
			telefono: '555-0001',
			role: 'Administrador',
			createdAt: new Date(),
			updatedAt: new Date()
		},
		{
			id: studentId,
			username: 'estudiante',
			passwordHash: studentPasswordHash,
			nombre: 'Juan',
			apellido: 'Pérez',
			telefono: '555-0002',
			role: 'Estudiante',
			createdAt: new Date(),
			updatedAt: new Date()
		}
	];

	try {
		await db.insert(table.user).values(users);
		console.log('✅ Usuarios de prueba creados:');
		console.log('   Admin - usuario: admin, contraseña: admin123');
		console.log('   Estudiante - usuario: estudiante, contraseña: student123');
	} catch (error) {
		console.log('⚠️  Los usuarios ya existen o hay un error:', error);
	}
}

// Ejecutar seed si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	seedDatabase().then(() => {
		console.log('Seed completado');
		process.exit(0);
	}).catch((error) => {
		console.error('Error durante seed:', error);
		process.exit(1);
	});
}

export { seedDatabase };