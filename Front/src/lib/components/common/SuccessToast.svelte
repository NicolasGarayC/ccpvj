<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let visible = false;
	export let message = '';
	export let duration = 3000; // 3 seconds default

	const dispatch = createEventDispatcher();

	let timeoutId: ReturnType<typeof setTimeout>;

	$: if (visible && message) {
		// Auto-hide after duration
		timeoutId = setTimeout(() => {
			handleClose();
		}, duration);
	}

	function handleClose() {
		visible = false;
		dispatch('close');
	}

	function handleClick() {
		handleClose();
	}

	// Clear timeout when component is destroyed
	onMount(() => {
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});
</script>

{#if visible && message}
	<div class="success-toast" on:click={handleClick} role="alert" aria-live="polite">
		<div class="toast-content">
			<div class="toast-icon">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 11l3 3 7-7"></path>
					<circle cx="12" cy="12" r="10"></circle>
				</svg>
			</div>
			<div class="toast-message">{message}</div>
			<button class="toast-close" on:click|stopPropagation={handleClose} aria-label="Cerrar notificación">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
		<div class="progress-bar">
			<div class="progress-fill"></div>
		</div>
	</div>
{/if}

<style>
	.success-toast {
		position: fixed;
		top: 20px;
		right: 20px;
		background: #10b981;
		color: white;
		border-radius: 12px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		min-width: 300px;
		max-width: 500px;
		z-index: 1000;
		cursor: pointer;
		overflow: hidden;
		animation: slideInRight 0.3s ease-out;
	}

	.toast-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
	}

	.toast-icon {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		color: white;
		margin-top: 0.1rem;
	}

	.toast-message {
		flex: 1;
		font-size: 0.9rem;
		font-weight: 500;
		line-height: 1.4;
		min-width: 0;
		word-wrap: break-word;
	}

	.toast-close {
		flex-shrink: 0;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: all 0.2s ease;
		margin-top: -0.25rem;
		margin-right: -0.25rem;
	}

	.toast-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.progress-bar {
		height: 3px;
		background: rgba(255, 255, 255, 0.2);
		position: relative;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: rgba(255, 255, 255, 0.8);
		width: 100%;
		transform-origin: left;
		animation: progressShrink var(--duration, 3000ms) linear forwards;
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes progressShrink {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}

	@media (max-width: 768px) {
		.success-toast {
			left: 10px;
			right: 10px;
			top: 10px;
			min-width: auto;
			max-width: none;
		}

		.toast-content {
			padding: 0.875rem 1rem;
		}

		.toast-message {
			font-size: 0.85rem;
		}
	}
</style>