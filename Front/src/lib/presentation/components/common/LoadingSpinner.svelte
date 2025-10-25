<script lang="ts">
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let color: string = 'var(--color-primary)';
	export let inline: boolean = false;

	$: spinnerSize = {
		small: '1rem',
		medium: '1.5rem',
		large: '2rem'
	}[size];
</script>

<div
	class="loading-spinner"
	class:inline
	style="--spinner-size: {spinnerSize}; --spinner-color: {color};"
	aria-label="Cargando..."
>
	<div class="spinner"></div>
</div>

<style>
	.loading-spinner {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--spinner-size);
		height: var(--spinner-size);
	}

	.loading-spinner.inline {
		display: inline-flex;
	}

	.spinner {
		width: 100%;
		height: 100%;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-left-color: var(--spinner-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>