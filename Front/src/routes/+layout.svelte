<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { jwtService, type JwtUser } from '$lib/services/auth/jwtService.js';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	// Variables reactivas para el estado de autenticación
	let isLoggedIn = false;
	let user: JwtUser | null = null;
	let userName = '';
	let userRole = '';

	// Estado del menú móvil
	let mobileMenuOpen = false;

	// Calcular si es educador (administrador puede crear contenido)
	$: isEducator =
		isLoggedIn && (user?.role === 'administrador' || user?.role === 'colaborador');

	// Calcular si puede gestionar usuarios (solo administradores)
	$: canManageUsers =
		isLoggedIn && user?.role === 'administrador';

	// Variable reactiva simple para el idioma actual
	let currentLocale = 'es';

	// Función para actualizar el estado de autenticación
	async function updateAuthState() {
		// Verificar el token JWT
		isLoggedIn = jwtService.isAuthenticated();
		user = jwtService.getUser();

		// Si hay token pero no usuario, intentar validarlo con el servidor
		if (browser && isLoggedIn && !user) {
			const validatedUser = await jwtService.validateToken();
			if (validatedUser) {
				user = validatedUser;
			} else {
				isLoggedIn = false;
			}
		}

		userName = isLoggedIn ? user?.nombre || user?.username || '' : '';
		userRole = isLoggedIn ? user?.role || '' : '';
	}

	// Inicialización del componente
	onMount(() => {
		// Solo actualizar el estado de autenticación si NO estamos en la página de login
		if ($page.route.id !== '/auth/login') {
			updateAuthState();
		} else {
			// Si estamos en login, solo verificar estado local
			isLoggedIn = jwtService.isAuthenticated();
			user = jwtService.getUser();
			userName = isLoggedIn ? user?.nombre || user?.username || '' : '';
			userRole = isLoggedIn ? user?.role || '' : '';
		}

		// Solo ejecutar en el navegador
		if (browser) {
			// Configuración simple de idioma
			const browserLang = navigator.language?.split('-')[0] || 'es';
			currentLocale = ['es', 'en'].includes(browserLang) ? browserLang : 'es';
		}
	});

	// Reactividad para actualizar el estado cuando cambie la página
	$: if ($page && $page.route.id !== '/auth/login') {
		updateAuthState();
	}

	async function handleLogout(e: Event) {
		e.preventDefault();
		try {
			await jwtService.logout();
			updateAuthState(); // Actualizar estado después del logout
			window.location.href = '/';
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
	<!-- Header moderno y juvenil -->
	<header class="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 shadow-2xl relative overflow-hidden">
		<!-- Elementos decorativos de fondo -->
		<div class="absolute inset-0 opacity-20">
			<div class="absolute top-0 left-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply animate-pulse"></div>
			<div class="absolute top-8 right-20 w-24 h-24 bg-cyan-300 rounded-full mix-blend-multiply animate-bounce"></div>
			<div class="absolute bottom-4 left-1/3 w-16 h-16 bg-green-300 rounded-full mix-blend-multiply animate-pulse"></div>
		</div>
		
		<div class="container mx-auto px-4 py-4 relative z-10">
			<div class="flex items-center justify-between">
				<!-- Logo juvenil y colorido -->
				<a href="/" class="flex items-center gap-3 group">
					<div class="relative">
						<div class="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300">
							<span class="text-2xl">🎨</span>
						</div>
						<div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
					</div>
					<div>
						<h1 class="text-2xl font-black text-white tracking-tight">Centro Cultural</h1>
						<p class="text-xs text-white/80 font-medium">Víctor Jara</p>
					</div>
				</a>

				<!-- Navegación principal moderna -->
				<nav class="hidden lg:flex items-center bg-white/20 backdrop-blur-lg rounded-2xl px-3 lg:px-6 py-2 shadow-lg">
					<div class="flex items-center gap-2">
						<!-- Inicio -->
						<a
							href="/"
							class="nav-item group relative px-3 lg:px-4 py-2 text-white font-medium rounded-xl transition-all duration-300 hover:bg-white/20 hover:scale-105"
							title="{t('home') || 'Inicio'}"
						>
							<span class="flex items-center gap-2">
								<i class="fas fa-home text-lg group-hover:bounce"></i>
								<span class="hidden lg:inline">{t('home') || 'Inicio'}</span>
							</span>
						</a>

						<!-- Blog -->
						<a
							href="/blog"
							class="nav-item group relative px-3 lg:px-4 py-2 text-white font-medium rounded-xl transition-all duration-300 hover:bg-white/20 hover:scale-105"
							title="{t('blog') || 'Blog'}"
						>
							<span class="flex items-center gap-2">
								<i class="fas fa-blog text-lg group-hover:wiggle"></i>
								<span class="hidden lg:inline">{t('blog') || 'Blog'}</span>
							</span>
						</a>

						<!-- Calendario -->
						<a
							href="/calendar"
							class="nav-item group relative px-3 lg:px-4 py-2 text-white font-medium rounded-xl transition-all duration-300 hover:bg-white/20 hover:scale-105"
							title="{t('calendar') || 'Calendario'}"
						>
							<span class="flex items-center gap-2">
								<i class="fas fa-calendar-alt text-lg group-hover:pulse"></i>
								<span class="hidden lg:inline">{t('calendar') || 'Calendario'}</span>
							</span>
						</a>

						<!-- Biblioteca -->
						<a
							href="/library"
							class="nav-item group relative px-3 lg:px-4 py-2 text-white font-medium rounded-xl transition-all duration-300 hover:bg-white/20 hover:scale-105"
							title="{t('library') || 'Biblioteca'}"
						>
							<span class="flex items-center gap-2">
								<i class="fas fa-book text-lg group-hover:swing"></i>
								<span class="hidden lg:inline">{t('library') || 'Biblioteca'}</span>
							</span>
						</a>

						<!-- Cursos -->
						<a
							href="/courses"
							class="nav-item group relative px-3 lg:px-4 py-2 text-white font-medium rounded-xl transition-all duration-300 hover:bg-white/20 hover:scale-105"
							title="{t('courses') || 'Cursos'}"
						>
							<span class="flex items-center gap-2">
								<i class="fas fa-graduation-cap text-lg group-hover:bounce"></i>
								<span class="hidden lg:inline">{t('courses') || 'Cursos'}</span>
							</span>
						</a>
					</div>
				</nav>

				<!-- Sección de usuario moderna -->
				<div class="flex items-center gap-3">
					{#if isLoggedIn}
						<!-- Dashboard admin -->
						{#if canManageUsers}
							<a href="/dashboard/users" class="hidden md:flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-xl font-bold hover:bg-yellow-300 transition-all duration-300 shadow-lg hover:shadow-xl">
								<i class="fas fa-users-cog text-lg"></i>
								<span class="hidden lg:inline">Panel</span>
							</a>
						{/if}
						
						<!-- Info del usuario -->
						<div class="hidden md:flex items-center gap-3 bg-white/20 backdrop-blur-lg rounded-xl px-4 py-2">
							<div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
								{userName.charAt(0).toUpperCase()}
							</div>
							<div class="hidden lg:block">
								<p class="text-white font-semibold text-sm">{userName}</p>
								<p class="text-white/70 text-xs">{userRole}</p>
							</div>
						</div>
						
						<!-- Botón logout -->
						<form on:submit|preventDefault={handleLogout}>
							<button
								type="submit"
								class="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
							>
								<i class="fas fa-sign-out-alt text-lg"></i>
								<span class="hidden lg:inline">Salir</span>
							</button>
						</form>
					{:else}
						<!-- Botón login -->
						<a
							href="/auth/login"
							class="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
						>
							<i class="fas fa-sign-in-alt text-lg"></i>
							<span>{t('login') || 'Entrar'}</span>
						</a>
					{/if}
					
					<!-- Selector de idioma moderno -->
					<button
						class="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-lg text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-300"
						on:click={switchLocale}
						aria-label="Switch language"
					>
						<i class="fas fa-globe text-lg"></i>
						<span class="text-sm font-bold">{currentLocale.toUpperCase()}</span>
					</button>
				</div>

				<!-- Menú móvil -->
				<button
					class="lg:hidden flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-lg text-white rounded-xl"
					on:click={() => mobileMenuOpen = !mobileMenuOpen}
					aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
					aria-expanded={mobileMenuOpen}
				>
					<i class="fas {mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg"></i>
				</button>
			</div>
		</div>
	</header>

	<!-- Mobile menu dropdown -->
	{#if mobileMenuOpen}
		<div class="lg:hidden bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 border-t border-white/20">
			<div class="container mx-auto px-4 py-4">
				<nav class="space-y-2">
					<!-- Inicio -->
					<a href="/" class="block px-4 py-3 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300" on:click={() => mobileMenuOpen = false}>
						<span class="flex items-center gap-3">
							<i class="fas fa-home text-lg"></i>
							<span>{t('home') || 'Inicio'}</span>
						</span>
					</a>

					<!-- Blog -->
					<a href="/blog" class="block px-4 py-3 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300" on:click={() => mobileMenuOpen = false}>
						<span class="flex items-center gap-3">
							<i class="fas fa-blog text-lg"></i>
							<span>{t('blog') || 'Blog'}</span>
						</span>
					</a>

					<!-- Calendario -->
					<a href="/calendar" class="block px-4 py-3 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300" on:click={() => mobileMenuOpen = false}>
						<span class="flex items-center gap-3">
							<i class="fas fa-calendar-alt text-lg"></i>
							<span>{t('calendar') || 'Calendario'}</span>
						</span>
					</a>

					<!-- Biblioteca -->
					<a href="/library" class="block px-4 py-3 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300" on:click={() => mobileMenuOpen = false}>
						<span class="flex items-center gap-3">
							<i class="fas fa-book text-lg"></i>
							<span>{t('library') || 'Biblioteca'}</span>
						</span>
					</a>

					<!-- Cursos -->
					<a href="/courses" class="block px-4 py-3 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-300" on:click={() => mobileMenuOpen = false}>
						<span class="flex items-center gap-3">
							<i class="fas fa-graduation-cap text-lg"></i>
							<span>{t('courses') || 'Cursos'}</span>
						</span>
					</a>

					{#if isLoggedIn}
						<!-- Dashboard admin (mobile) -->
						{#if canManageUsers}
							<a href="/dashboard/users" class="block px-4 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-300 transition-all duration-300" on:click={() => mobileMenuOpen = false}>
								<span class="flex items-center gap-3">
									<i class="fas fa-users-cog text-lg"></i>
									<span>Panel Admin</span>
								</span>
							</a>
						{/if}

						<!-- User info (mobile) -->
						<div class="px-4 py-3 bg-white/20 backdrop-blur-lg rounded-xl">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
									{userName.charAt(0).toUpperCase()}
								</div>
								<div>
									<p class="text-white font-semibold text-sm">{userName}</p>
									<p class="text-white/70 text-xs">{userRole}</p>
								</div>
							</div>
						</div>

						<!-- Logout (mobile) -->
						<form on:submit|preventDefault={handleLogout}>
							<button
								type="submit"
								class="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300"
								on:click={() => mobileMenuOpen = false}
							>
								<span class="flex items-center gap-3 justify-center">
									<i class="fas fa-sign-out-alt text-lg"></i>
									<span>Cerrar Sesión</span>
								</span>
							</button>
						</form>
					{:else}
						<!-- Login (mobile) -->
						<a
							href="/auth/login"
							class="block px-4 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 text-center"
							on:click={() => mobileMenuOpen = false}
						>
							<span class="flex items-center gap-3 justify-center">
								<i class="fas fa-sign-in-alt text-lg"></i>
								<span>{t('login') || 'Entrar'}</span>
							</span>
						</a>
					{/if}
				</nav>
			</div>
		</div>
	{/if}

	<!-- Contenido principal -->
	<main
		class="flex-grow"
		on:click={() => mobileMenuOpen = false}
		on:keydown={(e) => {
			if (e.key === 'Escape' && mobileMenuOpen) {
				mobileMenuOpen = false;
			}
		}}
		role="main"
	>
		<slot />
	</main>

	<!-- Footer juvenil y moderno -->
	<footer class="bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 text-white relative overflow-hidden">
		<!-- Elementos decorativos de fondo -->
		<div class="absolute inset-0 opacity-10">
			<div class="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20"></div>
			<div class="absolute top-4 right-10 w-20 h-20 bg-yellow-400 rounded-full mix-blend-multiply animate-pulse"></div>
			<div class="absolute bottom-8 left-20 w-16 h-16 bg-cyan-400 rounded-full mix-blend-multiply animate-bounce"></div>
		</div>
		
		<div class="container mx-auto px-4 py-8 relative z-10">
			<div class="text-center">
				<!-- Logo footer -->
				<div class="flex items-center justify-center gap-3 mb-4">
					<div class="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
						<span class="text-xl">🎭</span>
					</div>
					<div>
						<h3 class="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
							Centro Cultural Víctor Jara
						</h3>
					</div>
				</div>
				
				<!-- Separador decorativo -->
				<div class="w-24 h-1 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto mb-4"></div>
				
				<!-- Copyright -->
				<p class="text-white/70 font-medium">
					&copy; {new Date().getFullYear()} Centro Cultural Víctor Jara
				</p>
				<p class="text-white/50 text-sm mt-1">
					✨ Creando momentos mágicos de aprendizaje ✨
				</p>
			</div>
		</div>
	</footer>
</div>

<style>
	@keyframes wiggle {
		0%, 100% { transform: rotate(-3deg); }
		50% { transform: rotate(3deg); }
	}
	
	@keyframes swing {
		0%, 100% { transform: rotate(0deg); }
		50% { transform: rotate(10deg); }
	}
	
	.nav-item:hover i.group-hover\:wiggle {
		animation: wiggle 0.5s ease-in-out;
	}
	
	.nav-item:hover i.group-hover\:swing {
		animation: swing 0.5s ease-in-out;
	}
	
	.nav-item:hover i.group-hover\:bounce {
		animation: bounce 0.5s ease-in-out;
	}
	
	.nav-item:hover i.group-hover\:pulse {
		animation: pulse 0.5s ease-in-out;
	}
	
	/* Hover effects mejorados */
	.nav-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2));
		border-radius: 0.75rem;
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: -1;
	}
	
	.nav-item:hover::before {
		opacity: 1;
	}
</style>
