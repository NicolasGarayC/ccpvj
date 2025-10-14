<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { digitalLibraryService } from '$lib/services/digitalLibraryService';
	import { jwtService } from '$lib/services/auth/jwtService.js';
	import DigitalLibraryCard from '$lib/components/library/DigitalLibraryCard.svelte';
	import DigitalLibraryFilters from '$lib/components/library/DigitalLibraryFilters.svelte';
	import type {
		LibraryItemDto,
		LibrarySearchDto,
		LibraryStatsDto,
		LibraryItemPagedResultDto
	} from '$lib/services/digitalLibraryService';

	// Estado de la aplicación
	let pagedResult: LibraryItemPagedResultDto | null = null;
	let stats: LibraryStatsDto | null = null;
	let isLoading = true;
	let error: string | null = null;

	// Permisos de usuario
	let isAuthenticated = false;
	let canManage = false;

	// Filtros y búsqueda
	let currentFilters: LibrarySearchDto = {};
	let viewMode: 'grid' | 'list' = 'grid';
	let searchTerm = '';
	let sortBy = 'created_at';
	let sortOrder: 'asc' | 'desc' = 'desc';
	let currentPage = 1;
	let itemsPerPage = 12;

	onMount(async () => {
		// Verificar permisos de usuario
		isAuthenticated = jwtService.isAuthenticated();
		if (isAuthenticated) {
			const user = jwtService.getUser();
			canManage = user?.role === 'colaborador' || user?.role === 'administrador';
		}

		// Cargar datos iniciales
		await loadLibraryData();
		await loadStats();
	});

	async function loadLibraryData() {
		try {
			isLoading = true;
			error = null;

			const searchDto: LibrarySearchDto = {
				...currentFilters,
				query: searchTerm || undefined,
				sortBy,
				sortOrder,
				page: currentPage,
				pageSize: itemsPerPage
			};

			pagedResult = await digitalLibraryService.getItems(searchDto);
		} catch (e) {
			error = $t('error.loading_resources');
			console.error(error, e);
		} finally {
			isLoading = false;
		}
	}

	async function loadStats() {
		try {
			stats = await digitalLibraryService.getStats();
		} catch (e) {
			console.error('Error loading stats:', e);
		}
	}

	function handleFiltersChange(event: CustomEvent<LibrarySearchDto>) {
		currentFilters = event.detail;
		currentPage = 1;
		loadLibraryData();
	}

	function handleSearch() {
		currentPage = 1;
		loadLibraryData();
	}

	function handleSortChange() {
		currentPage = 1;
		loadLibraryData();
	}

	function handlePageChange(page: number) {
		currentPage = page;
		loadLibraryData();
	}

	async function handleDownload(item: LibraryItemDto) {
		try {
			await digitalLibraryService.downloadFile(item);
			// Recargar stats para actualizar contador
			await loadStats();
		} catch (e) {
			error = $t('error.downloading_file');
		}
	}

	async function handleView(item: LibraryItemDto) {
		// El incremento de view count se maneja en el componente
		await loadStats();
	}

	function handleEdit(item: LibraryItemDto) {
		window.location.href = `/library/edit/${item.id}`;
	}

	async function handleDelete(item: LibraryItemDto) {
		if (!confirm($t('deleteConfirm'))) return;

		try {
			await digitalLibraryService.deleteItem(item.id);
			await loadLibraryData();
			await loadStats();
		} catch (e) {
			error = $t('error.deleting_resource');
		}
	}
</script>

<svelte:head>
	<title>{$t('library.title')} - Centro Cultural</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
	<div class="container mx-auto px-4 py-8 max-w-7xl">
		<!-- Header Juvenil Super Mejorado -->
		<div class="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-12 mb-12 border-2 border-indigo-100 overflow-hidden">
			<!-- Elementos decorativos animados -->
			<div class="absolute top-6 right-8 text-7xl opacity-20 animate-pulse">📚</div>
			<div class="absolute -top-6 -left-6 w-24 h-24 bg-indigo-200/30 rounded-full animate-bounce" style="animation-duration: 3s;"></div>
			<div class="absolute bottom-8 right-16 w-16 h-16 bg-purple-200/30 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
			<div class="absolute top-16 left-1/3 w-8 h-8 bg-pink-200/30 rounded-full animate-pulse" style="animation-delay: 2s;"></div>

			<div class="relative z-10 text-center">
				<h1 class="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
					<span class="text-4xl mr-3">📖</span>
					<span class="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-800 bg-clip-text text-transparent">
						{$t('library.title')}
					</span>
				</h1>
				<p class="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium mb-8">
					{$t('library.description')}
				</p>

				{#if canManage}
					<div class="mt-8">
						<a
							href="/library/create"
							class="group inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-10 py-5 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 text-lg font-bold border-2 border-green-400"
						>
							<span class="text-2xl group-hover:rotate-90 transition-transform duration-500">✨</span>
							{$t('library.addResource')}
							<i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
						</a>
					</div>
				{/if}
			</div>
		</div>

		<!-- Estadísticas Super Juveniles -->
		{#if stats}
			<div class="text-center mb-8">
				<h2 class="text-2xl md:text-3xl font-black text-gray-800 mb-4 flex items-center justify-center gap-3">
					<span class="text-3xl">📊</span>
					{$t('library.stats')}
				</h2>
				<p class="text-gray-600 font-medium">{$t('library.statsDescription')}</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
				<div class="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-lg border-2 border-blue-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 overflow-hidden">
					<!-- Elemento decorativo -->
					<div class="absolute -top-4 -right-4 w-16 h-16 bg-blue-300/20 rounded-full animate-pulse"></div>

					<div class="relative z-10 text-center">
						<div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
							<span class="text-2xl">📁</span>
						</div>
						<p class="text-sm font-bold text-blue-700 mb-2 uppercase tracking-wide">{$t('library.totalResources')}</p>
						<p class="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">{stats.totalItems}</p>
						<p class="text-xs text-blue-600 font-semibold">{$t('library.awesomeResources')}</p>
					</div>
				</div>

				<div class="group relative bg-gradient-to-br from-red-50 to-pink-100 rounded-3xl shadow-lg border-2 border-red-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 overflow-hidden">
					<div class="absolute -top-4 -right-4 w-16 h-16 bg-red-300/20 rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>

					<div class="relative z-10 text-center">
						<div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
							<span class="text-2xl">📄</span>
						</div>
						<p class="text-sm font-bold text-red-700 mb-2 uppercase tracking-wide">{$t('library.documents')}</p>
						<p class="text-4xl font-black bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">{stats.fileTypeDistribution.document || 0}</p>
						<p class="text-xs text-red-600 font-semibold">{$t('library.epicDocuments')}</p>
					</div>
				</div>

				<div class="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl shadow-lg border-2 border-purple-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 overflow-hidden">
					<div class="absolute -top-4 -right-4 w-16 h-16 bg-purple-300/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>

					<div class="relative z-10 text-center">
						<div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
							<span class="text-2xl">🎬</span>
						</div>
						<p class="text-sm font-bold text-purple-700 mb-2 uppercase tracking-wide">{$t('library.videos')}</p>
						<p class="text-4xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">{stats.fileTypeDistribution.video || 0}</p>
						<p class="text-xs text-purple-600 font-semibold">{$t('library.amazingVideos')}</p>
					</div>
				</div>

				<div class="group relative bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl shadow-lg border-2 border-green-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 overflow-hidden">
					<div class="absolute -top-4 -right-4 w-16 h-16 bg-green-300/20 rounded-full animate-pulse" style="animation-delay: 1.5s;"></div>

					<div class="relative z-10 text-center">
						<div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
							<span class="text-2xl">⬇️</span>
						</div>
						<p class="text-sm font-bold text-green-700 mb-2 uppercase tracking-wide">{$t('library.downloads')}</p>
						<p class="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">{stats.totalDownloads}</p>
						<p class="text-xs text-green-600 font-semibold">{$t('library.superPopular')}</p>
					</div>
				</div>
			</div>
		{/if}

	<!-- Componente de filtros -->
	<DigitalLibraryFilters
		on:filtersChange={handleFiltersChange}
		{currentFilters}
	/>

		<!-- Barra de búsqueda súper juvenil -->
		<div class="relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-indigo-100 p-8 mb-8 overflow-hidden">
			<!-- Elementos decorativos -->
			<div class="absolute -top-4 -right-4 w-20 h-20 bg-indigo-200/20 rounded-full animate-bounce" style="animation-duration: 4s;"></div>
			<div class="absolute bottom-4 left-8 w-12 h-12 bg-purple-200/20 rounded-full animate-pulse" style="animation-delay: 2s;"></div>

			<div class="relative z-10">
				<!-- Título de búsqueda -->
				<div class="text-center mb-8">
					<h2 class="text-2xl font-black text-gray-800 mb-2 flex items-center justify-center gap-3">
						<span class="text-2xl">🔍</span>
						{$t('library.findWhat')}
					</h2>
					<p class="text-gray-600 font-medium">{$t('library.exploreResources')}</p>
				</div>

				<div class="flex flex-col lg:flex-row gap-6 items-center justify-between">
					<!-- Búsqueda principal mejorada -->
					<div class="flex-1 max-w-2xl">
						<div class="relative group">
							<input
								type="text"
								placeholder="{$t('library.searchPlaceholder')}"
								bind:value={searchTerm}
								on:input={handleSearch}
								class="w-full pl-16 pr-8 py-5 text-lg border-3 border-indigo-200 rounded-2xl focus:ring-6 focus:ring-indigo-300/30 focus:border-indigo-400 transition-all duration-300 bg-white/80 focus:bg-white shadow-lg font-medium placeholder:text-gray-400"
							>
							<div class="absolute left-5 top-1/2 transform -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors duration-300">
								<span class="text-2xl">🔎</span>
							</div>
							{#if searchTerm}
								<button
									on:click={() => { searchTerm = ''; handleSearch(); }}
									class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1"
									aria-label="{$t('common.clearSearch')}"
								>
									<i class="fas fa-times text-lg"></i>
								</button>
							{/if}
						</div>
					</div>

					<!-- Controles juveniles -->
					<div class="flex items-center gap-4">
						<!-- Vista con emojis -->
						<div class="flex bg-white/70 backdrop-blur-sm border-2 border-indigo-200 rounded-2xl p-1.5 shadow-lg">
							<button
								class="group px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 font-bold {viewMode === 'grid' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'}"
								on:click={() => viewMode = 'grid'}
							>
								<span class="text-lg group-hover:rotate-12 transition-transform duration-300">🧩</span>
								<span class="hidden sm:inline">{$t('library.viewGrid')}</span>
							</button>
							<button
								class="group px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 font-bold {viewMode === 'list' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'}"
								on:click={() => viewMode = 'list'}
							>
								<span class="text-lg group-hover:scale-110 transition-transform duration-300">📋</span>
								<span class="hidden sm:inline">{$t('library.viewList')}</span>
							</button>
						</div>

						<!-- Ordenamiento mejorado -->
						<div class="relative">
							<select bind:value={sortBy} on:change={handleSortChange} class="appearance-none px-6 py-3 pr-10 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-300/20 focus:border-indigo-400 transition-all duration-300 bg-white/80 font-bold text-gray-700 shadow-lg">
								<option value="created_at">✨ {$t('library.sortMostRecent')}</option>
								<option value="title">🔤 {$t('library.sortNameAZ')}</option>
								<option value="download_count">🔥 {$t('library.sortMostPopular')}</option>
								<option value="view_count">👁️ {$t('library.sortMostViewed')}</option>
								<option value="publish_year">📅 {$t('library.sortByYear')}</option>
							</select>
							<div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400 pointer-events-none">
								<i class="fas fa-chevron-down"></i>
							</div>
						</div>

						<button
							on:click={() => { sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; handleSortChange(); }}
							class="group p-3 border-2 border-indigo-200 bg-white/80 rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
							title={sortOrder === 'asc' ? $t('library.orderAsc') : $t('library.orderDesc')}
						>
							<span class="text-xl group-hover:rotate-180 transition-transform duration-500">
								{sortOrder === 'asc' ? '⬆️' : '⬇️'}
							</span>
						</button>
					</div>
				</div>

				<!-- Resultados info juvenil -->
				<div class="mt-8 pt-6 border-t-2 border-indigo-100">
					<div class="text-center">
						{#if (pagedResult?.totalCount ?? 0) === 0}
							<p class="text-lg font-bold text-gray-600 flex items-center justify-center gap-2">
								<span class="text-2xl">😔</span>
								{$t('library.nothingFound')}
							</p>
						{:else if pagedResult}
							<div class="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl px-6 py-3">
								<span class="text-xl">🎯</span>
								<p class="font-bold text-gray-700">
									{$t('library.showing')} <span class="text-indigo-600 font-black">{(((pagedResult?.page ?? 1) - 1) * (pagedResult?.pageSize ?? itemsPerPage)) + 1} - {Math.min((pagedResult?.page ?? 1) * (pagedResult?.pageSize ?? itemsPerPage), pagedResult?.totalCount ?? 0)}</span>
									{$t('library.of')} <span class="text-purple-600 font-black">{pagedResult?.totalCount ?? 0}</span> {$t('library.resources')}
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

	<!-- Mostrar error si existe -->
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
			<div class="flex items-center">
				<i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
				<span class="text-red-700">{error}</span>
				<button
					on:click={() => error = null}
					class="ml-auto text-red-500 hover:text-red-700"
					aria-label="{$t('common.closeError')}"
				>
					<i class="fas fa-times"></i>
				</button>
			</div>
		</div>
	{/if}

		<!-- Loading state súper juvenil -->
		{#if isLoading}
			<div class="relative bg-gradient-to-br from-white/90 to-indigo-50/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-indigo-200 p-16 overflow-hidden">
				<!-- Elementos decorativos animados -->
				<div class="absolute top-8 right-8 text-6xl opacity-20 animate-bounce">⏳</div>
				<div class="absolute -top-4 -left-4 w-16 h-16 bg-indigo-300/20 rounded-full animate-pulse"></div>
				<div class="absolute bottom-4 right-4 w-12 h-12 bg-purple-300/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>

				<div class="relative z-10 text-center">
					<div class="relative inline-block mb-8">
						<!-- Spinner principal -->
						<div class="w-20 h-20 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
						<!-- Spinner secundario -->
						<div class="absolute inset-0 w-20 h-20 border-4 border-transparent border-l-purple-500 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
						<!-- Emoji central -->
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-2xl animate-pulse">📚</span>
						</div>
					</div>
					<h3 class="text-2xl md:text-3xl font-black text-gray-800 mb-4 flex items-center justify-center gap-3">
						<span class="text-3xl">🚀</span>
						{$t('library.loading')}
					</h3>
					<p class="text-lg text-gray-600 mb-4 font-medium">{$t('library.loadingMessage')}</p>
					<div class="flex items-center justify-center gap-2 text-indigo-600 font-bold">
						<span class="animate-pulse">✨</span>
						<span>{$t('library.searchingContent')}</span>
						<span class="animate-pulse">✨</span>
					</div>
				</div>
			</div>
	{:else if (pagedResult?.items?.length ?? 0) === 0}
			<!-- Estado vacío súper juvenil -->
			<div class="relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-gray-200 p-16 overflow-hidden">
				<!-- Elementos decorativos -->
				<div class="absolute top-6 right-6 text-6xl opacity-20">🔍</div>
				<div class="absolute -top-4 -left-4 w-16 h-16 bg-gray-300/20 rounded-full animate-pulse"></div>
				<div class="absolute bottom-6 right-12 w-12 h-12 bg-blue-300/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>

				<div class="relative z-10 text-center">
					<div class="mb-8">
						<div class="relative inline-block">
							<div class="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto shadow-lg mb-4">
								<span class="text-6xl">
							{#if (pagedResult?.totalCount ?? 0) === 0 && stats && stats.totalItems > 0}
										😅
									{:else}
										📚
									{/if}
								</span>
							</div>
							<!-- Elementos decorativos alrededor -->
							<div class="absolute -top-2 -right-2 w-8 h-8 bg-blue-200 rounded-full animate-pulse"></div>
							<div class="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-200 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
							<div class="absolute top-4 -left-4 w-4 h-4 bg-green-200 rounded-full animate-pulse" style="animation-delay: 2s;"></div>
						</div>
					</div>

					<h3 class="text-2xl md:text-3xl font-black text-gray-800 mb-6">
					{#if (pagedResult?.totalCount ?? 0) === 0 && stats && stats.totalItems > 0}
							{$t('library.noResults')}
						{:else}
							{$t('library.waitingForContent')}
						{/if}
					</h3>

					<p class="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed font-medium">
						{#if (pagedResult?.totalCount ?? 0) === 0 && stats && stats.totalItems > 0}
							{$t('library.tryOtherTerms')}
						{:else if canManage}
							{$t('library.beFirst')}
						{:else}
							{$t('library.soonContent')}
						{/if}
					</p>

					{#if (pagedResult?.totalCount ?? 0) === 0 && stats && stats.totalItems > 0}
						<button
							on:click={() => { currentFilters = {}; searchTerm = ''; loadLibraryData(); }}
							class="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 text-lg font-bold"
						>
							<span class="text-xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
							{$t('action.clearFilters')}
							<i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
						</button>
					{:else if canManage}
						<a
							href="/library/create"
							class="group inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 text-lg font-bold"
						>
							<span class="text-xl group-hover:rotate-90 transition-transform duration-500">✨</span>
							{$t('library.addFirstResource')}
							<i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
						</a>
					{/if}
				</div>
			</div>
		{:else if pagedResult}
			<!-- Lista/Grid de recursos mejorada -->
			<div class="mb-8">
				<div class="{viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8' : 'space-y-6'}">
					{#each (pagedResult?.items ?? []) as item (item.id)}
						<DigitalLibraryCard
							{item}
							{viewMode}
							{canManage}
							on:download={() => handleDownload(item)}
							on:view={() => handleView(item)}
							on:edit={() => handleEdit(item)}
							on:delete={() => handleDelete(item)}
						/>
					{/each}
				</div>
			</div>

			<!-- Paginación mejorada -->
			{#if (pagedResult?.totalPages ?? 0) > 1}
				<div class="flex items-center justify-center space-x-3 mt-12">
					<button
						on:click={() => handlePageChange(1)}
						disabled={(pagedResult?.page ?? 1) === 1}
						class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-indigo-300 transition-all duration-300 group"
						aria-label="{$t('common.goToFirstPage')}"
					>
						<i class="fas fa-angle-double-left text-lg group-hover:text-indigo-600 transition-colors"></i>
					</button>

					<button
						on:click={() => handlePageChange(Math.max(1, (pagedResult?.page ?? 1) - 1))}
						disabled={(pagedResult?.page ?? 1) === 1}
						class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-indigo-300 transition-all duration-300 group"
						aria-label="{$t('common.previousPage')}"
					>
						<i class="fas fa-angle-left text-lg group-hover:text-indigo-600 transition-colors"></i>
					</button>

					{#each Array.from({ length: Math.min(5, pagedResult?.totalPages ?? 0) }, (_, i) => {
						const start = Math.max(1, (pagedResult?.page ?? 1) - 2);
						const end = Math.min(pagedResult?.totalPages ?? 0, start + 4);
						return start + i;
					}).filter(page => page <= (pagedResult?.totalPages ?? 0)) as page}
						<button
							on:click={() => handlePageChange(page)}
							class="px-4 py-3 border-2 rounded-xl transition-all duration-300 font-semibold text-lg min-w-[3rem] {
								(pagedResult?.page ?? 1) === page
									? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg'
									: 'bg-white border-gray-200 hover:bg-gray-50 hover:border-indigo-300 text-gray-700 hover:text-indigo-600'
							}"
						>
							{page}
						</button>
					{/each}

					<button
						on:click={() => handlePageChange(Math.min(pagedResult?.totalPages ?? 1, (pagedResult?.page ?? 1) + 1))}
						disabled={(pagedResult?.page ?? 1) === (pagedResult?.totalPages ?? 1)}
						class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-indigo-300 transition-all duration-300 group"
						aria-label="{$t('common.nextPage')}"
					>
						<i class="fas fa-angle-right text-lg group-hover:text-indigo-600 transition-colors"></i>
					</button>

					<button
						on:click={() => handlePageChange(pagedResult?.totalPages ?? 1)}
						disabled={(pagedResult?.page ?? 1) === (pagedResult?.totalPages ?? 1)}
						class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-indigo-300 transition-all duration-300 group"
						aria-label="{$t('common.goToLastPage')}"
					>
						<i class="fas fa-angle-double-right text-lg group-hover:text-indigo-600 transition-colors"></i>
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
