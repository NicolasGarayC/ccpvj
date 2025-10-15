<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { digitalLibraryService, type LibraryItemDto } from '$lib/services/digitalLibraryService';
	import { jwtService } from '$lib/services/auth/jwtService.js';

	export let params: { id: string };

	let item: LibraryItemDto | null = null;
	let isLoading = true;
	let error: string | null = null;
	let canManage = false;
	let fileUrl = '';
	let previewType: 'image' | 'video' | 'audio' | 'pdf' | 'none' = 'none';

	onMount(async () => {
		await loadItem();
	});

	function resolveFileUrl(path: string): string {
		if (!path) return '';
		return path.startsWith('/media/') ? path : `/media/${path.replace(/^\/+/, '')}`;
	}

	function resolvePreviewType(resource: LibraryItemDto): typeof previewType {
		const mime = resource.mimeType?.toLowerCase() ?? '';
		const type = resource.fileType?.toLowerCase() ?? '';

		if (type === 'image' || mime.startsWith('image/')) return 'image';
		if (type === 'video' || mime.startsWith('video/')) return 'video';
		if (type === 'audio' || mime.startsWith('audio/')) return 'audio';
		if (mime === 'application/pdf' || resource.fileName?.toLowerCase().endsWith('.pdf')) return 'pdf';
		return 'none';
	}

	async function loadItem() {
		try {
			isLoading = true;
			error = null;

			// permisos
			canManage = jwtService.isAuthenticated() && ['colaborador', 'administrador'].includes(jwtService.getUser()?.role ?? '');

			const resource = await digitalLibraryService.getItemById(params.id);

			if (!resource) {
				error = $t('library.resourceNotFound') ?? 'Recurso no encontrado';
				item = null;
				return;
			}

			item = resource;
			fileUrl = resolveFileUrl(resource.filePath);
			previewType = resolvePreviewType(resource);

			// incrementar vista solo si no se hizo desde la tarjeta
			if (typeof window !== 'undefined') {
				const flagKey = 'library:lastViewedId';
				const lastViewed = window.sessionStorage.getItem(flagKey);
				if (lastViewed !== resource.id) {
					await digitalLibraryService.incrementViewCount(resource.id);
				} else {
					window.sessionStorage.removeItem(flagKey);
				}
			} else {
				await digitalLibraryService.incrementViewCount(resource.id);
			}
		} catch (err) {
			console.error('Error cargando recurso de biblioteca', err);
			error = $t('error.loading_resource_details') ?? 'Ocurrió un error al cargar el recurso.';
			item = null;
		} finally {
			isLoading = false;
		}
	}

	async function downloadFile() {
		if (!item) return;
		try {
			await digitalLibraryService.downloadFile(item);
		} catch (err) {
			console.error('Error al descargar recurso', err);
		}
	}

	function openFileInNewTab() {
		if (!fileUrl) return;
		window.open(fileUrl, '_blank', 'noopener,noreferrer');
	}

	function goBack() {
		goto('/library');
	}

	function editResource() {
		if (!item) return;
		goto(`/library/edit/${item.id}`);
	}

	function getTags(): string[] {
		if (!item?.tags) return [];
		if (Array.isArray(item.tags)) return item.tags;
		if (typeof item.tags === 'string') {
			return item.tags
				.split(',')
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0);
		}
		return [];
	}
</script>

<svelte:head>
	<title>{item ? `${item.title} - ${$t('library.title')}` : ($t('library.resourceDetails') || 'Detalles del recurso')}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
	<div class="container mx-auto px-4 max-w-6xl">
		<!-- Barra superior -->
		<div class="flex flex-wrap items-center justify-between gap-4 mb-8">
			<button
				class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-700 font-semibold shadow-sm border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
				on:click={goBack}
			>
				<i class="fas fa-arrow-left"></i>
				<span>{$t('action.back') || 'Volver a la biblioteca'}</span>
			</button>

			{#if canManage && item}
				<button
					class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
					on:click={editResource}
				>
					<i class="fas fa-edit"></i>
					<span>{$t('library.editResource') || 'Editar recurso'}</span>
				</button>
			{/if}
		</div>

		{#if isLoading}
			<div class="flex flex-col items-center justify-center py-24 gap-4 text-gray-600">
				<div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
				<span>{$t('loading') || 'Cargando recurso...'}</span>
			</div>
		{:else if error}
			<div class="bg-white border-2 border-red-200 rounded-3xl shadow-lg p-8 text-center">
				<div class="text-4xl mb-4">⚠️</div>
				<p class="text-lg text-red-700 font-semibold">{error}</p>
			</div>
		{:else if item}
			<div class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
				<!-- Panel detalle -->
				<section class="bg-white rounded-3xl shadow-xl border border-indigo-100 p-8 space-y-6">
					<div>
						<h1 class="text-3xl md:text-4xl font-black text-gray-900 mb-3">{item.title}</h1>
						{#if item.description}
							<p class="text-gray-600 text-lg leading-relaxed">{item.description}</p>
						{/if}
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="info-card">
							<h3>📁 {$t('library.fileType') || 'Tipo de archivo'}</h3>
							<p>{item.fileType}</p>
						</div>
						<div class="info-card">
							<h3>💾 {$t('library.fileSize') || 'Tamaño'}</h3>
							<p>{digitalLibraryService.formatFileSize(item.fileSize)}</p>
						</div>
						{#if item.author}
							<div class="info-card">
								<h3>👤 {$t('library.author') || 'Autor'}</h3>
								<p>{item.author}</p>
							</div>
						{/if}
						{#if item.language}
							<div class="info-card">
								<h3>🌐 {$t('library.language') || 'Idioma'}</h3>
								<p>{item.language}</p>
							</div>
						{/if}
						{#if item.year}
							<div class="info-card">
								<h3>📅 {$t('library.year') || 'Año'}</h3>
								<p>{item.year}</p>
							</div>
						{/if}
						<div class="info-card">
							<h3>👁️ {$t('library.views') || 'Visualizaciones'}</h3>
							<p>{item.viewCount}</p>
						</div>
						<div class="info-card">
							<h3>⬇️ {$t('library.downloads') || 'Descargas'}</h3>
							<p>{item.downloadCount}</p>
						</div>
					</div>

					{#if item.category}
						<div class="flex flex-wrap items-center gap-3">
							<span class="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold">
								<span>📂</span>
								{item.category}
							</span>

							{#if item.collections && item.collections.length > 0}
								<div class="flex flex-wrap gap-2">
									{#each item.collections as collection}
										<span class="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
											<span>📚</span>{collection.name}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					{#if getTags().length > 0}
						<div>
							<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{$t('library.tags') || 'Etiquetas'}</h3>
							<div class="flex flex-wrap gap-2">
								{#each getTags() as tag}
									<span class="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
										<span>🏷️</span>{tag}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<div class="flex flex-wrap gap-4">
						<button
							on:click={openFileInNewTab}
							class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
						>
							<span>👁️</span>
							{$t('library.openResource') || 'Abrir recurso'}
						</button>

						<button
							on:click={downloadFile}
							class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all"
						>
							<span>⬇️</span>
							{$t('library.downloadResource') || 'Descargar'}
						</button>
					</div>
				</section>

				<!-- Panel vista previa -->
				<section class="bg-white rounded-3xl shadow-xl border border-purple-100 p-6 flex flex-col">
					<h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
						<span>🔍</span>
						{$t('library.preview') || 'Vista previa'}
					</h2>

					{#if previewType === 'image'}
						<div class="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-50 flex items-center justify-center">
							<img src={fileUrl} alt={item.title} class="max-h-[480px] w-full object-contain" loading="lazy" />
						</div>
					{:else if previewType === 'video'}
						<div class="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-black">
							<!-- svelte-ignore a11y-media-has-caption -->
							<video src={fileUrl} controls class="w-full h-full"></video>
						</div>
					{:else if previewType === 'audio'}
						<div class="flex flex-col items-center justify-center gap-4 flex-1 rounded-2xl border border-gray-200 bg-slate-50 p-8 text-center">
							<i class="fas fa-music text-5xl text-purple-400"></i>
							<p class="text-gray-600 font-medium">{$t('library.audioPreview') || 'Escucha el recurso de audio'}</p>
							<audio src={fileUrl} controls class="w-full"></audio>
						</div>
					{:else if previewType === 'pdf'}
						<div class="relative flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-white">
							<iframe src={`${fileUrl}#toolbar=0`} class="w-full h-full min-h-[480px]" title={item.title}></iframe>
						</div>
					{:else}
						<div class="flex flex-col items-center justify-center gap-3 flex-1 rounded-2xl border border-gray-200 bg-slate-50 p-10 text-center text-gray-500">
							<i class="fas fa-file-alt text-5xl text-indigo-300"></i>
							<p class="text-lg font-semibold">{$t('library.previewUnavailable') || 'Vista previa no disponible'}</p>
							<p class="text-sm text-gray-500 max-w-xs">
								{$t('library.previewUnavailableDescription') ||
									'Utiliza los botones para abrir o descargar el archivo en una nueva ventana.'}
							</p>
						</div>
					{/if}

					{#if item.fileName}
						<div class="mt-4 p-4 border border-gray-200 rounded-2xl bg-gray-50 text-sm text-gray-600 flex items-center gap-3">
							<i class="fas fa-paperclip text-gray-400"></i>
							<div>
								<p class="font-semibold text-gray-700">{item.fileName}</p>
								<p>{$t('library.filePath') || 'Ruta del archivo'}: <span class="font-mono text-xs">{item.filePath}</span></p>
							</div>
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</div>
</div>

<style>
	.info-card {
		background: linear-gradient(to bottom right, #f9fafb, #ffffff);
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		padding: 1rem 1.25rem;
		box-shadow: 0 10px 15px -10px rgba(15, 23, 42, 0.15);
	}

	.info-card h3 {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #9ca3af;
		margin-bottom: 0.35rem;
	}

	.info-card p {
		font-size: 1.05rem;
		font-weight: 600;
		color: #1f2933;
	}
</style>
