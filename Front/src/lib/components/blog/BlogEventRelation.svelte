<script lang="ts">
	import { onMount } from 'svelte';
	import { calendarService, type EventSummary } from '$lib/services/calendar/calendarService';

	export let blogPostId: string | undefined = undefined;
	export let compact: boolean = false;
	export let onChange: ((eventIds: string[]) => void) | undefined = undefined;

	let loading = false;
	let error: string | null = null;
	let searchTerm = '';
	let showDropdown = false;

	// Available events to select from
	let allEvents: EventSummary[] = [];
	let filteredEvents: EventSummary[] = [];

	// Selected event IDs (for creating the relation)
	let selectedEventIds: string[] = [];

	onMount(async () => {
		await loadAvailableEvents();
	});

	async function loadAvailableEvents() {
		loading = true;
		error = null;

		try {
			allEvents = await calendarService.getUpcomingEvents(50);
			filteredEvents = allEvents.slice(0, 10);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error cargando eventos';
			console.error('Error loading events:', err);
		} finally {
			loading = false;
		}
	}

	function filterEvents() {
		if (!searchTerm.trim()) {
			filteredEvents = allEvents.slice(0, 10);
			return;
		}

		const term = searchTerm.toLowerCase();
		filteredEvents = allEvents
			.filter((event) => event.title.toLowerCase().includes(term))
			.slice(0, 10);
	}

	function toggleEvent(eventId: string) {
		const index = selectedEventIds.indexOf(eventId);
		if (index > -1) {
			selectedEventIds = selectedEventIds.filter((id) => id !== eventId);
		} else {
			selectedEventIds = [...selectedEventIds, eventId];
		}

		if (onChange) {
			onChange(selectedEventIds);
		}
	}

	function removeEvent(eventId: string) {
		selectedEventIds = selectedEventIds.filter((id) => id !== eventId);
		if (onChange) {
			onChange(selectedEventIds);
		}
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getEventById(id: string): EventSummary | undefined {
		return allEvents.find((e) => e.id === id);
	}

	$: {
		searchTerm;
		filterEvents();
	}
</script>

<div class="blog-event-relation" class:compact>
	{#if error}
		<div class="error-message">
			{error}
			<button on:click={() => (error = null)} class="close-btn">×</button>
		</div>
	{/if}

	<!-- Selected Events Display -->
	{#if selectedEventIds.length > 0}
		<div class="selected-events">
			<h4 class="section-title">Eventos Relacionados ({selectedEventIds.length})</h4>

			<div class="event-list">
				{#each selectedEventIds as eventId (eventId)}
					{@const event = getEventById(eventId)}
					{#if event}
						<div class="event-card">
							<div class="event-info">
								<div class="event-title">{event.title}</div>
								<div class="event-meta">
									📅 {formatDate(event.startDateTime)}
									{#if event.location}
										• 📍 {event.location}
									{/if}
								</div>
								<div class="event-type">{event.eventType}</div>
							</div>

							<button
								on:click={() => removeEvent(eventId)}
								disabled={loading}
								class="remove-btn"
								title="Quitar evento"
							>
								×
							</button>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- Search and Add Events -->
	<div class="add-section">
		<h4 class="section-title">
			{selectedEventIds.length === 0 ? 'Relacionar con Eventos' : 'Agregar Más Eventos'}
		</h4>

		<div class="search-container">
			<input
				type="text"
				bind:value={searchTerm}
				on:focus={() => (showDropdown = true)}
				on:blur={() => setTimeout(() => (showDropdown = false), 200)}
				placeholder="Buscar eventos por título..."
				class="search-input"
			/>

			{#if loading}
				<div class="loading-spinner"></div>
			{/if}

			{#if showDropdown && !loading}
				<div class="dropdown">
					{#if filteredEvents.length === 0}
						<div class="empty-state">
							{searchTerm ? 'No se encontraron eventos' : 'No hay eventos disponibles'}
						</div>
					{:else}
						{#each filteredEvents as event (event.id)}
							{@const isSelected = selectedEventIds.includes(event.id)}
							<button
								on:click={() => toggleEvent(event.id)}
								class="dropdown-item"
								class:selected={isSelected}
								disabled={loading}
							>
								<div class="checkbox-wrapper">
									<input type="checkbox" checked={isSelected} tabindex="-1" />
								</div>

								<div class="event-content">
									<div class="event-title-dropdown">
										{event.title}
										{#if isSelected}
											<span class="selected-badge">✓ Seleccionado</span>
										{/if}
									</div>
									<div class="event-meta-dropdown">
										📅 {formatDate(event.startDateTime)}
										{#if event.location}
											• 📍 {event.location}
										{/if}
										• {event.eventType}
									</div>
								</div>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div}

		<div class="help-text">
			Selecciona los eventos que deseas relacionar con este artículo del blog
		</div>
	</div>
</div>

<style>
	.blog-event-relation {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
		background: white;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.blog-event-relation.compact {
		padding: 0.5rem;
		gap: 1rem;
	}

	.error-message {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.close-btn {
		background: none;
		border: none;
		color: #dc2626;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		margin-left: 1rem;
	}

	.close-btn:hover {
		color: #991b1b;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.75rem 0;
	}

	.selected-events {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.event-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.event-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 0.75rem;
		transition: all 0.2s;
	}

	.event-card:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
	}

	.event-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.event-title {
		font-weight: 500;
		color: #111827;
		font-size: 0.875rem;
	}

	.event-meta {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.event-type {
		display: inline-block;
		font-size: 0.7rem;
		background: #dbeafe;
		color: #1e40af;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		width: fit-content;
	}

	.remove-btn {
		background: #fee2e2;
		color: #dc2626;
		border: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		transition: all 0.2s;
		flex-shrink: 0;
		margin-left: 0.5rem;
	}

	.remove-btn:hover:not(:disabled) {
		background: #fecaca;
	}

	.remove-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.add-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.search-container {
		position: relative;
	}

	.search-input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		ring: 2px;
		ring-color: rgba(59, 130, 246, 0.1);
	}

	.loading-spinner {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		width: 16px;
		height: 16px;
		border: 2px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: translateY(-50%) rotate(360deg);
		}
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		max-height: 300px;
		overflow-y: auto;
		z-index: 10;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		color: #9ca3af;
		font-size: 0.875rem;
	}

	.dropdown-item {
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem;
		border: none;
		border-bottom: 1px solid #f3f4f6;
		background: white;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.2s;
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.dropdown-item:hover:not(:disabled) {
		background: #f9fafb;
	}

	.dropdown-item.selected {
		background: #eff6ff;
	}

	.dropdown-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.checkbox-wrapper {
		padding-top: 0.125rem;
	}

	.checkbox-wrapper input[type='checkbox'] {
		width: 16px;
		height: 16px;
		cursor: pointer;
		pointer-events: none;
	}

	.event-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.event-title-dropdown {
		font-weight: 500;
		color: #111827;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.selected-badge {
		font-size: 0.7rem;
		color: #10b981;
		font-weight: 600;
	}

	.event-meta-dropdown {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.help-text {
		font-size: 0.75rem;
		color: #6b7280;
		font-style: italic;
	}
</style>
