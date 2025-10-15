<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { jwtService } from '$lib/services/auth/jwtService.js';
	import { t, translate } from '$lib/i18n';

	let username = '';
	let password = '';
	let isLoading = false;
	let error = '';
	let sessionExpiredMessage = '';

	onMount(() => {
		// If user is already authenticated, redirect to home
		if (jwtService.isAuthenticated()) {
			goto('/');
			return;
		}

		// Check if coming from session expiration
		const message = $page.url.searchParams.get('message');
		if (message === 'session-expired') {
			sessionExpiredMessage = translate('login.sessionExpired');
		}
	});

	async function handleLogin() {
		if (!username || !password) {
			error = translate('login.errorMissingCredentials');
			return;
		}

		isLoading = true;
		error = '';

		try {
			const result = await jwtService.login(username, password);

			if (result.success) {
				// Login successful, redirect to home page
				goto('/');
			} else {
				error = result.message || translate('login.errorGeneric');
			}
		} catch (err) {
			console.error('Login error:', err);
			error = translate('login.errorConnection');
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<svelte:head>
	<title>{$t('login.title')} - {$t('centroTitle')}</title>
</svelte:head>

<div class="login-container">
	<div class="login-card">
		<div class="login-header">
			<h1>{$t('login.title')}</h1>
			<p>{$t('login.subtitle')}</p>
		</div>

		<form on:submit|preventDefault={handleLogin} class="login-form">
			{#if sessionExpiredMessage}
				<div class="warning-message" role="alert">
					⏱️ {sessionExpiredMessage}
				</div>
			{/if}

			<div class="form-group">
				<label for="username">{$t('login.usernameLabel')}</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					on:keypress={handleKeyPress}
					placeholder={$t('login.usernamePlaceholder')}
					disabled={isLoading}
					autocomplete="username"
					required
				/>
			</div>

			<div class="form-group">
				<label for="password">{$t('login.passwordLabel')}</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					on:keypress={handleKeyPress}
					placeholder={$t('login.passwordPlaceholder')}
					disabled={isLoading}
					autocomplete="current-password"
					required
				/>
			</div>

			{#if error}
				<div class="error-message" role="alert">
					{error}
				</div>
			{/if}

			<button type="submit" class="login-button" disabled={isLoading}>
				{#if isLoading}
					<span class="loading-spinner"></span>
					{$t('login.submitting')}
				{:else}
					{$t('login.submit')}
				{/if}
			</button>
		</form>

		<div class="login-footer">
			<p>{$t('login.supportMessage')}</p>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}

	.login-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		padding: 40px;
		width: 100%;
		max-width: 400px;
	}

	.login-header {
		text-align: center;
		margin-bottom: 30px;
	}

	.login-header h1 {
		margin: 0 0 8px 0;
		color: #333;
		font-size: 24px;
		font-weight: 600;
	}

	.login-header p {
		margin: 0;
		color: #666;
		font-size: 14px;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group label {
		font-weight: 500;
		color: #333;
		font-size: 14px;
	}

	.form-group input {
		padding: 12px 16px;
		border: 2px solid #e1e5e9;
		border-radius: 8px;
		font-size: 16px;
		transition: border-color 0.2s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-group input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

	.error-message {
		background-color: #fee2e2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 14px;
		text-align: center;
	}

	.warning-message {
		background-color: #fef3c7;
		border: 1px solid #fde68a;
		color: #92400e;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 14px;
		text-align: center;
		font-weight: 500;
	}

	.login-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 10px;
	}

	.login-button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.login-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.login-footer {
		text-align: center;
		margin-top: 24px;
		padding-top: 24px;
		border-top: 1px solid #e1e5e9;
	}

	.login-footer p {
		margin: 0;
		color: #666;
		font-size: 12px;
	}

	@media (max-width: 480px) {
		.login-card {
			padding: 24px;
		}

		.login-header h1 {
			font-size: 20px;
		}
	}
</style>
