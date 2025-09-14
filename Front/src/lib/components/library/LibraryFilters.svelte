<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { LibrarySearchFilters, ResourceCategory, MediaType } from '$lib/data/models/library';
	import { MEDIA_TYPE_LABELS, CATEGORY_LABELS } from '$lib/data/models/library';

	export let currentFilters: LibrarySearchFilters = {};

	const dispatch = createEventDispatcher<{
		filtersChange: LibrarySearchFilters;
	}>();

	// Estado local de filtros
	let localFilters: LibrarySearchFilters = { ...currentFilters };
	let showAdvanced = false;

	// Opciones disponibles
	const languageOptions = [
		{ value: 'es', label: 'Español' },
		{ value: 'en', label: 'Inglés' },
		{ value: 'fr', label: 'Francés' },
		{ value: 'pt', label: 'Portugués' }
	];

	const currentYear = new Date().getFullYear();
	const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

	function applyFilters() {
		// Limpiar filtros vacíos
		const cleanFilters: LibrarySearchFilters = {};
		Object.entries(localFilters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '' && 
			    !(Array.isArray(value) && value.length === 0)) {
				cleanFilters[key as keyof LibrarySearchFilters] = value;
			}
		});

		dispatch('filtersChange', cleanFilters);
	}

	function clearFilters() {
		localFilters = {};
		dispatch('filtersChange', {});
	}

	function handleFilterChange() {
		applyFilters();
	}

	// Watchers para aplicar filtros automáticamente
	$: if (localFilters) {
		applyFilters();
	}
</script>

<div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
	<!-- Header de filtros -->
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-medium text-gray-900">Filtros</h3>
		<div class="flex items-center gap-2">
			<button
				on:click={() => showAdvanced = !showAdvanced}
				class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
			>
				<i class="fas fa-{showAdvanced ? 'chevron-up' : 'chevron-down'}"></i>
				{showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avanzados
			</button>
			<button
				on:click={clearFilters}
				class="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
			>
				<i class="fas fa-times"></i>
				Limpiar filtros
			</button>
		</div>
	</div>

	<!-- Filtros básicos -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
		<!-- Tipo de archivo -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">Tipo de archivo</label>
			<select 
				bind:value={localFilters.mediaType}
				on:change={handleFilterChange}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
			>
				<option value="">Todos los tipos</option>
				{#each Object.entries(MEDIA_TYPE_LABELS) as [value, label]}
					<option {value}>{label}</option>
				{/each}
			</select>
		</div>

		<!-- Categoría -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
			<select 
				bind:value={localFilters.category}
				on:change={handleFilterChange}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
			>
				<option value="">Todas las categorías</option>
				{#each Object.entries(CATEGORY_LABELS) as [value, label]}
					<option {value}>{label}</option>
				{/each}
			</select>
		</div>

		<!-- Idioma -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
			<select 
				bind:value={localFilters.language}
				on:change={handleFilterChange}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
			>
				<option value="">Todos los idiomas</option>
				{#each languageOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Filtros avanzados -->
	{#if showAdvanced}
		<div class="border-t border-gray-200 pt-4">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<!-- Año de publicación -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Año de publicación</label>
					<select 
						bind:value={localFilters.publishYear}
						on:change={handleFilterChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
					>
						<option value="">Cualquier año</option>
						{#each yearOptions as year}
							<option value={year}>{year}</option>
						{/each}
					</select>
				</div>

				<!-- Autor -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Autor</label>
					<input 
						type="text"
						placeholder="Buscar por autor..."
						bind:value={localFilters.authors}
						on:input={handleFilterChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
					>
				</div>

				<!-- Checkboxes -->
				<div class="space-y-2">
					<label class="flex items-center">
						<input 
							type="checkbox" 
							bind:checked={localFilters.downloadable}
							on:change={handleFilterChange}
							class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
						>
						<span class="ml-2 text-sm text-gray-700">Solo descargables</span>
					</label>
					
					<label class="flex items-center">
						<input 
							type="checkbox" 
							bind:checked={localFilters.isFeatured}
							on:change={handleFilterChange}
							class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
						>
						<span class="ml-2 text-sm text-gray-700">Solo destacados</span>
					</label>
				</div>

				<!-- Tags -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
					<input 
						type="text"
						placeholder="ej: educación, historia..."
						value={localFilters.tags?.join(', ') || ''}
						on:input={(e) => {
							const value = e.target.value;
							localFilters.tags = value ? value.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
							handleFilterChange();
						}}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
					>
					<p class="text-xs text-gray-500 mt-1">Separar múltiples tags con comas</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Filtros activos -->
	{#if Object.keys(currentFilters).length > 0}
		<div class="border-t border-gray-200 pt-4 mt-4">
			<div class="flex items-center gap-2 flex-wrap">
				<span class="text-sm font-medium text-gray-700">Filtros activos:</span>
				
				{#each Object.entries(currentFilters) as [key, value]}
					{#if value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)}
						<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
							{#if key === 'mediaType'}
								Tipo: {MEDIA_TYPE_LABELS[value]}
							{:else if key === 'category'}
								Categoría: {CATEGORY_LABELS[value]}
							{:else if key === 'language'}
								Idioma: {languageOptions.find(opt => opt.value === value)?.label || value}
							{:else if key === 'publishYear'}
								Año: {value}
							{:else if key === 'authors'}
								Autor: {value}
							{:else if key === 'downloadable'}
								Descargable
							{:else if key === 'isFeatured'}
								Destacado
							{:else if key === 'tags'}
								Tags: {Array.isArray(value) ? value.join(', ') : value}
							{/if}
							<button 
								on:click={() => {
									delete localFilters[key];
									localFilters = { ...localFilters };
									handleFilterChange();
								}}
								class="ml-1 text-indigo-600 hover:text-indigo-800"
							>
								<i class="fas fa-times text-xs"></i>
							</button>
						</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>