import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		console.log('🔍 Inspeccionando estructuras de tablas relacionadas...');

		// Obtener estructura de todas las tablas relacionadas
		const courseStructure = await db.all(`PRAGMA table_info(course);`);

		let moduleStructure = null;
		try {
			moduleStructure = await db.all(`PRAGMA table_info(module);`);
		} catch (e) {
			console.log('Tabla module (minúscula) no existe');
		}

		let ModuleStructure = null;
		try {
			ModuleStructure = await db.all(`PRAGMA table_info(Module);`);
		} catch (e) {
			console.log('Tabla Module (mayúscula) no existe');
		}

		let workItemStructure = null;
		try {
			workItemStructure = await db.all(`PRAGMA table_info(work_item);`);
		} catch (e) {
			console.log('Tabla work_item no existe');
		}

		let WorkItemStructure = null;
		try {
			WorkItemStructure = await db.all(`PRAGMA table_info(WorkItem);`);
		} catch (e) {
			console.log('Tabla WorkItem no existe');
		}

		// Ver qué datos hay
		const courseCount = await db.all(`SELECT COUNT(*) as count FROM course;`);
		let moduleCount = null;
		try {
			moduleCount = await db.all(`SELECT COUNT(*) as count FROM module;`);
		} catch (e) {
			try {
				moduleCount = await db.all(`SELECT COUNT(*) as count FROM Module;`);
			} catch (e2) {
				moduleCount = { error: 'No se pudo contar módulos' };
			}
		}

		return json({
			success: true,
			structures: {
				course: courseStructure,
				module: moduleStructure,
				Module: ModuleStructure,
				work_item: workItemStructure,
				WorkItem: WorkItemStructure
			},
			counts: {
				course: courseCount[0]?.count || 0,
				module: moduleCount?.count || moduleCount
			}
		});

	} catch (error) {
		console.error('❌ Error inspeccionando estructuras:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido'
		}, { status: 500 });
	}
};