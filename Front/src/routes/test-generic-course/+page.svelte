<script lang="ts">
	import { onMount } from 'svelte';
	import type { CourseDto } from '$lib/types/api/course.types';

	interface TestResult {
		courseId: string;
		success: boolean;
		data?: CourseDto;
		error?: string;
		url: string;
	}

	let testResults: TestResult[] = [];
	let loading = false;

	async function testGenericComponent() {
		loading = true;
		testResults = [];

		const courseIds = ['curso-001', 'curso-002', 'curso-003', 'nonexistent-course'];

		for (const courseId of courseIds) {
			try {
				const response = await fetch(`/api/courses/${courseId}`);
				if (response.ok) {
					const data = await response.json();
					testResults = [...testResults, {
						courseId,
						success: true,
						data,
						url: `/courses/${courseId}`
					}];
				} else {
					testResults = [...testResults, {
						courseId,
						success: false,
						error: `HTTP ${response.status}: ${response.statusText}`,
						url: `/courses/${courseId}`
					}];
				}
			} catch (error: unknown) {
				testResults = [...testResults, {
					courseId,
					success: false,
					error: error instanceof Error ? error.message : 'Error desconocido',
					url: `/courses/${courseId}`
				}];
			}
		}

		loading = false;
	}

	function openCourse(url: string) {
		window.open(url, '_blank');
	}
</script>

<svelte:head>
	<title>Test Generic Course Component</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-6xl">
		<div class="bg-white rounded-lg shadow-lg p-6 mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">
				🧪 Test: Componente Genérico de Curso
			</h1>

			<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
				<h2 class="text-lg font-semibold text-green-800 mb-2">✅ Confirmación</h2>
				<p class="text-green-700">
					El componente de detalles de curso es <strong>GENÉRICO</strong>.
					Una sola página (<code>/routes/courses/[id]/+page.svelte</code>)
					maneja todos los cursos usando el parámetro dinámico <code>[id]</code>.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h3 class="font-semibold text-blue-800 mb-2">🏗️ Arquitectura</h3>
					<ul class="text-blue-700 text-sm space-y-1">
						<li>• Un solo archivo: <code>[id]/+page.svelte</code></li>
						<li>• Parámetro dinámico: <code>$page.params.id</code></li>
						<li>• API genérico: <code>/api/courses/[id]</code></li>
						<li>• Carga datos desde BD usando el ID</li>
					</ul>
				</div>

				<div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<h3 class="font-semibold text-purple-800 mb-2">🎯 URLs que funcionan</h3>
					<ul class="text-purple-700 text-sm space-y-1">
						<li>• <code>/courses/curso-001</code></li>
						<li>• <code>/courses/curso-002</code></li>
						<li>• <code>/courses/cualquier-id</code></li>
						<li>• Maneja errores si no existe</li>
					</ul>
				</div>
			</div>

			<div class="mb-6">
				<button
					class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50"
					on:click={testGenericComponent}
					disabled={loading}
				>
					{#if loading}
						⏳ Probando Componente Genérico...
					{:else}
						🔍 Probar con Múltiples Cursos
					{/if}
				</button>
			</div>

			{#if testResults.length > 0}
				<div class="space-y-4">
					<h2 class="text-xl font-bold">Resultados del Test:</h2>
					{#each testResults as result}
						<div class="border rounded-lg p-4 {result.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}">
							<div class="flex items-center justify-between mb-3">
								<h3 class="font-semibold">
									{result.success ? '✅' : '❌'}
									ID: <code class="bg-gray-200 px-2 py-1 rounded">{result.courseId}</code>
								</h3>
								<div class="flex gap-2">
									<button
										class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
										on:click={() => openCourse(result.url)}
									>
										📋 Ver URL
									</button>
									{#if result.success}
										<button
											class="bg-emerald-500 text-white px-3 py-1 rounded text-sm hover:bg-emerald-600"
											on:click={() => openCourse(result.url)}
										>
											🚀 Abrir Página
										</button>
									{/if}
								</div>
							</div>

							{#if result.success && result.data}
								<div class="bg-white rounded p-3 border">
									<h4 class="font-bold text-lg text-emerald-600 mb-2">{result.data.title}</h4>
									<div class="grid grid-cols-2 gap-4 text-sm">
										<div><strong>Subject:</strong> {result.data.subject}</div>
										<div><strong>Educator:</strong> {result.data.educatorName || 'N/A'}</div>
										<div><strong>Modules:</strong> {result.data.moduleCount || 0}</div>
										<div><strong>Active:</strong> {result.data.isActive ? 'Sí' : 'No'}</div>
									</div>
									<p class="text-xs text-gray-600 mt-2">
										<strong>URL:</strong> <code>{result.url}</code>
									</p>
								</div>
							{:else if result.error}
								<div class="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded">
									<strong>Error:</strong> {result.error}
									<br><small>URL probada: <code>{result.url}</code></small>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
			<h3 class="font-semibold text-yellow-900 mb-2">📝 Resumen</h3>
			<p class="text-yellow-800">
				El componente de detalles de curso es <strong>100% genérico</strong>.
				No hay componentes separados por curso. Un solo archivo maneja todos los cursos
				dinámicamente basado en el ID de la URL.
			</p>
		</div>
	</div>
</div>

<style>
	code {
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
	}
</style>