<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authService, type AuthUser } from '$lib/services/authService';
	import { browser } from '$app/environment';

	// Simple fallback translation function
	let t = (key: string) => {
		const translations = {
			'home': 'Inicio',
			'blog': 'Blog', 
			'dashboard': 'Panel',
			'logout': 'Cerrar Sesión',
			'login': 'Iniciar Sesión',
			'createArticle': 'Crear Artículo',
			'footerText': 'Todos los derechos reservados'
		};
		return translations[key] || key;
	};

	// Variables reactivas para el estado de autenticación
	let isLoggedIn = false;
	let user: AuthUser | null = null;
	let userName = '';
	let userRole = '';

	// Calcular si es educador
	$: isEducator =
		isLoggedIn && (user?.nombreRol === 'Educador' || user?.nombreRol === 'Administrador');
	
	// Calcular si puede gestionar usuarios
	$: canManageUsers =
		isLoggedIn && (user?.nombreRol === 'Administrador' || user?.nombreRol === 'Colaborador');

	// Variable reactiva simple para el idioma actual
	let currentLocale = 'es';

	// Función para actualizar el estado de autenticación
	function updateAuthState() {
		isLoggedIn = authService.isAuthenticated();
		user = authService.getUser();
		userName = isLoggedIn ? user?.nombre || '' : '';
		userRole = isLoggedIn ? user?.nombreRol || '' : '';
	}

	// Selección automática de idioma base según navegador
	onMount(() => {
		// Try to load paraglide if available
		try {
			import('$lib/paraglide/runtime').then(module => {
				if (module.translate) {
					t = module.translate;
				}
			}).catch(err => {
				console.log('Paraglide not available, using fallback translations');
			});
		} catch (err) {
			console.log('Paraglide module not found, using fallback translations');
		}

		// Actualizar estado de autenticación inicial
		updateAuthState();

		// Solo ejecutar en el navegador
		if (browser) {
			// Configuración simple de idioma
			const browserLang = navigator.language?.split('-')[0] || 'es';
			currentLocale = ['es', 'en'].includes(browserLang) ? browserLang : 'es';
		}
	});

	// Reactividad para actualizar el estado cuando cambie la página
	$: if ($page) {
		updateAuthState();
	}

	async function handleLogout(e: Event) {
		e.preventDefault();
		try {
			await authService.logout();
			updateAuthState(); // Actualizar estado después del logout
			window.location.href = '/auth/login';
		} catch (error) {
			console.error('Error during logout:', error);
		}
	}

	function switchLocale() {
		// Cambia entre los idiomas disponibles
		currentLocale = currentLocale === 'es' ? 'en' : 'es';
	}
</script>

<div class="flex min-h-screen flex-col">
	<header class="bg-indigo-600 text-white shadow-md">
		<div class="container mx-auto flex items-center justify-between px-4 py-3">
			<a href="/" class="text-xl font-bold">Tesis</a>
			<nav class="flex items-center gap-4">
				<a href="/" class="hover:underline">{t('home') || 'Inicio'}</a>
				<a href="/blog" class="hover:underline">{t('blog') || 'Blog'}</a>
				<a href="/calendar" class="hover:underline">Calendario</a>
				{#if isLoggedIn}
					<a href="/dashboard" class="hover:underline">{t('dashboard') || 'Panel'}</a>
					{#if isEducator}
						<a href="/blog/create" class="text-yellow-200 hover:underline">
							<i class="fas fa-edit mr-1"></i>
							{t('createArticle') || 'Crear Artículo'}
						</a>
					{/if}
					{#if canManageUsers}
						<a href="/dashboard/users" class="text-green-200 hover:underline">
							<i class="fas fa-users mr-1"></i>
							Usuarios
						</a>
					{/if}
					<div class="flex items-center gap-2">
						<span class="hidden md:inline">{userName} ({userRole})</span>
						<form on:submit|preventDefault={handleLogout}>
							<button
								type="submit"
								class="rounded-md bg-white px-3 py-1 text-sm font-medium text-indigo-600"
							>
								{t('logout') || 'Cerrar Sesión'}
							</button>
						</form>
					</div>
				{:else}
					<a
						href="/auth/login"
						class="rounded-md bg-white px-3 py-1 text-sm font-medium text-indigo-600"
					>
						{t('login') || 'Iniciar Sesión'}
					</a>
				{/if}
				<!-- Botón de cambio de idioma -->
				<button
					class="ml-2 rounded-md border border-indigo-400 bg-indigo-900 px-3 py-1 text-sm font-medium text-white transition hover:bg-indigo-800"
					on:click={switchLocale}
					aria-label="Switch language"
				>
					<i class="fas fa-language mr-1"></i>
					{#if currentLocale === 'es'}EN{:else}ES{/if}
				</button>
			</nav>
		</div>
	</header>

	<main class="container mx-auto flex-grow px-4 py-6">
		<slot />
	</main>

	<footer class="bg-gray-100 py-6">
		<div class="container mx-auto px-4 text-center text-gray-600">
			<p>
				&copy; {new Date().getFullYear()} Tesis - {t('footerText') ||
					'Todos los derechos reservados'}
			</p>
		</div>
	</footer>
</div>
