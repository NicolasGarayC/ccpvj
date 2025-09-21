<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authService } from '$lib/services/authService';

  import { t } from '$lib/i18n';

  let nombreUsuario = '';
  let contrasena = '';
  let error: string | null = null;
  let loading = false;
  let success = false;

  onMount(() => {
    // TEMPORALMENTE COMENTADO PARA EVITAR BUCLES DE REDIRECCIÓN
    // Redirigir si ya está autenticado
    // if (authService.isAuthenticated()) {
    //   goto('/');
    // }
    console.log('[DEBUG] Login component mounted, estado inicial:', {
      isAuthenticated: authService.isAuthenticated(),
      user: authService.getUser()
    });
  });

  // Validación de formulario
  $: isFormValid = nombreUsuario.trim().length > 0 && contrasena.trim().length > 0;
  $: isButtonDisabled = loading || success || !isFormValid;

  async function handleLogin(e: Event) {
    // Verificar que el formulario sea válido antes de proceder
    if (!isFormValid) {
      error = 'Por favor completa todos los campos';
      return;
    }

    // Resetear estados
    error = null;
    success = false;
    loading = true;

    try {
      console.log('[DEBUG] Iniciando login con:', { nombreUsuario: nombreUsuario.trim() });
      const result = await authService.login(nombreUsuario.trim(), contrasena.trim());
      console.log('[DEBUG] Resultado del login:', result);

      if (result.success) {
        success = true;
        console.log('[DEBUG] Login exitoso, redirigiendo...');
        // Mostrar mensaje de éxito brevemente antes de redirigir
        setTimeout(() => {
          goto('/');
        }, 1000);
      } else {
        console.log('[DEBUG] Login falló:', result.error);
        error = result.error || t('loginError') || 'Error al iniciar sesión';
      }
    } catch (err: any) {
      console.error('[DEBUG] Error en login:', err);
      error = err.message || t('connectionError') || 'Error de conexión. Verifica que el servidor esté funcionando.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{t('login') || 'Iniciar Sesión'}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4">
  <div class="w-full max-w-md">
    <!-- Logo/Título del Centro Cultural -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">
        {t('centroTitle') || 'Centro Cultural Víctor Jara'}
      </h1>
      <p class="text-gray-600 text-lg">
        {t('loginSubtitle') || 'Red Comunitaria de Aprendizaje'}
      </p>
    </div>

    <!-- Formulario de Login -->
    <form class="bg-white rounded-2xl shadow-2xl p-8 border-0" on:submit|preventDefault={handleLogin}>
      <div class="text-center mb-8">
        <h2 class="text-2xl font-semibold text-gray-800">
          {t('login') || 'Iniciar Sesión'}
        </h2>
        <p class="text-gray-500 mt-2">Accede a tu cuenta para continuar</p>
      </div>

      <!-- Mensaje de éxito -->
      {#if success}
        <div class="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-3 text-lg"></i>
            <span class="text-green-700 font-medium">
              {t('loginSuccess') || 'Inicio de sesión exitoso. Redirigiendo...'}
            </span>
          </div>
        </div>
      {/if}

      <!-- Mensaje de error -->
      {#if error}
        <div class="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
          <div class="flex items-center">
            <i class="fas fa-exclamation-circle text-red-500 mr-3 text-lg"></i>
            <span class="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      {/if}

      <!-- Campo Usuario -->
      <div class="mb-6">
        <label class="block text-sm font-semibold text-gray-700 mb-3" for="username">
          <i class="fas fa-user mr-2 text-indigo-500"></i>
          {t('username') || 'Usuario'}
        </label>
        <input
          id="username"
          type="text"
          bind:value={nombreUsuario}
          class="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-3 focus:ring-indigo-200 focus:border-indigo-500 transition-all duration-200 text-lg"
          placeholder={t('usernamePlaceholder') || 'Ingresa tu usuario'}
          required
          disabled={loading || success}
          autocomplete="username"
        />
      </div>

      <!-- Campo Contraseña -->
      <div class="mb-8">
        <label class="block text-sm font-semibold text-gray-700 mb-3" for="password">
          <i class="fas fa-lock mr-2 text-indigo-500"></i>
          {t('password') || 'Contraseña'}
        </label>
        <input
          id="password"
          type="password"
          bind:value={contrasena}
          class="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-3 focus:ring-indigo-200 focus:border-indigo-500 transition-all duration-200 text-lg"
          placeholder={t('passwordPlaceholder') || 'Ingresa tu contraseña'}
          required
          disabled={loading || success}
          autocomplete="current-password"
        />
      </div>

      <!-- Botón de Login -->
      <button
        type="submit"
        class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        disabled={isButtonDisabled}
      >
        {#if loading}
          <i class="fas fa-spinner fa-spin mr-3"></i>
          {t('loggingIn') || 'Iniciando sesión...'}
        {:else if success}
          <i class="fas fa-check mr-3"></i>
          {t('redirecting') || 'Redirigiendo...'}
        {:else}
          <i class="fas fa-sign-in-alt mr-3"></i>
          {t('login') || 'Iniciar Sesión'}
        {/if}
      </button>
    </form>

    <!-- Footer -->
    <div class="mt-8 text-center">
      <a href="/" class="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
        <i class="fas fa-arrow-left mr-2"></i>
        {t('backToHome') || 'Volver al inicio'}
      </a>
    </div>
  </div>
</div>

<style>
  /* Animación suave para la transición del botón */
  button[type="submit"] {
    transform: translateY(0);
    transition: all 0.2s ease;
  }
  
  button[type="submit"]:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  button[type="submit"]:active:not(:disabled) {
    transform: translateY(0);
  }
</style>