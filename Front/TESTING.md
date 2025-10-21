# 🧪 Testing - Centro Cultural Víctor Jara

Guía rápida para ejecutar y desarrollar tests en el proyecto.

## 🚀 Inicio Rápido

### Opción 1: Script Interactivo (Recomendado)

```bash
./run-tests.sh
```

Este script te presenta un menú interactivo con todas las opciones de testing disponibles.

### Opción 2: Comandos Directos

```bash
# Tests unitarios
npm run test:unit

# Tests E2E
npm run test:e2e

# Todos los tests
npm test
```

## 📋 Tests Disponibles

### Tests Unitarios de Servicios

| Servicio | Comando | Tests |
|----------|---------|-------|
| Material de Apoyo | `npm run test:unit -- materialApoyoService.test.ts` | 40+ |
| Blog | `npm run test:unit -- blogService.test.ts` | 30+ |
| Calendar | `npm run test:unit -- calendarService.test.ts` | 25+ |
| Auth/JWT | `npm run test:unit -- jwtService.test.ts` | 30+ |

### Tests de Componentes

| Componente | Comando | Tests |
|------------|---------|-------|
| MaterialApoyoCard | `npm run test:unit -- MaterialApoyoCard.test.ts` | 30+ |
| ModuleCard | `npm run test:unit -- ModuleCard.test.ts` | 35+ |
| MaterialApoyoForm | `npm run test:unit -- MaterialApoyoForm.test.ts` | 40+ |

### Tests E2E

| Módulo | Comando | Tests |
|--------|---------|-------|
| Material de Apoyo (Hierarchy) | `npm run test:e2e -- material-apoyo/hierarchy` | 6 |
| Material de Apoyo (Auth) | `npm run test:e2e -- material-apoyo/authorization` | 12 |
| Blog CRUD | `npm run test:e2e -- blog/blog-crud` | 15+ |

## 🛠️ Comandos Útiles

### Modo Desarrollo

```bash
# Watch mode - reejecutar al guardar cambios
npm run test:unit -- --watch

# UI mode para E2E
npm run test:e2e -- --ui

# Headed mode - ver navegador durante E2E
npm run test:e2e -- --headed
```

### Cobertura

```bash
# Generar reporte de cobertura
npm run test:unit -- --coverage

# Ver reporte HTML
open coverage/index.html
```

### Filtros

```bash
# Ejecutar tests específicos
npm run test:unit -- MaterialApoyo  # Busca por nombre
npm run test:e2e -- --grep "should create"  # Por descripción

# Solo un navegador
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
```

## 📊 Estructura de Tests

```
src/
├── lib/
│   ├── services/
│   │   ├── __tests__/           # Tests de servicios
│   │   │   ├── materialApoyoService.test.ts
│   │   │   └── ...
│   │   ├── blog/
│   │   │   └── __tests__/
│   │   │       └── blogService.test.ts
│   │   └── calendar/
│   │       └── __tests__/
│   │           └── calendarService.test.ts
│   └── components/
│       ├── material-apoyo/
│       │   └── __tests__/       # Tests de componentes
│       │       └── MaterialApoyoCard.test.ts
│       └── course/
│           └── __tests__/
│               ├── ModuleCard.test.ts
│               └── MaterialApoyoForm.test.ts
e2e/
├── material-apoyo/              # Tests E2E
│   ├── hierarchy.spec.ts
│   └── authorization.spec.ts
└── blog/
    └── blog-crud.spec.ts
```

## ✍️ Escribir Nuevos Tests

### Test Unitario de Servicio

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myService } from '../myService';

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  it('should do something', async () => {
    // Arrange
    const mockData = { id: '1', name: 'Test' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => mockData
    });

    // Act
    const result = await myService.getSomething();

    // Assert
    expect(result).toEqual(mockData);
  });
});
```

### Test de Componente Svelte

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import MyComponent from '../MyComponent.svelte';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(MyComponent, { props: { title: 'Test' } });

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const { component } = render(MyComponent);
    const spy = vi.fn();
    component.$on('click', spy);

    await fireEvent.click(screen.getByRole('button'));

    expect(spy).toHaveBeenCalled();
  });
});
```

### Test E2E con Playwright

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login si es necesario
    await page.goto('/auth/login');
    await page.getByLabel(/usuario/i).fill('admin');
    await page.getByLabel(/contraseña/i).fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();
  });

  test('should work correctly', async ({ page }) => {
    await page.goto('/my-feature');

    await page.getByRole('button', { name: /crear/i }).click();

    await expect(page.getByText(/éxito/i)).toBeVisible();
  });
});
```

## 🔧 Configuración

### Mocks Disponibles

Los siguientes mocks están configurados automáticamente en `vitest-setup-server.ts`:

- `$app/environment` - Variables de entorno de SvelteKit
- `$app/navigation` - Navegación (goto, etc.)
- `$app/stores` - Stores de SvelteKit
- `$lib/stores/authStore` - Store de autenticación
- `$lib/config/backend` - Configuración del backend
- `localStorage` - Storage del navegador
- `fetch` - API fetch con headers completos

### Agregar Nuevos Mocks

Edita `vitest-setup-server.ts`:

```typescript
vi.mock('$lib/my-module', () => ({
  myFunction: vi.fn()
}));
```

## 🐛 Troubleshooting

### Tests fallan con "Cannot find module"

- Verifica que el mock esté en `vitest-setup-server.ts`
- Asegúrate que el path sea correcto

### Tests E2E timeout

```bash
# Aumentar timeout
npm run test:e2e -- --timeout=60000
```

### Mock de fetch no funciona

Configura el mock en el `beforeEach` de cada test:

```typescript
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({})
  });
});
```

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Guía Completa del Proyecto](../Documentation/TESTING_GUIDE.md)
- [Resumen de Tests](../Documentation/TESTS_SUMMARY.md)

## 📈 CI/CD

Los tests se ejecutan automáticamente en:

- Cada push a develop/master
- Cada pull request
- Pre-commit hooks (opcional)

Ver configuración en `.github/workflows/tests.yml`

---

**¿Preguntas?** Consulta la documentación completa o abre un issue.
