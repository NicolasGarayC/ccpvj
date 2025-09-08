<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Course } from '$lib/services/course/courseService';
	import { createEventDispatcher } from 'svelte';
	
	export let course: Course;
	export let showActions = false;

	const dispatch = createEventDispatcher();

	function handleViewCourse() {
		goto(`/courses/${course.id}`);
	}

	function handleEditCourse() {
		dispatch('edit', course.id);
	}

	function handleDeleteCourse() {
		dispatch('delete', course.id);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="course-card">
	{#if course.imagePath}
		<div class="course-image">
			<img src={course.imagePath} alt={course.title} />
			{#if course.isFeatured}
				<div class="featured-badge">Destacado</div>
			{/if}
		</div>
	{:else}
		<div class="course-image placeholder">
			<div class="placeholder-content">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
					<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
				</svg>
			</div>
			{#if course.isFeatured}
				<div class="featured-badge">Destacado</div>
			{/if}
		</div>
	{/if}

	<div class="course-content">
		<div class="course-header">
			<h3 class="course-title">{course.title}</h3>
			<span class="course-subject">{course.subject}</span>
		</div>

		<p class="course-description">
			{course.description.length > 120 
				? course.description.substring(0, 120) + '...'
				: course.description
			}
		</p>

		<div class="course-meta">
			<div class="educator">
				<span class="label">Educador:</span>
				<span class="value">{course.educatorName}</span>
			</div>
			
			<div class="stats">
				<span class="stat">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
						<line x1="8" y1="21" x2="16" y2="21"></line>
						<line x1="12" y1="17" x2="12" y2="21"></line>
					</svg>
					{course.moduleCount} módulos
				</span>
				<span class="stat">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14,2 14,8 20,8"></polyline>
					</svg>
					{course.workItemCount} contenidos
				</span>
			</div>
		</div>

		<div class="course-date">
			<span>Creado: {formatDate(course.createdAt)}</span>
		</div>
	</div>

	<div class="course-actions">
		<button class="btn btn-primary" on:click={handleViewCourse}>
			Ver Curso
		</button>
		
		{#if showActions}
			<div class="admin-actions">
				<button 
					class="btn btn-outline btn-sm"
					on:click={handleEditCourse}
				>
					Editar
				</button>
				<button 
					class="btn btn-outline btn-sm btn-danger"
					on:click={handleDeleteCourse}
				>
					Eliminar
				</button>
			</div>
		{/if}
	</div>

	{#if !course.isActive}
		<div class="inactive-overlay">
			<span>Curso Inactivo</span>
		</div>
	{/if}
</div>

<style>
	.course-card {
		position: relative;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.course-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.course-image {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;
	}

	.course-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.course-image.placeholder {
		background: linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light));
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.placeholder-content {
		opacity: 0.8;
	}

	.featured-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--color-accent);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.course-content {
		padding: 1.5rem;
	}

	.course-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.course-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
		flex: 1;
		line-height: 1.4;
	}

	.course-subject {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.course-description {
		color: var(--color-text-muted);
		line-height: 1.5;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.course-meta {
		margin-bottom: 1rem;
	}

	.educator {
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
	}

	.educator .label {
		color: var(--color-text-muted);
		margin-right: 0.5rem;
	}

	.educator .value {
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.stats {
		display: flex;
		gap: 1rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}

	.stat svg {
		opacity: 0.7;
	}

	.course-date {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	.course-actions {
		padding: 0 1.5rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.admin-actions {
		display: flex;
		gap: 0.5rem;
	}

	.inactive-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.1rem;
	}

	@media (max-width: 768px) {
		.course-header {
			flex-direction: column;
			align-items: stretch;
		}

		.course-subject {
			align-self: flex-start;
		}

		.stats {
			flex-direction: column;
			gap: 0.5rem;
		}

		.course-actions {
			flex-direction: column;
		}

		.admin-actions {
			justify-content: center;
			width: 100%;
		}
	}
</style>