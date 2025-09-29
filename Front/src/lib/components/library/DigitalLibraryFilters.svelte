<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { digitalLibraryService } from '$lib/services/digitalLibraryService';
	import type { LibrarySearchDto } from '$lib/services/digitalLibraryService';

	const dispatch = createEventDispatcher<{
		filtersChange: LibrarySearchDto;
	}>();

	export let currentFilters: LibrarySearchDto = {};

	let availableCategories: string[] = [];
	let availableAuthors: string[] = [];
	let availableTags: string[] = [];
	let availableLanguages: string[] = [];
	let availableYears: number[] = [];

	let isFiltersOpen = false;
	let activeFiltersCount = 0;

	let localFilters: LibrarySearchDto = { ...currentFilters };

	$: {
		activeFiltersCount = Object.keys(localFilters).filter(key => {
			const value = localFilters[key as keyof LibrarySearchDto];
			return value !== undefined && value !== '' &&
				   (Array.isArray(value) ? value.length > 0 : true);
		}).length;
	}

	onMount(async () => {
		await loadFilterOptions();
	});

	async function loadFilterOptions() {
		try {
			[availableCategories, availableAuthors, availableTags, availableLanguages, availableYears] =
				await Promise.all([
					digitalLibraryService.getAvailableCategories(),
					digitalLibraryService.getAvailableAuthors(),
					digitalLibraryService.getAvailableTags(),
					digitalLibraryService.getAvailableLanguages(),
					digitalLibraryService.getAvailableYears()
				]);
		} catch (error) {
			console.error('Error loading filter options:', error);
		}
	}

	function applyFilters() {
		dispatch('filtersChange', localFilters);
		currentFilters = { ...localFilters };
	}

	function clearAllFilters() {
		localFilters = {};
		dispatch('filtersChange', {});
		currentFilters = {};
	}

	function handleTagToggle(tag: string) {
		if (!localFilters.tags) localFilters.tags = [];

		const index = localFilters.tags.indexOf(tag);
		if (index > -1) {
			localFilters.tags.splice(index, 1);
		} else {
			localFilters.tags.push(tag);
		}
		localFilters.tags = [...localFilters.tags];
		applyFilters();
	}

	function removeFilter(filterKey: string) {
		delete localFilters[filterKey as keyof LibrarySearchDto];
		localFilters = { ...localFilters };
		applyFilters();
	}

	const fileTypeOptions = [
		{ value: 'image', label: '🖼️ Imágenes', color: 'from-green-400 to-green-600' },
		{ value: 'video', label: '🎥 Videos', color: 'from-amber-400 to-orange-600' },
		{ value: 'audio', label: '🎵 Audio', color: 'from-purple-400 to-purple-600' },
		{ value: 'document', label: '📄 Documentos', color: 'from-red-400 to-red-600' }
	];

	const categoryOptions = [
		{ value: 'victor-jara', label: '🎸 Víctor Jara', color: 'from-red-400 to-red-600' },
		{ value: 'nueva-cancion', label: '🎶 Nueva Canción', color: 'from-blue-400 to-blue-600' },
		{ value: 'educacion-popular', label: '📚 Educación Popular', color: 'from-green-400 to-green-600' },
		{ value: 'memoria-historica', label: '🏛️ Memoria Histórica', color: 'from-purple-400 to-purple-600' },
		{ value: 'talleres-eventos', label: '🎭 Talleres y Eventos', color: 'from-indigo-400 to-indigo-600' },
		{ value: 'archivo-prensa', label: '📰 Archivo de Prensa', color: 'from-yellow-400 to-yellow-600' },
		{ value: 'audiovisual', label: '🎬 Audiovisual', color: 'from-pink-400 to-pink-600' },
		{ value: 'literatura', label: '📖 Literatura', color: 'from-teal-400 to-teal-600' },
		{ value: 'general', label: '📁 General', color: 'from-gray-400 to-gray-600' }
	];
</script>

<div class="relative bg-gradient-to-br from-white/95 to-indigo-50/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-indigo-100 p-6 mb-8 overflow-hidden">
	<!-- Elementos decorativos -->
	<div class="absolute -top-4 -right-4 w-20 h-20 bg-indigo-200/20 rounded-full animate-pulse"></div>
	<div class="absolute bottom-4 left-4 w-16 h-16 bg-purple-200/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>

	<div class="relative z-10">
		<!-- Header de filtros -->
		<div class="flex items-center justify-between mb-6">
			<div class="flex items-center gap-3">
				<h3 class="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-3">
					<span class="text-2xl">🎯</span>
					Filtros Súper Geniales
				</h3>
				{#if activeFiltersCount > 0}
					<div class="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-200 rounded-xl px-3 py-1">
						<span class="text-sm font-bold text-indigo-700">{activeFiltersCount} activos</span>
						<span class="text-sm">🔥</span>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				{#if activeFiltersCount > 0}
					<button
						on:click={clearAllFilters}
						class="group inline-flex items-center gap-2 bg-gradient-to-r from-red-400 to-red-500 text-white px-4 py-2 rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-bold"
					>
						<span class="text-sm group-hover:rotate-90 transition-transform duration-300">🗑️</span>
						Limpiar Todo
					</button>
				{/if}

				<button
					on:click={() => isFiltersOpen = !isFiltersOpen}
					class="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-bold"
				>
					<span class="text-sm group-hover:scale-110 transition-transform duration-300">⚙️</span>
					{isFiltersOpen ? 'Ocultar' : 'Mostrar'} Filtros
					<span class="text-sm transform transition-transform duration-300 {isFiltersOpen ? 'rotate-180' : ''}">⬇️</span>
				</button>
			</div>
		</div>

		<!-- Filtros activos -->
		{#if activeFiltersCount > 0}
			<div class="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl">
				<h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
					<span>🏷️</span>
					Filtros Activos
				</h4>
				<div class="flex flex-wrap gap-2">
					{#if localFilters.fileType}
						<div class="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 rounded-lg px-3 py-1 text-sm">
							<span>📁</span>
							<span class="font-semibold">Tipo: {fileTypeOptions.find(t => t.value === localFilters.fileType)?.label || localFilters.fileType}</span>
							<button on:click={() => removeFilter('fileType')} class="text-red-500 hover:text-red-700 ml-1">✕</button>
						</div>
					{/if}

					{#if localFilters.category}
						<div class="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-green-200 border border-green-300 rounded-lg px-3 py-1 text-sm">
							<span>📂</span>
							<span class="font-semibold">Categoría: {categoryOptions.find(c => c.value === localFilters.category)?.label || localFilters.category}</span>
							<button on:click={() => removeFilter('category')} class="text-red-500 hover:text-red-700 ml-1">✕</button>
						</div>
					{/if}

					{#if localFilters.author}
						<div class="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-300 rounded-lg px-3 py-1 text-sm">
							<span>👤</span>
							<span class="font-semibold">Autor: {localFilters.author}</span>
							<button on:click={() => removeFilter('author')} class="text-red-500 hover:text-red-700 ml-1">✕</button>
						</div>
					{/if}

					{#if localFilters.language}
						<div class="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-300 rounded-lg px-3 py-1 text-sm">
							<span>🌐</span>
							<span class="font-semibold">Idioma: {localFilters.language}</span>
							<button on:click={() => removeFilter('language')} class="text-red-500 hover:text-red-700 ml-1">✕</button>
						</div>
					{/if}

					{#if localFilters.publishYear}
						<div class="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-orange-200 border border-orange-300 rounded-lg px-3 py-1 text-sm">
							<span>📅</span>
							<span class="font-semibold">Año: {localFilters.publishYear}</span>
							<button on:click={() => removeFilter('publishYear')} class="text-red-500 hover:text-red-700 ml-1">✕</button>
						</div>
					{/if}

					{#if localFilters.tags && localFilters.tags.length > 0}
						{#each localFilters.tags as tag}
							<div class="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-pink-200 border border-pink-300 rounded-lg px-3 py-1 text-sm">
								<span>🏷️</span>
								<span class="font-semibold">{tag}</span>
								<button on:click={() => handleTagToggle(tag)} class="text-red-500 hover:text-red-700 ml-1">✕</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		<!-- Panel de filtros expandible -->
		{#if isFiltersOpen}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Tipo de archivo -->
				<div class="space-y-3">
					<h4 class="text-lg font-bold text-gray-800 flex items-center gap-2">
						<span>📁</span>
						Tipo de Archivo
					</h4>
					<div class="space-y-2">
						{#each fileTypeOptions as option}
							<label class="group cursor-pointer">
								<input
									type="radio"
									bind:group={localFilters.fileType}
									value={option.value}
									on:change={applyFilters}
									class="sr-only"
								>
								<div class="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl hover:border-indigo-300 transition-all duration-300 group-hover:shadow-lg {localFilters.fileType === option.value ? `bg-gradient-to-r ${option.color} text-white border-transparent shadow-lg` : 'bg-white hover:bg-gray-50'}">
									<span class="text-lg">{option.label.split(' ')[0]}</span>
									<span class="font-semibold {localFilters.fileType === option.value ? 'text-white' : 'text-gray-700'}">{option.label.split(' ').slice(1).join(' ')}</span>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<!-- Categoría -->
				<div class="space-y-3">
					<h4 class="text-lg font-bold text-gray-800 flex items-center gap-2">
						<span>📂</span>
						Categoría
					</h4>
					<div class="max-h-48 overflow-y-auto space-y-2 pr-2">
						{#each categoryOptions as option}
							<label class="group cursor-pointer">
								<input
									type="radio"
									bind:group={localFilters.category}
									value={option.value}
									on:change={applyFilters}
									class="sr-only"
								>
								<div class="flex items-center gap-3 p-2 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition-all duration-300 group-hover:shadow-md {localFilters.category === option.value ? `bg-gradient-to-r ${option.color} text-white border-transparent shadow-md` : 'bg-white hover:bg-gray-50'}">
									<span class="text-sm">{option.label.split(' ')[0]}</span>
									<span class="text-sm font-semibold {localFilters.category === option.value ? 'text-white' : 'text-gray-700'}">{option.label.split(' ').slice(1).join(' ')}</span>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<!-- Autor -->
				<div class="space-y-3">
					<h4 class="text-lg font-bold text-gray-800 flex items-center gap-2">
						<span>👤</span>
						Autor
					</h4>
					<select
						bind:value={localFilters.author}
						on:change={applyFilters}
						class="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-semibold text-gray-700"
					>
						<option value="">Todos los autores</option>
						{#each availableAuthors as author}
							<option value={author}>{author}</option>
						{/each}
					</select>
				</div>

				<!-- Idioma -->
				<div class="space-y-3">
					<h4 class="text-lg font-bold text-gray-800 flex items-center gap-2">
						<span>🌐</span>
						Idioma
					</h4>
					<select
						bind:value={localFilters.language}
						on:change={applyFilters}
						class="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-semibold text-gray-700"
					>
						<option value="">Todos los idiomas</option>
						{#each availableLanguages as language}
							<option value={language}>{language}</option>
						{/each}
					</select>
				</div>

				<!-- Año de publicación -->
				<div class="space-y-3">
					<h4 class="text-lg font-bold text-gray-800 flex items-center gap-2">
						<span>📅</span>
						Año de Publicación
					</h4>
					<select
						bind:value={localFilters.publishYear}
						on:change={applyFilters}
						class="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white font-semibold text-gray-700"
					>
						<option value="">Todos los años</option>
						{#each availableYears.sort((a, b) => b - a) as year}
							<option value={year}>{year}</option>
						{/each}
					</select>
				</div>

				<!-- Tags -->
				<div class="space-y-3">
					<h4 class="text-lg font-bold text-gray-800 flex items-center gap-2">
						<span>🏷️</span>
						Etiquetas
					</h4>
					<div class="max-h-48 overflow-y-auto space-y-2 pr-2">
						{#if availableTags.length > 0}
							{#each availableTags as tag}
								<label class="group cursor-pointer flex items-center gap-3 p-2 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-all duration-300 hover:shadow-md {localFilters.tags?.includes(tag) ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white border-transparent shadow-md' : 'bg-white hover:bg-purple-50'}">
									<input
										type="checkbox"
										checked={localFilters.tags?.includes(tag) || false}
										on:change={() => handleTagToggle(tag)}
										class="sr-only"
									>
									<span class="text-sm font-semibold {localFilters.tags?.includes(tag) ? 'text-white' : 'text-gray-700'}">{tag}</span>
									{#if localFilters.tags?.includes(tag)}
										<span class="text-sm ml-auto">✓</span>
									{/if}
								</label>
							{/each}
						{:else}
							<p class="text-gray-500 text-sm italic">No hay etiquetas disponibles</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>