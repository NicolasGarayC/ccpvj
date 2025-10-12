<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let currentPage: number;
	export let totalPages: number;
	export let hasNext: boolean;
	export let hasPrevious: boolean;
	export let showRange: number = 5; // Number of page buttons to show

	const dispatch = createEventDispatcher();

	$: visiblePages = calculateVisiblePages(currentPage, totalPages, showRange);

	function calculateVisiblePages(current: number, total: number, range: number): number[] {
		const pages: number[] = [];
		const halfRange = Math.floor(range / 2);
		
		let start = Math.max(1, current - halfRange);
		let end = Math.min(total, current + halfRange);
		
		// Adjust start if we're near the end
		if (end - start + 1 < range) {
			start = Math.max(1, end - range + 1);
		}
		
		// Adjust end if we're near the beginning
		if (end - start + 1 < range) {
			end = Math.min(total, start + range - 1);
		}
		
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		
		return pages;
	}

	function goToPage(page: number) {
		if (page !== currentPage && page >= 1 && page <= totalPages) {
			dispatch('pageChange', page);
		}
	}

	function goToPrevious() {
		if (hasPrevious) {
			goToPage(currentPage - 1);
		}
	}

	function goToNext() {
		if (hasNext) {
			goToPage(currentPage + 1);
		}
	}

	function goToFirst() {
		if (currentPage !== 1) {
			goToPage(1);
		}
	}

	function goToLast() {
		if (currentPage !== totalPages) {
			goToPage(totalPages);
		}
	}
</script>

{#if totalPages > 1}
	<nav class="pagination" aria-label="Navegación de páginas">
		<div class="pagination-info">
			<span>Página {currentPage} de {totalPages}</span>
		</div>

		<div class="pagination-controls">
			<!-- First page button -->
			<button
				class="pagination-btn"
				class:disabled={!hasPrevious}
				on:click={goToFirst}
				disabled={!hasPrevious}
				aria-label="Primera página"
				title="Primera página"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="11,19 2,12 11,5 11,19"></polygon>
					<polygon points="22,19 13,12 22,5 22,19"></polygon>
				</svg>
			</button>

			<!-- Previous page button -->
			<button
				class="pagination-btn"
				class:disabled={!hasPrevious}
				on:click={goToPrevious}
				disabled={!hasPrevious}
				aria-label="Página anterior"
				title="Página anterior"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15,18 9,12 15,6"></polyline>
				</svg>
			</button>

			<!-- Page numbers -->
			{#if visiblePages[0] > 1}
				<button class="pagination-btn" on:click={() => goToPage(1)}>1</button>
				{#if visiblePages[0] > 2}
					<span class="pagination-ellipsis">...</span>
				{/if}
			{/if}

			{#each visiblePages as page}
				<button
					class="pagination-btn"
					class:active={page === currentPage}
					on:click={() => goToPage(page)}
					aria-label="Página {page}"
					aria-current={page === currentPage ? 'page' : undefined}
				>
					{page}
				</button>
			{/each}

			{#if visiblePages[visiblePages.length - 1] < totalPages}
				{#if visiblePages[visiblePages.length - 1] < totalPages - 1}
					<span class="pagination-ellipsis">...</span>
				{/if}
				<button class="pagination-btn" on:click={() => goToPage(totalPages)}>{totalPages}</button>
			{/if}

			<!-- Next page button -->
			<button
				class="pagination-btn"
				class:disabled={!hasNext}
				on:click={goToNext}
				disabled={!hasNext}
				aria-label="Página siguiente"
				title="Página siguiente"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9,18 15,12 9,6"></polyline>
				</svg>
			</button>

			<!-- Last page button -->
			<button
				class="pagination-btn"
				class:disabled={!hasNext}
				on:click={goToLast}
				disabled={!hasNext}
				aria-label="Última página"
				title="Última página"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polygon points="13,19 22,12 13,5 13,19"></polygon>
					<polygon points="2,19 11,12 2,5 2,19"></polygon>
				</svg>
			</button>
		</div>
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
		padding: 1rem 0;
	}

	.pagination-info {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.pagination-btn {
		min-width: 2.5rem;
		height: 2.5rem;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		background: white;
		color: var(--color-text-primary);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.pagination-btn:hover:not(.disabled) {
		background: var(--color-primary-light);
		border-color: var(--color-primary);
		color: var(--color-primary-dark);
	}

	.pagination-btn.active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.pagination-btn.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pagination-btn.disabled:hover {
		background: white;
		border-color: var(--color-border);
		color: var(--color-text-primary);
	}

	.pagination-ellipsis {
		padding: 0.5rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.pagination {
			gap: 0.75rem;
		}
		
		.pagination-controls {
			gap: 0.125rem;
		}

		.pagination-btn {
			min-width: 2.25rem;
			height: 2.25rem;
			font-size: 0.8rem;
		}

		.pagination-info {
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.pagination-controls {
			flex-wrap: wrap;
			justify-content: center;
		}
	}
</style>