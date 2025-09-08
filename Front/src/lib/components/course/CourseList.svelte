<script lang="ts">
	import { onMount } from 'svelte';
	import { courseService, type Course, type CourseSearchParams, type CoursePagedResult } from '$lib/services/course/courseService';
	import CourseCard from './CourseCard.svelte';
	import SearchFilters from './SearchFilters.svelte';
	import Pagination from '../common/Pagination.svelte';

	export let showSearchFilters = true;
	export let showCreateButton = false;
	export let limit: number | undefined = undefined;
	export let featured = false;

	let courses: Course[] = [];
	let loading = true;
	let error = '';
	let pagedResult: CoursePagedResult | null = null;

	let searchParams: CourseSearchParams = {
		page: 1,
		pageSize: limit || 12,
		sortBy: 'created_desc'
	};

	if (featured) {
		searchParams.isFeatured = true;
	}

	onMount(() => {
		loadCourses();
	});

	async function loadCourses() {
		try {
			loading = true;
			error = '';

			if (featured && limit) {
				courses = await courseService.getFeaturedCourses(limit);
			} else if (limit && !showSearchFilters) {
				const result = await courseService.getCourses({
					pageSize: limit,
					page: 1,
					...searchParams
				});
				courses = result.courses;
			} else {
				pagedResult = await courseService.getCourses(searchParams);
				courses = pagedResult.courses;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error cargando cursos';
			console.error('Error loading courses:', err);
		} finally {
			loading = false;
		}
	}

	async function handleSearch(newSearchParams: CourseSearchParams) {
		searchParams = { ...searchParams, ...newSearchParams, page: 1 };
		await loadCourses();
	}

	async function handlePageChange(page: number) {
		searchParams = { ...searchParams, page };
		await loadCourses();
	}

	function handleCreateCourse() {
		// This will be handled by parent component or navigation
		const event = new CustomEvent('createCourse');
		dispatchEvent(event);
	}
</script>

<div class="course-list">
	{#if showSearchFilters}
		<div class="filters-section">
			<SearchFilters 
				{searchParams}
				on:search={(e) => handleSearch(e.detail)}
			/>
			
			{#if showCreateButton}
				<button 
					class="btn btn-primary create-btn"
					on:click={handleCreateCourse}
				>
					Crear Curso
				</button>
			{/if}
		</div>
	{:else if showCreateButton}
		<div class="header-section">
			<button 
				class="btn btn-primary create-btn"
				on:click={handleCreateCourse}
			>
				Crear Curso
			</button>
		</div>
	{/if}

	{#if loading}
		<div class="loading">
			<div class="loading-spinner"></div>
			<p>Cargando cursos...</p>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
			<button class="btn btn-outline" on:click={loadCourses}>
				Reintentar
			</button>
		</div>
	{:else if courses.length === 0}
		<div class="empty-state">
			<p>No se encontraron cursos</p>
			{#if showCreateButton}
				<button 
					class="btn btn-primary"
					on:click={handleCreateCourse}
				>
					Crear el primer curso
				</button>
			{/if}
		</div>
	{:else}
		<div class="courses-grid">
			{#each courses as course (course.id)}
				<CourseCard {course} />
			{/each}
		</div>

		{#if pagedResult && pagedResult.totalPages > 1}
			<Pagination 
				currentPage={pagedResult.page}
				totalPages={pagedResult.totalPages}
				hasNext={pagedResult.hasNextPage}
				hasPrevious={pagedResult.hasPreviousPage}
				on:pageChange={(e) => handlePageChange(e.detail)}
			/>
		{/if}
	{/if}
</div>

<style>
	.course-list {
		width: 100%;
	}

	.filters-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.header-section {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 2rem;
	}

	.create-btn {
		white-space: nowrap;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.loading-spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid var(--color-border);
		border-top: 3px solid var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		gap: 1rem;
	}

	.error p {
		color: var(--color-error);
		margin: 0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		gap: 1rem;
	}

	.empty-state p {
		color: var(--color-text-muted);
		margin: 0;
		font-size: 1.1rem;
	}

	.courses-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.filters-section {
			flex-direction: column;
			align-items: stretch;
		}

		.courses-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}
</style>