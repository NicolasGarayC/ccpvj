<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { courseService, type CourseSearchParams } from '$lib/services/courseService';

	export let searchParams: CourseSearchParams;

	const dispatch = createEventDispatcher();
	
	let availableSubjects: string[] = [];
	let searchTerm = searchParams.searchTerm || '';
	let selectedSubject = searchParams.subject || '';
	let selectedSort = searchParams.sortBy || 'created_desc';
	let showFeaturedOnly = searchParams.isFeatured || false;
	let showActiveOnly = searchParams.isActive !== false; // default to true unless explicitly false

	const sortOptions = [
		{ value: 'created_desc', label: 'Más recientes primero' },
		{ value: 'created_asc', label: 'Más antiguos primero' },
		{ value: 'title_asc', label: 'Título (A-Z)' },
		{ value: 'featured_desc', label: 'Destacados primero' }
	];

	onMount(async () => {
		try {
			availableSubjects = await courseService.getAvailableSubjects();
		} catch (err) {
			console.error('Error loading subjects:', err);
		}
	});

	function handleSearch() {
		const newSearchParams: CourseSearchParams = {
			...searchParams,
			searchTerm: searchTerm.trim() || undefined,
			subject: selectedSubject || undefined,
			sortBy: selectedSort,
			isFeatured: showFeaturedOnly || undefined,
			isActive: showActiveOnly ? undefined : true, // only filter if false
			page: 1
		};
		
		dispatch('search', newSearchParams);
	}

	function handleReset() {
		searchTerm = '';
		selectedSubject = '';
		selectedSort = 'created_desc';
		showFeaturedOnly = false;
		showActiveOnly = true;
		
		const resetParams: CourseSearchParams = {
			page: 1,
			pageSize: searchParams.pageSize,
			sortBy: 'created_desc'
		};
		
		dispatch('search', resetParams);
	}

	function handleKeypress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}
</script>

<div class="search-filters">
	<div class="filter-row">
		<div class="search-input">
			<label for="search">Buscar cursos</label>
			<input 
				id="search"
				type="text" 
				bind:value={searchTerm}
				on:keypress={handleKeypress}
				placeholder="Buscar por título o descripción..."
				class="input"
			/>
		</div>

		<div class="filter-select">
			<label for="subject">Materia</label>
			<select 
				id="subject"
				bind:value={selectedSubject}
				class="select"
			>
				<option value="">Todas las materias</option>
				{#each availableSubjects as subject}
					<option value={subject}>{subject}</option>
				{/each}
			</select>
		</div>

		<div class="filter-select">
			<label for="sort">Ordenar por</label>
			<select 
				id="sort"
				bind:value={selectedSort}
				class="select"
			>
				{#each sortOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="filter-row">
		<div class="checkbox-group">
			<label class="checkbox-label">
				<input 
					type="checkbox" 
					bind:checked={showFeaturedOnly}
					class="checkbox"
				/>
				Solo cursos destacados
			</label>

			<label class="checkbox-label">
				<input 
					type="checkbox" 
					bind:checked={showActiveOnly}
					class="checkbox"
				/>
				Solo cursos activos
			</label>
		</div>

		<div class="action-buttons">
			<button 
				class="btn btn-outline"
				on:click={handleReset}
				type="button"
			>
				Limpiar
			</button>
			<button 
				class="btn btn-primary"
				on:click={handleSearch}
				type="button"
			>
				Buscar
			</button>
		</div>
	</div>
</div>

<style>
	.search-filters {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
		flex: 1;
	}

	.filter-row {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		margin-bottom: 1rem;
	}

	.filter-row:last-child {
		margin-bottom: 0;
	}

	.search-input {
		flex: 2;
		min-width: 200px;
	}

	.filter-select {
		flex: 1;
		min-width: 150px;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--color-text-primary);
		font-size: 0.9rem;
	}

	.input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s ease;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
	}

	.select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 1rem;
		background: white;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}

	.select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
	}

	.checkbox-group {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		flex: 1;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: normal;
	}

	.checkbox {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	@media (max-width: 1024px) {
		.filter-row {
			flex-wrap: wrap;
		}

		.search-input {
			flex: 100%;
			min-width: auto;
		}

		.filter-select {
			flex: 1;
			min-width: 120px;
		}
	}

	@media (max-width: 768px) {
		.search-filters {
			padding: 1rem;
		}

		.filter-row {
			flex-direction: column;
			align-items: stretch;
		}

		.checkbox-group {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.action-buttons {
			justify-content: center;
			margin-top: 1rem;
		}
	}
</style>