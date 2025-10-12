<script>
  // Direct debug without any imports
  let debugInfo = '';

  function testDirectImport() {
    try {
      import('../../lib/paraglide/messages/es.js').then(mod => {
        console.log('ES Module loaded:', mod);
        debugInfo += 'ES Module: ' + JSON.stringify(mod, null, 2);
      });

      import('../../lib/paraglide/messages/en.js').then(mod => {
        console.log('EN Module loaded:', mod);
        debugInfo += '\nEN Module: ' + JSON.stringify(mod, null, 2);
      });
    } catch (error) {
      debugInfo = 'Error: ' + error.message;
    }
  }

  if (typeof window !== 'undefined') {
    testDirectImport();
  }
</script>

<div class="p-8">
  <h1>Debug i18n</h1>
  <button class="px-4 py-2 bg-blue-500 text-white rounded" on:click={testDirectImport}>
    Test Import
  </button>
  <pre class="mt-4 bg-gray-100 p-4 text-xs">{debugInfo}</pre>
</div>