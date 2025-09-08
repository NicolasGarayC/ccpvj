<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authService } from '$lib/services/authService';

  // Simple fallback translation function
  let t = (key: string) => {
    const translations = {
      'login': 'Iniciar Sesión',
      'username': 'Usuario',
      'password': 'Contraseña',
      'centroTitle': 'Centro Cultural Víctor Jara',
      'loginSubtitle': 'Red Comunitaria de Aprendizaje',
      'usernamePlaceholder': 'Ingresa tu usuario',
      'passwordPlaceholder': 'Ingresa tu contraseña',
      'loggingIn': 'Iniciando sesión...',
      'redirecting': 'Redirigiendo...',
      'loginSuccess': 'Inicio de sesión exitoso. Redirigiendo...',
      'loginError': 'Error al iniciar sesión',
      'connectionError': 'Error de conexión. Verifica que el servidor esté funcionando.',
      'backToHome': 'Volver al inicio'
    };
    return translations[key] || key;
  };

  let nombreUsuario = '';
  let contrasena = '';
  let error: string | null = null;
  let loading = false;
  let success = false;
  let currentLocale = 'es';

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
    
    // Redirigir si ya está autenticado
    if (authService.isAuthenticated()) {
      goto('/dashboard');
    }
  });

  // Variables reactivas para validar formulario - CORREGIDAS
  $: usuarioLength = nombreUsuario.trim().length;
  $: contrasenaLength = contrasena.trim().length;
  $: isFormValid = usuarioLength > 0 && contrasenaLength > 0;
  $: isButtonDisabled = loading || success || !isFormValid;

  // Debug reactivo mejorado
  $: if (import.meta.env.DEV) {
    console.log('🔍 Debug Login Form:', {
      nombreUsuario: `"${nombreUsuario}"`,
      contrasena: contrasena ? `"${'*'.repeat(contrasena.length)}"` : '""',
      usuarioLength,
      contrasenaLength,
      isFormValid,
      isButtonDisabled,
      loading,
      success
    });
  }

  async function handleLogin(e: Event) {
    e.preventDefault();
    
    // Resetear estados
    error = null;
    success = false;
    
    loading = true;
    
    try {
      console.log('Intentando login con:', { nombreUsuario, contrasena: '***' });
      
      const result = await authService.login(nombreUsuario.trim(), contrasena.trim());
      
      console.log('Resultado login:', { success: result.success, error: result.error });
      
      if (result.success) {
        success = true;
        
        // Mostrar mensaje de éxito brevemente
        setTimeout(() => {
          goto('/dashboard');
        }, 1000);
      } else {
        error = result.error || t('loginError') || 'Error al iniciar sesión';
      }
    } catch (err: any) {
      console.error('Error durante login:', err);
      error = t('connectionError') || 'Error de conexión. Verifica que el servidor esté funcionando.';
    } finally {
      loading = false;
    }
  }

  function switchLocale() {
    currentLocale = currentLocale === 'es' ? 'en' : 'es';
  }

  // Función para probar el botón manualmente
  function testButton() {
    console.log('🔧 Test button clicked!', {
      isButtonDisabled,
      loading,
      success,
      isFormValid,
      usuarioLength,
      contrasenaLength
    });
  }

  // Función para llenar campos de prueba
  function testBinding() {
    nombreUsuario = 'admin';
    contrasena = 'password123';
    console.log('🧪 Campos llenados para prueba');
  }

  // Handlers para debug de input
  function handleUsernameInput(e: Event) {
    const target = e.target as HTMLInputElement;
    nombreUsuario = target.value;
    if (import.meta.env.DEV) {
      console.log('👤 Usuario input:', nombreUsuario, 'Length:', nombreUsuario.trim().length);
    }
  }

  function handlePasswordInput(e: Event) {
    const target = e.target as HTMLInputElement;
    contrasena = target.value;
    if (import.meta.env.DEV) {
      console.log('🔒 Contraseña input:', contrasena.length > 0 ? '***' : '(vacía)', 'Length:', contrasena.trim().length);
    }
  }
</script>

<svelte:head>
  <title>{t('login') || 'Iniciar Sesión'}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4">
  <div class="w-full max-w-md">
    <!-- Logo/Título del Centro Cultural -->
    <div class="text-center mb-8">
      <div class="bg-indigo-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <i class="fas fa-network-wired text-indigo-600 text-2xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {t('centroTitle') || 'Centro Cultural Víctor Jara'}
      </h1>
      <p class="text-gray-600">
        {t('loginSubtitle') || 'Red Comunitaria de Aprendizaje'}
      </p>
    </div>

    <!-- Formulario de Login -->
    <form class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100" on:submit={handleLogin}>
      <div class="text-center mb-6">
        <h2 class="text-xl font-semibold text-gray-800">
          {t('login') || 'Iniciar Sesión'}
        </h2>
      </div>

      <!-- Mensaje de éxito -->
      {#if success}
        <div class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <span class="text-green-700 text-sm">
              {t('loginSuccess') || 'Inicio de sesión exitoso. Redirigiendo...'}
            </span>
          </div>
        </div>
      {/if}

      <!-- Mensaje de error -->
      {#if error}
        <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <div class="flex items-center">
            <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
            <span class="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      {/if}

      <!-- Campo Usuario -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2" for="username">
          <i class="fas fa-user mr-1"></i>
          {t('username') || 'Usuario'}
        </label>
        <input
          id="username"
          type="text"
          bind:value={nombreUsuario}
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder={t('usernamePlaceholder') || 'Ingresa tu usuario'}
          required
          disabled={loading || success}
          autocomplete="username"
          on:input={handleUsernameInput}
        />
      </div>

      <!-- Campo Contraseña -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2" for="password">
          <i class="fas fa-lock mr-1"></i>
          {t('password') || 'Contraseña'}
        </label>
        <input
          id="password"
          type="password"
          bind:value={contrasena}
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder={t('passwordPlaceholder') || 'Ingresa tu contraseña'}
          required
          disabled={loading || success}
          autocomplete="current-password"
          on:input={handlePasswordInput}
        />
      </div>

      <!-- Botón de Login -->
      <button
        type="submit"
        class="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isButtonDisabled}
        on:click={testButton}
      >
        {#if loading}
          <i class="fas fa-spinner fa-spin mr-2"></i>
          {t('loggingIn') || 'Iniciando sesión...'}
        {:else if success}
          <i class="fas fa-check mr-2"></i>
          {t('redirecting') || 'Redirigiendo...'}
        {:else}
          <i class="fas fa-sign-in-alt mr-2"></i>
          {t('login') || 'Iniciar Sesión'}
        {/if}
      </button>

      <!-- Botón de prueba para debug -->
      {#if import.meta.env.DEV}
        <button
          type="button"
          class="w-full mt-2 bg-gray-500 text-white py-2 rounded-lg font-medium hover:bg-gray-600"
          on:click={testBinding}
        >
          🔧 Llenar campos de prueba
        </button>
      {/if}
    </form>

    <!-- Footer con cambio de idioma -->
    <div class="mt-6 flex justify-between items-center">
      <a href="/" class="text-indigo-600 hover:text-indigo-800 text-sm">
        <i class="fas fa-arrow-left mr-1"></i>
        {t('backToHome') || 'Volver al inicio'}
      </a>
      <button
        type="button"
        class="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        on:click={switchLocale}
        aria-label="Switch language"
        disabled={loading}
      >
        <i class="fas fa-language mr-1"></i>
        {#if currentLocale === 'es'}EN{:else}ES{/if}
      </button>
    </div>

    <!-- Debug info mejorado (solo en desarrollo) -->
    {#if import.meta.env.DEV}
      <div class="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600 space-y-1">
        <p><strong>🔧 Debug Info:</strong></p>
        <p><strong>Backend:</strong> https://localhost:5251/api/auth/login</p>
        <p><strong>Usuario:</strong> "{nombreUsuario}" (length: {usuarioLength})</p>
        <p><strong>Contraseña:</strong> "{contrasena}" (length: {contrasenaLength})</p>
        <div class="border-t pt-2 mt-2">
          <p><strong>Estado del formulario:</strong></p>
          <p>• Form Valid: <span class="font-mono {isFormValid ? 'text-green-600' : 'text-red-600'}">{isFormValid}</span></p>
          <p>• Button Disabled: <span class="font-mono {isButtonDisabled ? 'text-red-600' : 'text-green-600'}">{isButtonDisabled}</span></p>
          <p>• Loading: <span class="font-mono">{loading}</span></p>
          <p>• Success: <span class="font-mono">{success}</span></p>
        </div>
        {#if isButtonDisabled}
          <div class="bg-yellow-100 p-2 rounded text-yellow-800 mt-2">
            <strong>⚠️ Botón deshabilitado porque:</strong>
            {#if loading}• Está cargando{/if}
            {#if success}• Login exitoso{/if}
            {#if !isFormValid}• Formulario inválido (usuario: {usuarioLength}, contraseña: {contrasenaLength}){/if}
          </div>
        {:else}
          <div class="bg-green-100 p-2 rounded text-green-800 mt-2">
            <strong>✅ Botón habilitado - listo para submit</strong>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>