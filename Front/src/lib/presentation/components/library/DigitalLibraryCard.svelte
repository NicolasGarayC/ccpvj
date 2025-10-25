<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { digitalLibraryService } from '$lib/application/services/library/DigitalLibraryService';
	import type { LibraryItemDto } from '$lib/application/services/library/DigitalLibraryService';

	export let item: LibraryItemDto;
	export let viewMode: 'grid' | 'list' = 'grid';
	export let canManage = false;

	const dispatch = createEventDispatcher<{
		download: void;
		edit: void;
		delete: void;
		view: void;
	}>();

	let isLoading = false;

	async function handleDownload() {
		if (isLoading) return;
		isLoading = true;
		try {
			await digitalLibraryService.downloadFile(item);
			dispatch('download');
		} catch (error) {
			console.error('Download failed:', error);
		} finally {
			isLoading = false;
		}
	}

	async function handleView() {
		try {
			if (typeof window !== 'undefined') {
				window.sessionStorage.setItem('library:lastViewedId', String(item.id));
			}

			await digitalLibraryService.incrementViewCount(item.id);
			dispatch('view');
		} catch (error) {
			console.error('Error registrando vista del recurso:', error);
		} finally {
			goto(`/library/${item.id}`);
		}
	}

	function handleEdit() {
		dispatch('edit');
	}

	function handleDelete() {
		dispatch('delete');
	}

	function getFileTypeColor(fileType: string): string {
		const colors: { [key: string]: string } = {
			'image': 'from-green-400 to-green-600',
			'video': 'from-amber-400 to-orange-600',
			'audio': 'from-purple-400 to-purple-600',
			'document': 'from-red-400 to-red-600'
		};
		return colors[fileType] || 'from-gray-400 to-gray-600';
	}

	function getCategoryColor(category: string): string {
		const colors: { [key: string]: string } = {
			'victor-jara': 'from-red-100 to-red-200 text-red-800',
			'nueva-cancion': 'from-blue-100 to-blue-200 text-blue-800',
			'educacion-popular': 'from-green-100 to-green-200 text-green-800',
			'memoria-historica': 'from-purple-100 to-purple-200 text-purple-800',
			'talleres-eventos': 'from-indigo-100 to-indigo-200 text-indigo-800',
			'archivo-prensa': 'from-yellow-100 to-yellow-200 text-yellow-800',
			'audiovisual': 'from-pink-100 to-pink-200 text-pink-800',
			'literatura': 'from-teal-100 to-teal-200 text-teal-800',
			'general': 'from-gray-100 to-gray-200 text-gray-800'
		};
		return colors[category || 'general'] || 'from-gray-100 to-gray-200 text-gray-800';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getTags(): string[] {
		if (!item.tags) return [];
		// Si tags es un array, devolverlo directamente
		if (Array.isArray(item.tags)) return item.tags;
		// Si tags es una string, dividirla por comas
		if (typeof item.tags === 'string') {
			return item.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
		}
		return [];
	}
</script>

{#if viewMode === 'grid'}
	<!-- Vista de tarjeta -->
	<div
		data-testid="digital-library-card"
		class="group relative bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-sm rounded-3xl shadow-lg border-2 border-gray-100 hover:border-indigo-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 overflow-hidden flex flex-col"
	>
		<!-- Elementos decorativos -->
		<div class="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br {getFileTypeColor(item.fileType)} opacity-10 rounded-full group-hover:opacity-20 transition-opacity duration-300"></div>
		<div class="absolute bottom-4 left-4 w-8 h-8 bg-indigo-200/20 rounded-full group-hover:bg-indigo-300/30 transition-all duration-300"></div>

		<div class="relative z-10 p-6 flex flex-col flex-1">
			<!-- Header con tipo de archivo y acciones -->
			<div class="flex items-start justify-between mb-4">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 bg-gradient-to-br {getFileTypeColor(item.fileType)} rounded-2xl shadow-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
						<span class="text-xl text-white">{digitalLibraryService.getFileTypeIcon(item.fileType)}</span>
					</div>
					<div>
						<div class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{item.fileType}</div>
						<div class="text-xs text-gray-400">{digitalLibraryService.formatFileSize(item.fileSize)}</div>
					</div>
				</div>

				{#if canManage}
					<div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
						<button
							type="button"
							on:click={handleEdit}
							class="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-lg hover:shadow-xl"
							title="Editar"
							aria-label="Editar recurso"
						>
							<i class="fas fa-edit text-sm"></i>
						</button>
						<button
							type="button"
							on:click={handleDelete}
							class="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-lg hover:shadow-xl"
							title="Eliminar"
							aria-label="Eliminar recurso"
						>
							<i class="fas fa-trash text-sm"></i>
						</button>
					</div>
				{/if}
			</div>

			<!-- Título y descripción -->
			<div class="mb-4">
				<h3 class="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors duration-300">
					{item.title}
				</h3>
				{#if item.description}
					<p class="text-sm text-gray-600 line-clamp-3 leading-relaxed">
						{item.description}
					</p>
				{/if}
			</div>

			<!-- Metadatos -->
			<div class="space-y-2 mb-4">
				{#if item.author}
					<div class="flex items-center gap-2 text-sm">
						<span class="text-gray-400">👤</span>
						<span class="text-gray-700 font-medium">{item.author}</span>
					</div>
				{/if}

				{#if item.category}
					<div class="inline-block">
						<span class="inline-flex items-center gap-1 bg-gradient-to-r {getCategoryColor(item.category)} px-3 py-1 rounded-full text-xs font-bold">
							<span>📂</span>
							{item.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
						</span>
					</div>
				{/if}

				{#if item.year}
					<div class="flex items-center gap-2 text-sm">
						<span class="text-gray-400">📅</span>
						<span class="text-gray-700 font-medium">{item.year}</span>
					</div>
				{/if}

				{#if item.language}
					<div class="flex items-center gap-2 text-sm">
						<span class="text-gray-400">🌐</span>
						<span class="text-gray-700 font-medium">{item.language}</span>
					</div>
				{/if}
			</div>

			<!-- Tags -->
			{#if getTags().length > 0}
				<div class="mb-4">
					<div class="flex flex-wrap gap-1">
						{#each getTags().slice(0, 3) as tag}
							<span class="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-semibold">
								<span>🏷️</span>
								{tag}
							</span>
						{/each}
						{#if getTags().length > 3}
							<span class="text-xs text-gray-500 font-medium py-1">+{getTags().length - 3} más</span>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Sección fija al final: Estadísticas, Botones y Colecciones -->
			<div class="mt-auto">
				<!-- Estadísticas -->
				<div class="flex items-center justify-between mb-4 pt-4 border-t border-gray-100">
					<div class="flex items-center gap-4 text-sm text-gray-500">
						<div class="flex items-center gap-1">
							<span>👁️</span>
							<span>{item.viewCount}</span>
						</div>
						<div class="flex items-center gap-1">
							<span>⬇️</span>
							<span>{item.downloadCount}</span>
						</div>
					</div>
					<div class="text-xs text-gray-400">
						{formatDate(item.createdAt)}
					</div>
				</div>

				<!-- Acciones -->
				<div class="flex gap-3">
					<button
						type="button"
						on:click={handleView}
						class="flex-1 group/btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-bold"
					>
						<span class="text-sm group-hover/btn:scale-110 transition-transform duration-300">👁️</span>
						Ver
					</button>

					<button
						type="button"
						on:click={handleDownload}
						disabled={isLoading}
						class="flex-1 group/btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label={isLoading ? 'Descargando recurso' : 'Descargar recurso'}
					>
						{#if isLoading}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Descargando recurso"></div>
						{:else}
							<span class="text-sm group-hover/btn:scale-110 transition-transform duration-300">⬇️</span>
							Descargar
						{/if}
					</button>
				</div>

				<!-- Colecciones -->
				{#if item.collections && item.collections.length > 0}
					<div class="mt-4 pt-4 border-t border-gray-100">
						<div class="text-xs text-gray-500 mb-2 font-bold flex items-center gap-1">
							<span>📚</span>
							Colecciones:
						</div>
						<div class="flex flex-wrap gap-1">
							{#each item.collections.slice(0, 2) as collection}
								<span class="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-semibold">
									{collection.name}
								</span>
							{/each}
							{#if item.collections.length > 2}
								<span class="text-xs text-gray-500 font-medium py-1">+{item.collections.length - 2}</span>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<!-- Vista de lista -->
	<div
		data-testid="digital-library-card"
		class="group relative bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
	>
		<div class="relative z-10 p-6">
			<div class="flex items-start gap-6">
				<!-- Icono y tipo -->
				<div class="flex-shrink-0">
					<div class="w-16 h-16 bg-gradient-to-br {getFileTypeColor(item.fileType)} rounded-2xl shadow-lg flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
						<span class="text-2xl text-white">{digitalLibraryService.getFileTypeIcon(item.fileType)}</span>
					</div>
				</div>

				<!-- Contenido principal -->
				<div class="flex-1 min-w-0">
					<div class="flex items-start justify-between mb-3">
						<div>
							<h3 class="text-xl font-bold text-gray-800 mb-1 group-hover:text-indigo-700 transition-colors duration-300">
								{item.title}
							</h3>
							<div class="flex items-center gap-4 text-sm text-gray-500">
								<div class="flex items-center gap-1">
									<span>📁</span>
									<span class="font-medium">{item.fileType}</span>
								</div>
								<div class="flex items-center gap-1">
									<span>💾</span>
									<span>{digitalLibraryService.formatFileSize(item.fileSize)}</span>
								</div>
								{#if item.author}
									<div class="flex items-center gap-1">
										<span>👤</span>
										<span>{item.author}</span>
									</div>
								{/if}
								<div class="flex items-center gap-1">
									<span>📅</span>
									<span>{formatDate(item.createdAt)}</span>
								</div>
							</div>
						</div>

						{#if canManage}
							<div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<button
									type="button"
									on:click={handleEdit}
									class="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
									title="Editar"
									aria-label="Editar recurso"
								>
									<i class="fas fa-edit text-sm"></i>
								</button>
								<button
									type="button"
									on:click={handleDelete}
									class="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
									title="Eliminar"
									aria-label="Eliminar recurso"
								>
									<i class="fas fa-trash text-sm"></i>
								</button>
							</div>
						{/if}
					</div>

					{#if item.description}
						<p class="text-gray-600 mb-3 line-clamp-2">{item.description}</p>
					{/if}

					<!-- Metadatos en línea -->
					<div class="flex flex-wrap items-center gap-3 mb-3">
						{#if item.category}
							<span class="inline-flex items-center gap-1 bg-gradient-to-r {getCategoryColor(item.category)} px-3 py-1 rounded-full text-xs font-bold">
								<span>📂</span>
								{item.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
							</span>
						{/if}

						{#if item.language}
							<span class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-semibold">
								<span>🌐</span>
								{item.language}
							</span>
						{/if}

						{#if item.year}
							<span class="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-xs font-semibold">
								<span>📅</span>
								{item.year}
							</span>
						{/if}

						<div class="flex items-center gap-3 text-sm text-gray-500 ml-auto">
							<div class="flex items-center gap-1">
								<span>👁️</span>
								<span>{item.viewCount}</span>
							</div>
							<div class="flex items-center gap-1">
								<span>⬇️</span>
								<span>{item.downloadCount}</span>
							</div>
						</div>
					</div>

					<!-- Tags -->
					{#if getTags().length > 0}
						<div class="mb-3">
							<div class="flex flex-wrap gap-1">
								{#each getTags().slice(0, 5) as tag}
									<span class="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-semibold">
										<span>🏷️</span>
										{tag}
									</span>
								{/each}
								{#if getTags().length > 5}
									<span class="text-xs text-gray-500 font-medium py-1">+{getTags().length - 5} más</span>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Acciones -->
					<div class="flex gap-3">
						<button
							type="button"
							on:click={handleView}
							class="group/btn inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-bold"
						>
							<span class="text-sm group-hover/btn:scale-110 transition-transform duration-300">👁️</span>
							Ver
						</button>

						<button
							type="button"
							on:click={handleDownload}
							disabled={isLoading}
							class="group/btn inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-bold disabled:opacity-50"
							aria-label={isLoading ? 'Descargando recurso' : 'Descargar recurso'}
						>
							{#if isLoading}
								<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Descargando recurso"></div>
								Descargando...
							{:else}
								<span class="text-sm group-hover/btn:scale-110 transition-transform duration-300">⬇️</span>
								Descargar
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
	}

	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		line-clamp: 3;
		overflow: hidden;
	}
</style>
