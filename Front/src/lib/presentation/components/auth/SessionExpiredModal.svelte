<script lang="ts">
	import { authModalStore } from '$lib/presentation/stores/authStore';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { inactivityService } from '$lib/application/services/auth/InactivityService';
	import { jwtService } from '$lib/application/services/auth/JwtService';
	import { onDestroy } from 'svelte';

	let show = false;
	let message = '';
	let type: 'warning' | 'expired' | 'unauthorized' = 'expired';
	let countdown = 30; // Default countdown in seconds
	let countdownInterval: number | null = null;

	authModalStore.subscribe(state => {
		show = state.show;
		message = state.message;
		type = state.type;

		// If warning modal, start countdown
		if (state.type === 'warning' && state.show) {
			startCountdown(state.timeRemaining || 30);
		} else {
			stopCountdown();
		}
	});

	function startCountdown(initialTime: number) {
		stopCountdown(); // Clear any existing countdown
		countdown = Math.ceil(initialTime);

		countdownInterval = window.setInterval(() => {
			countdown--;

			if (countdown <= 0) {
				stopCountdown();
				handleSessionExpired();
			}
		}, 1000);
	}

	function stopCountdown() {
		if (countdownInterval !== null) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
	}

	function handleContinueSession() {
		// Reset inactivity timer
		inactivityService.resetInactivity();

		// Hide modal
		authModalStore.hide();
		stopCountdown();

		// Optionally: refresh token or extend session here
		// For now, just reset the inactivity timer
	}

	function handleSessionExpired() {
		stopCountdown();
		authModalStore.hide();
		jwtService.logout();
		goto('/auth/login');
	}

	function handleClose() {
		if (type === 'warning') {
			// On warning modal, close means logout
			handleSessionExpired();
		} else {
			// On expired/unauthorized, go to login
			authModalStore.hide();
			goto('/auth/login');
		}
	}

	function handleOverlayKeydown(event: KeyboardEvent) {
		if (type === 'warning') {
			// On warning modal, only allow Enter/Space to continue
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				handleContinueSession();
			} else if (event.key === 'Escape') {
				event.preventDefault();
				handleSessionExpired();
			}
		} else {
			// On expired modal, any key closes
			if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				handleClose();
			}
		}
	}

	// Format countdown time
	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	onDestroy(() => {
		stopCountdown();
	});
</script>

{#if show}
	<div
		class="modal-overlay"
		role="button"
		tabindex="0"
		on:click|self={type === 'warning' ? handleSessionExpired : handleClose}
		on:keydown|self={handleOverlayKeydown}
	>
		<div class="modal-content">
			{#if type === 'warning'}
				<!-- Warning Modal: Session about to expire -->
				<div class="modal-header warning">
					<div class="icon-warning">⏰</div>
					<h2>{$t('modal.sessionWarning')}</h2>
				</div>

				<div class="modal-body">
					<p>{message || $t('modal.sessionWarningMessage')}</p>
					<div class="countdown-container">
						<div class="countdown-circle">
							<svg class="countdown-svg" viewBox="0 0 100 100">
								<circle
									class="countdown-bg"
									cx="50"
									cy="50"
									r="45"
								/>
								<circle
									class="countdown-progress"
									cx="50"
									cy="50"
									r="45"
									style="stroke-dashoffset: {283 - (countdown / 30) * 283}"
								/>
							</svg>
							<div class="countdown-time">{formatTime(countdown)}</div>
						</div>
						<p class="countdown-text">{$t('modal.sessionWarningCountdown')}</p>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn-secondary" on:click={handleSessionExpired}>
						{$t('modal.logout')}
					</button>
					<button class="btn-primary" on:click={handleContinueSession}>
						{$t('modal.continueSession')}
					</button>
				</div>
			{:else}
				<!-- Expired/Unauthorized Modal -->
				<div class="modal-header">
					<div class="icon-warning">⚠️</div>
					<h2>{$t('modal.sessionExpired')}</h2>
				</div>

				<div class="modal-body">
					<p>{message || $t('modal.sessionExpiredMessage')}</p>
				</div>

				<div class="modal-footer">
					<button class="btn-primary" on:click={handleClose}>
						{$t('modal.backToHome')}
					</button>
				</div>
			{/if}
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
		max-width: 500px;
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

	.modal-header.warning {
		background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
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
		margin: 0 0 1.5rem 0;
		color: #4b5563;
		font-size: 1rem;
		line-height: 1.6;
	}

	.countdown-container {
		margin-top: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.countdown-circle {
		position: relative;
		width: 120px;
		height: 120px;
	}

	.countdown-svg {
		transform: rotate(-90deg);
		width: 100%;
		height: 100%;
	}

	.countdown-bg {
		fill: none;
		stroke: #e5e7eb;
		stroke-width: 8;
	}

	.countdown-progress {
		fill: none;
		stroke: #f59e0b;
		stroke-width: 8;
		stroke-linecap: round;
		stroke-dasharray: 283;
		transition: stroke-dashoffset 1s linear;
	}

	.countdown-time {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
	}

	.countdown-text {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.modal-footer {
		padding: 1.5rem 2rem;
		background: #f9fafb;
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.btn-primary,
	.btn-secondary {
		border: none;
		padding: 0.875rem 2rem;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	}

	.btn-secondary {
		background: white;
		color: #6b7280;
		border: 2px solid #e5e7eb;
	}

	.btn-secondary:hover {
		background: #f9fafb;
		border-color: #d1d5db;
		transform: translateY(-2px);
	}

	.btn-primary:active,
	.btn-secondary:active {
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

		.countdown-circle {
			width: 100px;
			height: 100px;
		}

		.countdown-time {
			font-size: 1.5rem;
		}

		.modal-footer {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}
</style>
