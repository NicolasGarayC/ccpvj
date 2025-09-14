<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { LibraryResource } from '$lib/data/models/library';
	import { MEDIA_TYPE_LABELS, CATEGORY_LABELS } from '$lib/data/models/library';

	export let resource: LibraryResource;
	export let viewMode: 'grid' | 'list' = 'grid';
	export let canManage: boolean = false;

	const dispatch = createEventDispatcher<{
		download: void;
		edit: void;
		delete: void;
	}>();

	// Función para formatear el tamaño de archivo
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Función para formatear duración (para videos/audio)
	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	// Función para obtener el icono según el tipo de archivo
	function getFileIcon(mediaType: string): string {
		switch (mediaType) {
			case 'pdf': return 'fas fa-file-pdf text-red-500';
			case 'video': return 'fas fa-play-circle text-purple-500';
			case 'image': return 'fas fa-image text-blue-500';
			case 'audio': return 'fas fa-volume-up text-green-500';
			case 'document': return 'fas fa-file-alt text-gray-500';
			default: return 'fas fa-file text-gray-400';
		}
	}

	// Función para obtener el color de la categoría
	function getCategoryColor(category: string): string {
		switch (category) {
			case 'educacion': return 'bg-blue-100 text-blue-800';
			case 'cultura': return 'bg-purple-100 text-purple-800';
			case 'historia': return 'bg-yellow-100 text-yellow-800';
			case 'arte': return 'bg-pink-100 text-pink-800';
			case 'literatura': return 'bg-green-100 text-green-800';
			case 'ciencias': return 'bg-cyan-100 text-cyan-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function handleDownload() {
		dispatch('download');
	}

	function handleEdit() {
		dispatch('edit');
	}

	function handleDelete() {
		dispatch('delete');
	}
</script>

{#if viewMode === 'grid'}
	<!-- Vista en Grid -->
	<div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
		<!-- Header con icono y acciones -->
		<div class="flex items-start justify-between mb-4">
			<div class="flex items-center gap-3">
				<div class="flex-shrink-0">
					<i class="{getFileIcon(resource.mediaType)} text-2xl"></i>
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-semibold text-gray-900 truncate" title={resource.name}>
						{resource.name}
					</h3>
					<p class="text-sm text-gray-500">
						{MEDIA_TYPE_LABELS[resource.mediaType]} • {formatFileSize(resource.fileSize)}
					</p>
				</div>
			</div>
			
			{#if canManage}
				<div class="flex items-center gap-1">
					<button
						on:click={handleEdit}
						class="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
						title="Editar recurso"
					>
						<i class="fas fa-edit"></i>
					</button>
					<button
						on:click={handleDelete}
						class="p-2 text-gray-400 hover:text-red-600 transition-colors"
						title="Eliminar recurso"
					>
						<i class="fas fa-trash"></i>
					</button>
				</div>
			{/if}
		</div>

		<!-- Metadatos -->
		<div class="space-y-3 mb-4">
			<!-- Autores -->
			<div>
				<p class="text-sm font-medium text-gray-700">Autores:</p>
				<p class="text-sm text-gray-600">{resource.authors.join(', ')}</p>
			</div>

			<!-- Descripción -->
			{#if resource.description}
				<div>
					<p class="text-sm text-gray-600 line-clamp-3" title={resource.description}>
						{resource.description}
					</p>
				</div>
			{/if}

			<!-- Metadatos adicionales -->
			<div class="flex flex-wrap gap-2 text-xs">
				<!-- Categoría -->
				<span class="px-2 py-1 rounded-full {getCategoryColor(resource.category)}">
					{CATEGORY_LABELS[resource.category]}
				</span>

				<!-- Año de publicación -->
				{#if resource.publishYear}
					<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
						{resource.publishYear}
					</span>
				{/if}

				<!-- Idioma -->
				<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
					{resource.language.toUpperCase()}
				</span>

				<!-- Duración (para videos/audio) -->
				{#if resource.duration}
					<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
						<i class="fas fa-clock mr-1"></i>
						{formatDuration(resource.duration)}
					</span>
				{/if}

				<!-- Destacado -->
				{#if resource.isFeatured}
					<span class="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
						<i class="fas fa-star mr-1"></i>
						Destacado
					</span>
				{/if}
			</div>

			<!-- Tags -->
			{#if resource.tags && resource.tags.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each resource.tags.slice(0, 3) as tag}
						<span class="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">
							#{tag}
						</span>
					{/each}
					{#if resource.tags.length > 3}
						<span class="text-xs text-gray-500">+{resource.tags.length - 3} más</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Footer con estadísticas y acción -->
		<div class="flex items-center justify-between pt-4 border-t border-gray-100">
			<div class="flex items-center gap-4 text-sm text-gray-500">
				<span>
					<i class="fas fa-download mr-1"></i>
					{resource.downloadCount}
				</span>
				<span>
					<i class="fas fa-calendar mr-1"></i>
					{new Date(resource.uploadedAt).toLocaleDateString()}
				</span>
			</div>

			{#if resource.downloadable}
				<button
					on:click={handleDownload}
					class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
				>
					<i class="fas fa-download mr-1"></i>
					Descargar
				</button>
			{:else}
				<span class="text-sm text-gray-400">No disponible</span>
			{/if}
		</div>
	</div>
{:else}
	<!-- Vista en Lista -->
	<div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
		<div class="flex items-center gap-4">
			<!-- Icono -->
			<div class="flex-shrink-0">
				<i class="{getFileIcon(resource.mediaType)} text-xl"></i>
			</div>

			<!-- Información principal -->
			<div class="flex-1 min-w-0">
				<div class="flex items-start justify-between">
					<div class="flex-1 min-w-0">
						<h3 class="text-lg font-semibold text-gray-900 truncate">
							{resource.name}
						</h3>
						<p class="text-sm text-gray-600 mb-2">
							Por {resource.authors.join(', ')}
							{#if resource.publishYear} • {resource.publishYear}{/if}
						</p>
						
						{#if resource.description}
							<p class="text-sm text-gray-600 line-clamp-2 mb-2">
								{resource.description}
							</p>
						{/if}

						<!-- Metadatos en línea -->
						<div class="flex flex-wrap gap-2 text-xs">
							<span class="px-2 py-1 rounded-full {getCategoryColor(resource.category)}">
								{CATEGORY_LABELS[resource.category]}
							</span>
							<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
								{MEDIA_TYPE_LABELS[resource.mediaType]}
							</span>
							<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
								{formatFileSize(resource.fileSize)}
							</span>
							{#if resource.duration}
								<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
									{formatDuration(resource.duration)}
								</span>
							{/if}
							{#if resource.isFeatured}
								<span class="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
									<i class="fas fa-star mr-1"></i>
									Destacado
								</span>
							{/if}
						</div>
					</div>

					<!-- Acciones -->
					<div class="flex items-center gap-2 ml-4">
						<div class="text-sm text-gray-500 text-right">
							<div>
								<i class="fas fa-download mr-1"></i>
								{resource.downloadCount}
							</div>
							<div class="text-xs">
								{new Date(resource.uploadedAt).toLocaleDateString()}
							</div>
						</div>

						{#if resource.downloadable}
							<button
								on:click={handleDownload}
								class="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
							>
								<i class="fas fa-download mr-1"></i>
								Descargar
							</button>
						{/if}

						{#if canManage}
							<div class="flex gap-1">
								<button
									on:click={handleEdit}
									class="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
									title="Editar"
								>
									<i class="fas fa-edit"></i>
								</button>
								<button
									on:click={handleDelete}
									class="p-2 text-gray-400 hover:text-red-600 transition-colors"
									title="Eliminar"
								>
									<i class="fas fa-trash"></i>
								</button>
							</div>
						{/if}
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
		overflow: hidden;
	}

	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>