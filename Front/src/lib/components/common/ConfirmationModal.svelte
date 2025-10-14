<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { t, translate } from '$lib/i18n';

	export let isOpen = false;
	export let title = translate('modal.confirmAction');
	export let message = translate('modal.confirmMessage');
	export let confirmText = translate('modal.confirm');
	export let cancelText = translate('action.cancel');
	export let type: 'danger' | 'warning' | 'info' = 'warning';
	export let loading = false;

	const dispatch = createEventDispatcher();

	function handleConfirm() {
		dispatch('confirm');
	}

	function handleCancel() {
		if (!loading) {
			dispatch('cancel');
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !loading) {
			handleCancel();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !loading) {
			handleCancel();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		aria-describedby="modal-message"
		tabindex="-1"
	>
		<div class="modal-container">
			<!-- Modal Header -->
			<div class="modal-header">
				<div class="icon-container {type}">
					{#if type === 'danger'}
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="15" y1="9" x2="9" y2="15"></line>
							<line x1="9" y1="9" x2="15" y2="15"></line>
						</svg>
					{:else if type === 'warning'}
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
							<line x1="12" y1="9" x2="12" y2="13"></line>
							<circle cx="12" cy="17" r="1"></circle>
						</svg>
					{:else}
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<path d="M12 8v8"></path>
							<path d="M8 12h8"></path>
						</svg>
					{/if}
				</div>

				<h3 id="modal-title" class="modal-title">{title}</h3>

				{#if !loading}
					<button
						class="modal-close"
						on:click={handleCancel}
						aria-label={$t('modal.closeModal')}
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				{/if}
			</div>

			<!-- Modal Body -->
			<div class="modal-body">
				<p id="modal-message" class="modal-message">{message}</p>
			</div>

			<!-- Modal Footer -->
			<div class="modal-footer">
				<button
					type="button"
					class="btn btn-outline"
					on:click={handleCancel}
					disabled={loading}
				>
					{cancelText}
				</button>

				<button
					type="button"
					class="btn btn-{type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'primary'}"
					on:click={handleConfirm}
					disabled={loading}
				>
					{#if loading}
						<span class="loading-spinner"></span>
					{/if}
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s ease-out;
	}

	.modal-container {
		background: white;
		border-radius: 16px;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
		transform: translateZ(0); /* Force hardware acceleration */
		will-change: transform; /* Optimize for animations */
		position: relative;
	}

	.modal-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.icon-container {
		flex-shrink: 0;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-container.danger {
		background: var(--color-error-light);
		color: var(--color-error);
	}

	.icon-container.warning {
		background: var(--color-warning-light);
		color: var(--color-warning-dark);
	}

	.icon-container.info {
		background: var(--color-primary-light);
		color: var(--color-primary);
	}

	.modal-title {
		flex: 1;
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.modal-close {
		flex-shrink: 0;
		padding: 0.5rem;
		border: none;
		background: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.modal-close:hover {
		background: var(--color-background-alt);
		color: var(--color-text-primary);
	}

	.modal-body {
		padding: 1rem 2rem 2rem;
	}

	.modal-message {
		margin: 0;
		color: var(--color-text-secondary);
		line-height: 1.6;
		font-size: 1rem;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding: 1.5rem 2rem 2rem;
		border-top: 1px solid var(--color-border);
	}

	.loading-spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-right: 0.5rem;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.modal-backdrop {
			padding: 0.5rem;
		}

		.modal-header,
		.modal-body,
		.modal-footer {
			padding-left: 1.5rem;
			padding-right: 1.5rem;
		}

		.modal-footer {
			flex-direction: column-reverse;
		}
	}
</style>