<script lang="ts">
	import { authModalStore } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';

	let show = false;
	let message = '';

	authModalStore.subscribe(state => {
		show = state.show;
		message = state.message;
	});

	function handleClose() {
		authModalStore.hide();
		goto('/');
	}
</script>

{#if show}
	<div class="modal-overlay" on:click|self={handleClose}>
		<div class="modal-content">
			<div class="modal-header">
				<div class="icon-warning">⚠️</div>
				<h2>Sesión Expirada</h2>
			</div>

			<div class="modal-body">
				<p>{message}</p>
			</div>

			<div class="modal-footer">
				<button class="btn-primary" on:click={handleClose}>
					Volver al Inicio
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 450px;
		width: 90%;
		overflow: hidden;
		animation: modalSlideIn 0.3s ease-out;
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(-20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
		padding: 2rem;
		text-align: center;
	}

	.icon-warning {
		font-size: 3rem;
		margin-bottom: 0.5rem;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.modal-body {
		padding: 2rem;
		text-align: center;
	}

	.modal-body p {
		margin: 0;
		color: #4b5563;
		font-size: 1rem;
		line-height: 1.6;
	}

	.modal-footer {
		padding: 1.5rem 2rem;
		background: #f9fafb;
		display: flex;
		justify-content: center;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		border: none;
		padding: 0.875rem 2rem;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	@media (max-width: 640px) {
		.modal-content {
			max-width: 95%;
		}

		.modal-header {
			padding: 1.5rem;
		}

		.icon-warning {
			font-size: 2.5rem;
		}

		.modal-header h2 {
			font-size: 1.25rem;
		}

		.modal-body {
			padding: 1.5rem;
		}
	}
</style>
