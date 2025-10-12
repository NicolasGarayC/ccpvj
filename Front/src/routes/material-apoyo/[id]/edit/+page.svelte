<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { materialApoyoService } from '$lib/services/materialApoyoService';
	import type { MaterialApoyoDto } from '$lib/types/api/materialApoyo.types';
	import { jwtService } from '$lib/services/auth/jwtService.js';
	import MaterialApoyoForm from '$lib/components/course/MaterialApoyoForm.svelte';

	let course: Course | null = null;
	let loading = true;
	let error = '';
	let canEdit = false;

	const courseId = $page.params.id;

	onMount(async () => {
		// Check permissions
		if (!jwtService.isAuthenticated()) {
			goto('/auth/login');
			return;
		}

		const user = jwtService.getUser();
		canEdit = user?.role === 'colaborador' || user?.role === 'administrador';

		if (!canEdit) {
			error = 'No tienes permisos para editar proyectos';
			loading = false;
			return;
		}

		// Load course data
		await loadCourse();
	});

	async function loadCourse() {
		try {
			loading = true;
			error = '';
			course = await materialApoyoService.getMaterialApoyoById(courseId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error cargando el proyecto';
			console.error('Error loading course:', err);
		} finally {
			loading = false;
		}
	}

	function handleSuccess(event: CustomEvent<{type: string, id?: string}>) {
		const { type } = event.detail;
		if (type === 'update') {
			goto(`/material-apoyo/${courseId}`, { replaceState: true });
		}
	}

	function handleError(event: CustomEvent<string>) {
		error = event.detail;
		setTimeout(() => {
			error = '';
		}, 5000);
	}

	function handleCancel() {
		goto(`/material-apoyo/${courseId}`);
	}
</script>

<svelte:head>
	<title>Editar Material de Apoyo - Centro Cultural Víctor Jara</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header -->
		<div class="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-8 mb-8 border-2 border-emerald-100">
			<div class="text-center">
				<h1 class="text-3xl md:text-4xl font-black mb-4">
					<span class="text-2xl mr-3">✏️</span>
					<span class="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 bg-clip-text text-transparent">
						Editar Material de Apoyo
					</span>
				</h1>
				<p class="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
					Modifica los detalles del material de apoyo para mantener el contenido actualizado y útil
				</p>
			</div>
		</div>

		<!-- Content -->
		{#if loading}
			<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-16">
				<div class="text-center">
					<div class="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
					<h3 class="text-xl font-bold text-gray-800 mb-2">Cargando material...</h3>
					<p class="text-gray-600">Obteniendo los detalles del material de apoyo para editar</p>
				</div>
			</div>
		{:else if error && !course}
			<div class="bg-white rounded-3xl shadow-xl border-2 border-red-200 p-16">
				<div class="text-center">
					<div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="15" y1="9" x2="9" y2="15"></line>
							<line x1="9" y1="9" x2="15" y2="15"></line>
						</svg>
					</div>
					<h3 class="text-xl font-bold text-red-800 mb-4">Error al cargar el material</h3>
					<p class="text-red-600 mb-6">{error}</p>
					<div class="flex gap-4 justify-center">
						<button
							class="px-6 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors font-semibold"
							on:click={loadCourse}
						>
							Reintentar
						</button>
						<button
							class="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 transition-colors font-semibold"
							on:click={() => goto('/material-apoyo')}
						>
							Volver a Material de Apoyo
						</button>
					</div>
				</div>
			</div>
		{:else if course}
			<!-- Form -->
			<div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 overflow-hidden">
				<MaterialApoyoForm
					{course}
					on:success={handleSuccess}
					on:error={handleError}
					on:cancel={handleCancel}
				/>
			</div>

			<!-- Success/Error Messages -->
			{#if error}
				<div class="mt-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
					<div class="flex items-center">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500 mr-3">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="15" y1="9" x2="9" y2="15"></line>
							<line x1="9" y1="9" x2="15" y2="15"></line>
						</svg>
						<span class="text-red-700 font-medium">{error}</span>
					</div>
				</div>
			{/if}
		{/if}

		<!-- Navigation -->
		<div class="mt-8 text-center">
			<button
				class="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
				on:click={() => goto('/material-apoyo')}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15,18 9,12 15,6"></polyline>
				</svg>
				Volver a Material de Apoyo
			</button>
		</div>
	</div>
</div>

<style>
	/* Additional responsive styles */
	@media (max-width: 768px) {
		.container {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>