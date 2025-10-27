# ⚠️ Configuración Pendiente: Svelte Component Testing

## 📋 Estado Actual

**Tests de Componentes Svelte Creados**:
- ✅ `BlogPostCard.test.ts` - 30+ tests
- ✅ `BlogPostForm.test.ts` - 40+ tests

**Problema**: Los tests están completos pero no pueden ejecutarse debido a que Vitest no puede procesar archivos `.svelte` en el entorno de Node.

## 🔧 Dependencias Instaladas

```bash
npm install --save-dev @testing-library/svelte @testing-library/dom @testing-library/jest-dom
```

## ⚡ Opciones de Solución

### Opción 1: Usar Browser Mode de Vitest (Recomendado)

Los tests de componentes Svelte deberían ejecutarse en el proyecto `client` que usa browser mode:

**Cambios necesarios**:
1. Renombrar archivos de test:
   - `BlogPostCard.test.ts` → `BlogPostCard.svelte.test.ts`
   - `BlogPostForm.test.ts` → `BlogPostForm.svelte.test.ts`

2. Vitest automáticamente los ejecutará en el navegador con Playwright

**Ventajas**:
- No requiere configuración adicional
- Tests se ejecutan en un entorno real de navegador
- Mejor para testing de componentes interactivos

**Desventajas**:
- Más lento que tests en Node
- Requiere Playwright instalado

### Opción 2: Configurar @sveltejs/vite-plugin-svelte para Node

Agregar el plugin de Svelte a la configuración de vitest para el proyecto `server`:

```typescript
// vitest.config.ts
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          test: {
            name: 'server',
            environment: 'node',
            // Agregar plugins específicos
            plugins: [svelte()], // ESTO PUEDE CAUSAR CONFLICTOS
            // ...
          }
        }
      ]
    }
  })
);
```

**Ventajas**:
- Tests más rápidos
- No requiere navegador

**Desventajas**:
- Puede tener conflictos con SvelteKit
- Requiere configuración manual del DOM (jsdom/happy-dom)
- No prueba comportamiento real en navegador

### Opción 3: Usar Testing Library con Compilación Manual

Compilar componentes Svelte a JavaScript antes de testing:

```bash
npm install --save-dev @sveltejs/vite-plugin-svelte jsdom
```

**Configuración adicional requerida**:
- Setup de jsdom
- Configuración del compilador de Svelte
- Manejo de estilos y assets

## 🎯 Recomendación

**Usar Opción 1: Browser Mode**

Es la forma más natural de testear componentes Svelte en un proyecto SvelteKit:

1. **Renombrar archivos**:
   ```bash
   mv src/lib/components/blog/__tests__/BlogPostCard.test.ts src/lib/components/blog/__tests__/BlogPostCard.svelte.test.ts
   mv src/lib/components/blog/__tests__/BlogPostForm.test.ts src/lib/components/blog/__tests__/BlogPostForm.svelte.test.ts
   ```

2. **Ejecutar tests**:
   ```bash
   npm run test:unit -- BlogPostCard.svelte.test.ts
   ```

## 📝 Notas Importantes

### Tests Ya Funcionando en Browser Mode:
- ✅ `MaterialApoyoCard.test.ts` → renombrado a `.svelte.test.ts`
- ✅ `ModuleCard.test.ts` → renombrado a `.svelte.test.ts`
- ✅ `MaterialApoyoForm.test.ts` → renombrado a `.svelte.test.ts`

### Pattern de Archivos:
- **Server tests** (Node): `*.test.ts` - Para servicios, utilidades, lógica de negocio
- **Client tests** (Browser): `*.svelte.test.ts` - Para componentes Svelte

### Configuración Actual:
```typescript
// vitest.config.ts - Ya configurado correctamente
{
  test: {
    name: 'client',
    environment: 'browser',
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }]
    },
    include: ['src/**/*.svelte.{test,spec}.{js,ts}'], // ✅ Busca archivos .svelte.test.ts
    exclude: ['src/lib/server/**'],
    setupFiles: ['./vitest-setup-client.ts']
  }
}
```

## 🚀 Pasos Siguientes

1. ✅ Dependencias instaladas
2. ✅ Tests creados
3. ⏳ **SIGUIENTE**: Renombrar archivos con extensión `.svelte.test.ts`
4. ⏳ Ejecutar tests en browser mode
5. ⏳ Verificar que todos los tests pasen

## 📚 Referencias

- [Vitest Browser Mode](https://vitest.dev/guide/browser.html)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
- [SvelteKit Testing](https://kit.svelte.dev/docs/testing)

---

**Creado**: 2025-10-20
**Última actualización**: 2025-10-20 19:54
