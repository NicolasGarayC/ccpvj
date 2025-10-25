# 🧪 Guía Completa de Testing - Centro Cultural Víctor Jara

> **Última Actualización**: Octubre 2025
> **Estado**: ✅ **Configurado y Listo para Usar**

## 📋 Índice

1. [Introducción](#introducción)
2. [Stack de Testing](#stack-de-testing)
3. [Tests Unitarios (Frontend)](#tests-unitarios-frontend---vitest)
4. [Tests E2E (Frontend)](#tests-e2e-frontend---playwright)
5. [Tests Unitarios (Backend)](#tests-unitarios-backend---xunit)
6. [Tests de Integración (Backend)](#tests-de-integración-backend)
7. [Ejecutar Tests](#ejecutar-tests)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Estructura de Archivos](#estructura-de-archivos)
10. [CI/CD](#cicd)

---

## 📖 Introducción

Este proyecto implementa una estrategia de testing completa que cubre:

- ✅ **Tests Unitarios**: Verifican funciones y componentes individuales
- ✅ **Tests de Integración**: Verifican interacción entre componentes
- ✅ **Tests E2E**: Verifican flujos completos de usuario

### Cobertura Objetivo

| Tipo | Objetivo de Cobertura |
|------|----------------------|
| **Tests Unitarios** | 80% del código |
| **Tests E2E** | Flujos críticos al 100% |
| **Tests de Integración** | APIs principales al 90% |

---

## 🛠️ Stack de Testing

### Frontend

| Herramienta | Uso | Versión |
|-------------|-----|---------|
| **Vitest** | Tests unitarios | 3.2.3 |
| **Playwright** | Tests E2E | 1.49.1 |
| **Testing Library** | Queries y assertions | Latest |
| **@vitest/browser** | Tests en navegador | 3.2.3 |

### Backend

| Herramienta | Uso | Versión |
|-------------|-----|---------|
| **xUnit** | Framework de tests | 2.9.3 |
| **Moq** | Mocking de dependencias | 4.20.72 |
| **FluentAssertions** | Assertions legibles | 6.12.2 |
| **InMemory Database** | DB para tests | 8.0.0 |

---

## 🎯 Tests Unitarios (Frontend) - Vitest

### Configuración

Archivo: `Front/vitest.config.ts`

```typescript
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      expect: { requireAssertions: true },
      projects: [
        {
          test: {
            name: 'client',
            environment: 'browser',
            browser: {
              enabled: true,
              provider: 'playwright',
              instances: [{ browser: 'chromium' }]
            },
            include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
            exclude: ['src/lib/server/**'],
            setupFiles: ['./vitest-setup-client.ts']
          }
        },
        {
          test: {
            name: 'server',
            environment: 'node',
            include: ['src/**/*.{test,spec}.{js,ts}'],
            exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
          }
        }
      ]
    }
  })
);
```

### Estructura de Tests Unitarios

```
Front/src/lib/
├── services/
│   ├── auth/
│   │   ├── jwtService.ts
│   │   └── __tests__/
│   │       └── jwtService.test.ts
│   ├── blog/
│   │   ├── blogService.ts
│   │   └── __tests__/
│   │       └── blogService.test.ts
│   └── materialApoyoService.ts
│
└── components/
    ├── blog/
    │   ├── BlogPostCard.svelte
    │   └── __tests__/
    │       └── BlogPostCard.svelte.test.ts
    └── common/
        └── __tests__/
```

### Ejemplo: Test de Servicio

```typescript
// Front/src/lib/application/services/auth/__tests__/jwtService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { jwtService } from '../jwtService';

describe('JwtService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve token', () => {
    const token = 'test-token';
    jwtService.setToken(token);

    expect(jwtService.getToken()).toBe(token);
  });

  it('should validate authentication', () => {
    const validToken = createMockToken({ exp: futureTimestamp });
    const user = { id: 1, username: 'test', role: 'admin' };

    jwtService.setToken(validToken);
    jwtService.setUser(user);

    expect(jwtService.isAuthenticated()).toBe(true);
  });
});
```

### Ejemplo: Test de Componente Svelte

```typescript
// Front/src/lib/components/blog/__tests__/BlogPostCard.svelte.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import BlogPostCard from '../BlogPostCard.svelte';

describe('BlogPostCard', () => {
  it('should render post title', () => {
    const post = {
      id: '1',
      title: 'Test Post',
      subtitle: 'Test Subtitle',
      slug: 'test-post'
    };

    const { getByText } = render(BlogPostCard, { props: { post } });

    expect(getByText('Test Post')).toBeInTheDocument();
  });

  it('should emit click event', async () => {
    const post = { id: '1', title: 'Test', slug: 'test' };
    const { component, getByRole } = render(BlogPostCard, { props: { post } });

    let clicked = false;
    component.$on('click', () => { clicked = true; });

    await getByRole('article').click();

    expect(clicked).toBe(true);
  });
});
```

### Patrón Svelte 5 (render + mocks)

La configuración en `Front/vitest-setup-client.ts` intercepta `@testing-library/svelte` para restaurar `component.$on` en entornos Svelte 5 y expone utilidades de traducción de `i18n`. Al escribir nuevos tests:

- Importa `render` directamente de `@testing-library/svelte`; el wrapper ya adjunta `$on`, por lo que no se necesitan polyfills manuales.
- Configura traducciones puntuales con `import { __setTranslations } from '$lib/i18n'` antes de cada test y restáuralas con `__resetTranslations()` en `afterEach` si no reutilizas el hook global.
- Cuando simules componentes hijos, usa mocks funcionales que devuelvan `{ $set, $on, $destroy }` para evitar el error `Class constructor ... cannot be invoked without 'new'`.

Ejemplo de mock compatible:

```typescript
vi.mock('$lib/presentation/components/common/FeatureCard.svelte', () => ({
  default: vi.fn((options = { props: {} }) => {
    let currentProps = options.props;
    return {
      $set(newProps: Record<string, unknown>) {
        currentProps = { ...currentProps, ...newProps };
      },
      $on: vi.fn(),
      $destroy: vi.fn(),
      get props() {
        return currentProps;
      }
    };
  })
}));
```

Para servicios y stores, apunta a la nueva estructura modular (`$lib/{application,domain,infrastructure,presentation}`) y evita usar rutas legacy como `$lib/services/**`.

### Comandos

```bash
cd Front/

# Ejecutar todos los tests unitarios
npm run test:unit

# Ejecutar en modo watch
npm run test:unit -- --watch

# Ejecutar tests específicos
npm run test:unit -- jwtService

# Con cobertura
npm run test:unit -- --coverage

# UI interactiva
npm run test:unit -- --ui
```

---

## 🌐 Tests E2E (Frontend) - Playwright

### Configuración

Archivo: `Front/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

### Estructura de Tests E2E

```
Front/e2e/
├── auth/
│   ├── login.spec.ts
│   ├── logout.spec.ts
│   └── session.spec.ts
├── blog/
│   ├── crud.spec.ts
│   ├── publish.spec.ts
│   └── search.spec.ts
├── material-apoyo/
│   ├── crud.spec.ts
│   ├── modules.spec.ts
│   └── posts.spec.ts
├── library/
│   ├── upload.spec.ts
│   ├── download.spec.ts
│   └── search.spec.ts
└── calendar/
    ├── events.spec.ts
    └── recurrence.spec.ts
```

### Ejemplo: Test E2E de Autenticación

```typescript
// Front/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should login successfully', async ({ page }) => {
    await page.getByLabel(/usuario|username/i).fill('admin');
    await page.getByLabel(/contraseña|password/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Verificar redirección
    await page.waitForURL(/\/(dashboard|material-apoyo)/);

    // Verificar que está autenticado
    await expect(
      page.getByRole('button', { name: /cerrar sesión/i })
    ).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel(/usuario/i).fill('wronguser');
    await page.getByLabel(/contraseña/i).fill('wrongpass');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    await expect(
      page.getByText(/credenciales.*incorrectas/i)
    ).toBeVisible();
  });
});
```

### Ejemplo: Test E2E de CRUD

```typescript
// Front/e2e/material-apoyo/crud.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Material de Apoyo CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByLabel(/usuario/i).fill('admin');
    await page.getByLabel(/contraseña/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/\//);

    // Navegar a material de apoyo
    await page.goto('/material-apoyo');
  });

  test('should create new material', async ({ page }) => {
    await page.getByRole('link', { name: /crear|nuevo/i }).click();

    const timestamp = Date.now();
    await page.getByLabel(/título/i).fill(`Material ${timestamp}`);
    await page.getByLabel(/descripción/i).fill('Descripción de prueba');

    await page.getByRole('button', { name: /guardar|crear/i }).click();

    await expect(
      page.getByText(/creado.*éxito/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should edit material', async ({ page }) => {
    const firstMaterial = page.locator('[data-testid="material-card"]').first();
    await firstMaterial.getByRole('link', { name: /editar/i }).click();

    const titleInput = page.getByLabel(/título/i);
    await titleInput.clear();
    await titleInput.fill(`Editado ${Date.now()}`);

    await page.getByRole('button', { name: /guardar/i }).click();

    await expect(
      page.getByText(/actualizado.*éxito/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
```

### Comandos

```bash
cd Front/

# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar en modo headed (ver navegador)
npm run test:e2e -- --headed

# Ejecutar en navegador específico
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Modo debug
npm run test:e2e -- --debug

# Generar reporte HTML
npm run test:e2e -- --reporter=html

# Ver reporte
npx playwright show-report
```

---

## 🔧 Tests Unitarios (Backend) - xUnit

### Configuración

Archivo: `Back/CentroCultural.Tests/CentroCultural.Tests.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.1" />
    <PackageReference Include="xunit" Version="2.9.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="3.0.0" />
    <PackageReference Include="Moq" Version="4.20.72" />
    <PackageReference Include="FluentAssertions" Version="6.12.2" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\CentroCultural.API\CentroCultural.API.csproj" />
    <ProjectReference Include="..\CentroCultural.Application\CentroCultural.Application.csproj" />
    <ProjectReference Include="..\CentroCultural.Domain\CentroCultural.Domain.csproj" />
    <ProjectReference Include="..\CentroCultural.Infrastructure\CentroCultural.Infrastructure.csproj" />
  </ItemGroup>
</Project>
```

### Estructura de Tests Backend

```
Back/CentroCultural.Tests/
├── Unit/
│   ├── Services/
│   │   ├── MaterialApoyoServiceTests.cs
│   │   ├── BlogServiceTests.cs
│   │   ├── CalendarServiceTests.cs
│   │   └── DigitalLibraryServiceTests.cs
│   ├── Entities/
│   │   └── MaterialApoyoTests.cs
│   └── Validators/
│       └── MaterialApoyoValidatorTests.cs
│
├── Integration/
│   ├── API/
│   │   ├── MaterialApoyoControllerTests.cs
│   │   ├── BlogControllerTests.cs
│   │   └── AuthControllerTests.cs
│   └── Database/
│       └── CascadeDeleteTests.cs
│
└── Helpers/
    ├── TestDbContextFactory.cs
    └── TestDataSeeder.cs
```

### Ejemplo: Test Unitario de Servicio

```csharp
// Back/CentroCultural.Tests/Unit/Services/MaterialApoyoServiceTests.cs
using CentroCultural.Application.Services;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CentroCultural.Tests.Unit.Services;

public class MaterialApoyoServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly MaterialApoyoService _service;

    public MaterialApoyoServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _service = new MaterialApoyoService(_context);

        SeedTestData();
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllActiveMaterials()
    {
        // Act
        var result = await _service.GetAllAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().OnlyContain(m => m.IsActive == true);
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnMaterial()
    {
        // Arrange
        var validId = "test-1";

        // Act
        var result = await _service.GetByIdAsync(validId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(validId);
        result.Title.Should().Be("Matemáticas Básicas");
    }

    [Fact]
    public async Task CreateAsync_WithValidData_ShouldCreateMaterial()
    {
        // Arrange
        var newMaterial = new MaterialApoyo
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Nuevo Material",
            Description = "Descripción",
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            EducatorId = "1"
        };

        // Act
        var result = await _service.CreateAsync(newMaterial);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(newMaterial.Id);

        var saved = await _context.MaterialApoyo.FindAsync(newMaterial.Id);
        saved.Should().NotBeNull();
    }

    private void SeedTestData()
    {
        _context.MaterialApoyo.AddRange(
            new MaterialApoyo
            {
                Id = "test-1",
                Title = "Matemáticas Básicas",
                Description = "Curso básico",
                IsActive = true,
                IsFeatured = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                EducatorId = "1"
            },
            new MaterialApoyo
            {
                Id = "test-2",
                Title = "Física Avanzada",
                Description = "Curso avanzado",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                EducatorId = "1"
            }
        );
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
```

### Ejemplo: Test con Mocking

```csharp
using Moq;
using Xunit;
using FluentAssertions;

public class BlogServiceTests
{
    [Fact]
    public async Task PublishPost_ShouldSetPublishedDate()
    {
        // Arrange
        var mockContext = new Mock<ApplicationDbContext>();
        var mockSet = new Mock<DbSet<BlogPost>>();

        mockContext.Setup(c => c.BlogPost).Returns(mockSet.Object);

        var service = new BlogService(mockContext.Object);
        var post = new BlogPost { Id = "1", Title = "Test" };

        // Act
        await service.PublishAsync(post.Id);

        // Assert
        mockContext.Verify(c => c.SaveChangesAsync(default), Times.Once);
    }
}
```

### Comandos

```bash
cd Back/

# Ejecutar todos los tests
dotnet test

# Ejecutar tests con verbosidad
dotnet test --logger "console;verbosity=detailed"

# Ejecutar tests específicos
dotnet test --filter "FullyQualifiedName~MaterialApoyoServiceTests"

# Con cobertura
dotnet test --collect:"XPlat Code Coverage"

# Generar reporte de cobertura
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coveragereport
```

---

## 🔄 Tests de Integración (Backend)

### Ejemplo: Test de API Controller

```csharp
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http.Json;
using Xunit;

public class MaterialApoyoControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public MaterialApoyoControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_MaterialApoyo_ReturnsSuccessStatusCode()
    {
        // Act
        var response = await _client.GetAsync("/api/material-apoyo");

        // Assert
        response.EnsureSuccessStatusCode();
        var materials = await response.Content.ReadFromJsonAsync<List<MaterialApoyo>>();
        materials.Should().NotBeNull();
    }

    [Fact]
    public async Task POST_MaterialApoyo_CreatesNewMaterial()
    {
        // Arrange
        var newMaterial = new
        {
            title = "Test Material",
            description = "Test Description",
            educatorId = "1"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/material-apoyo", newMaterial);

        // Assert
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<MaterialApoyo>();
        created.Should().NotBeNull();
        created!.Title.Should().Be("Test Material");
    }
}
```

---

## ▶️ Ejecutar Tests

### Frontend

```bash
cd Front/

# Todos los tests
npm test

# Solo unitarios
npm run test:unit

# Solo E2E
npm run test:e2e

# Watch mode (unitarios)
npm run test:unit -- --watch

# Con cobertura
npm run test:unit -- --coverage

# E2E en un navegador específico
npm run test:e2e -- --project=chromium
```

### Backend

```bash
cd Back/

# Todos los tests
dotnet test

# Solo tests unitarios
dotnet test --filter "Category=Unit"

# Solo tests de integración
dotnet test --filter "Category=Integration"

# Con cobertura
dotnet test --collect:"XPlat Code Coverage"

# Verboso
dotnet test --logger "console;verbosity=detailed"
```

---

## 📝 Mejores Prácticas

### 1. Nomenclatura de Tests

```typescript
// ✅ BUENO: Descriptivo y claro
test('should login successfully with valid credentials', ...)
test('should show error message when password is incorrect', ...)

// ❌ MALO: Vago y poco claro
test('login', ...)
test('test1', ...)
```

### 2. Estructura AAA (Arrange-Act-Assert)

```typescript
test('should create material successfully', async () => {
  // Arrange: Preparar datos y estado
  const newMaterial = {
    title: 'Test Material',
    description: 'Test Description'
  };

  // Act: Ejecutar la acción que se está probando
  const result = await createMaterial(newMaterial);

  // Assert: Verificar el resultado
  expect(result).toBeDefined();
  expect(result.title).toBe('Test Material');
});
```

### 3. Tests Independientes

```typescript
// ✅ BUENO: Cada test limpia su estado
test.beforeEach(() => {
  localStorage.clear();
  mockReset();
});

// ❌ MALO: Tests que dependen del orden
let globalState = {};
test('first', () => { globalState.x = 1; });
test('second', () => { expect(globalState.x).toBe(1); }); // Depende del anterior
```

### 4. Evitar Lógica Compleja en Tests

```typescript
// ✅ BUENO: Simple y directo
test('should filter active materials', () => {
  const materials = [
    { id: '1', isActive: true },
    { id: '2', isActive: false }
  ];

  const result = materials.filter(m => m.isActive);

  expect(result).toHaveLength(1);
});

// ❌ MALO: Lógica compleja difícil de mantener
test('complex filter', () => {
  const materials = getMaterials();
  for (let i = 0; i < materials.length; i++) {
    if (materials[i].isActive && materials[i].featured) {
      // ... lógica compleja
    }
  }
  // ...
});
```

### 5. Usar Test Data Builders

```typescript
// Helper para crear datos de prueba
function createMaterialData(overrides = {}) {
  return {
    id: Guid.NewGuid().toString(),
    title: 'Default Title',
    description: 'Default Description',
    isActive: true,
    isFeatured: false,
    ...overrides
  };
}

// Uso en tests
test('should handle featured materials', () => {
  const material = createMaterialData({ isFeatured: true });
  // ...
});
```

### 6. Mocking Estratégico

```typescript
// ✅ BUENO: Mock solo lo necesario
vi.mock('../api', () => ({
  fetchMaterials: vi.fn(() => Promise.resolve([]))
}));

// ❌ MALO: Mock de todo el módulo sin necesidad
vi.mock('../entire-module');
```

---

## 📁 Estructura de Archivos

### Frontend

```
Front/
├── src/
│   ├── lib/
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   │   ├── jwtService.ts
│   │   │   │   └── __tests__/
│   │   │   │       └── jwtService.test.ts
│   │   │   └── blog/
│   │   │       ├── blogService.ts
│   │   │       └── __tests__/
│   │   │           └── blogService.test.ts
│   │   └── components/
│   │       └── __tests__/
│   └── routes/
│       └── __tests__/
├── e2e/
│   ├── auth/
│   │   └── login.spec.ts
│   ├── blog/
│   │   └── crud.spec.ts
│   └── material-apoyo/
│       └── crud.spec.ts
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

### Backend

```
Back/
├── CentroCultural.Tests/
│   ├── Unit/
│   │   ├── Services/
│   │   │   ├── MaterialApoyoServiceTests.cs
│   │   │   └── BlogServiceTests.cs
│   │   └── Entities/
│   ├── Integration/
│   │   ├── API/
│   │   │   └── MaterialApoyoControllerTests.cs
│   │   └── Database/
│   └── CentroCultural.Tests.csproj
└── Back.sln
```

---

## 🚀 CI/CD

### GitHub Actions (Ejemplo)

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd Front && npm ci

      - name: Run unit tests
        run: cd Front && npm run test:unit

      - name: Run E2E tests
        run: cd Front && npm run test:e2e

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'

      - name: Restore dependencies
        run: cd Back && dotnet restore

      - name: Run tests
        run: cd Back && dotnet test --no-restore
```

---

## 📊 Cobertura de Código

### Frontend (Vitest)

```bash
# Generar reporte de cobertura
npm run test:unit -- --coverage

# Abrir reporte HTML
open coverage/index.html
```

### Backend (.NET)

```bash
# Instalar herramienta de reportes
dotnet tool install -g dotnet-reportgenerator-globaltool

# Ejecutar tests con cobertura
dotnet test --collect:"XPlat Code Coverage"

# Generar reporte HTML
reportgenerator \
  -reports:**/coverage.cobertura.xml \
  -targetdir:coveragereport \
  -reporttypes:Html

# Abrir reporte
open coveragereport/index.html
```

---

## 📚 Ejemplo Completo: Testing de Material de Apoyo

Esta sección muestra la cobertura completa de testing para el módulo de Material de Apoyo, que incluye una jerarquía de tres niveles: **Material de Apoyo → Módulo → Post**.

### Arquitectura del Módulo

```
Material de Apoyo (Proyecto)
    ├── GET operations: Público (sin autenticación)
    ├── CREATE/UPDATE/DELETE: Requiere JWT
    │
    ├── Módulos (1 a n)
    │   ├── GET operations: Público
    │   ├── CREATE/UPDATE/DELETE: Requiere JWT
    │   │
    │   └── Posts (1 a n)
    │       ├── GET operations: Público
    │       └── CREATE/UPDATE/DELETE: Requiere JWT
```

### 1. Tests Unitarios del Servicio

**Archivo**: `Front/src/lib/application/services/material-apoyo/__tests__/materialApoyoService.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { materialApoyoService } from '$lib/application/services/material-apoyo/MaterialApoyoService';

describe('Material de Apoyo - GET (Público)', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
  });

  it('should get all material de apoyo without auth', async () => {
    const mockData = [
      {
        id: '1',
        title: 'Matemáticas Básicas',
        description: 'Curso de matemáticas',
        isActive: true,
        isFeatured: false,
        createdAt: Date.now(),
        educatorId: '1',
        educatorName: 'Prof. Test',
        modules: []
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockData, totalItems: 1, totalPages: 1 })
    });

    const result = await materialApoyoService.getMaterialApoyo();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/materialapoyo'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result.data).toEqual(mockData);
  });
});

describe('Material de Apoyo - CRUD (Protegido)', () => {
  beforeEach(() => {
    global.fetch = vi.fn();

    // Mock JWT token válido
    (global.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === 'jwt_token') return 'valid-jwt-token';
      if (key === 'jwt_user')
        return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
      return null;
    });
  });

  it('should create material de apoyo with JWT token', async () => {
    const newMaterial = {
      title: 'Nuevo Material',
      description: 'Descripción del material',
      educatorId: '1'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'new-id', ...newMaterial })
    });

    await materialApoyoService.createMaterialApoyo(newMaterial);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/materialapoyo'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-jwt-token'
        })
      })
    );
  });

  it('should throw error when creating without valid token', async () => {
    localStorage.clear();

    await expect(
      materialApoyoService.createMaterialApoyo({
        title: 'Test',
        description: 'Test',
        educatorId: '1'
      })
    ).rejects.toThrow(/no autenticado|unauthorized/i);
  });
});

describe('Módulos - CRUD Operations', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    (global.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === 'jwt_token') return 'valid-jwt-token';
      return null;
    });
  });

  it('should create module with JWT', async () => {
    const newModule = {
      title: 'Módulo 1',
      description: 'Descripción',
      materialApoyoId: 'material-1'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'module-id', ...newModule })
    });

    await materialApoyoService.createModule(newModule);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/modulo'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-jwt-token'
        })
      })
    );
  });

  it('should reorder modules', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await materialApoyoService.reorderModules('material-1', [
      { id: 'mod-1', orderNumber: 1 },
      { id: 'mod-2', orderNumber: 2 }
    ]);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/modulo/reorder'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-jwt-token'
        })
      })
    );
  });
});

describe('Posts - CRUD Operations', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    (global.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === 'jwt_token') return 'valid-jwt-token';
      return null;
    });
  });

  it('should create post with JWT', async () => {
    const newPost = {
      title: 'Post 1',
      content: 'Contenido del post',
      moduleId: 'module-1'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'post-id', ...newPost })
    });

    await materialApoyoService.createPost(newPost);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/post'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-jwt-token'
        })
      })
    );
  });
});

describe('Authorization Checks', () => {
  it('should verify admin has full access', () => {
    (global.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === 'jwt_user')
        return JSON.stringify({ id: 1, username: 'admin', role: 'administrador' });
      return null;
    });

    const status = materialApoyoService.checkAuthStatus();

    expect(status.canCreate).toBe(true);
    expect(status.canEdit).toBe(true);
    expect(status.canDelete).toBe(true);
  });

  it('should verify colaborador has limited access', () => {
    (global.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === 'jwt_user')
        return JSON.stringify({ id: 2, username: 'colab', role: 'colaborador' });
      return null;
    });

    const status = materialApoyoService.checkAuthStatus();

    expect(status.canCreate).toBe(true);
    expect(status.canEditOwn).toBe(true);
    expect(status.canDeleteOwn).toBe(true);
  });

  it('should verify asistente has read-only access', () => {
    (global.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === 'jwt_user')
        return JSON.stringify({ id: 3, username: 'asist', role: 'asistente' });
      return null;
    });

    const status = materialApoyoService.checkAuthStatus();

    expect(status.canCreate).toBe(false);
    expect(status.canEdit).toBe(false);
    expect(status.canDelete).toBe(false);
  });
});
```

**Cobertura del Servicio**:
- ✅ 40+ test cases
- ✅ GET operations (público)
- ✅ CREATE/UPDATE/DELETE operations (JWT protected)
- ✅ Jerarquía completa: Material → Módulo → Post
- ✅ Validación de autorización por rol
- ✅ Manejo de errores

### 2. Tests E2E de Jerarquía Completa

**Archivo**: `Front/e2e/material-apoyo/hierarchy.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Material de Apoyo - Jerarquía Completa', () => {
  test.beforeEach(async ({ page }) => {
    // Login como administrador
    await page.goto('/auth/login');
    await page.getByLabel(/usuario|username/i).fill('admin');
    await page.getByLabel(/contraseña|password/i).fill('admin123');
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click();
    await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);
  });

  test('should complete full hierarchy: Material → Module → Post', async ({ page }) => {
    const timestamp = Date.now();

    // ==========================================
    // PASO 1: Crear Material de Apoyo
    // ==========================================
    await page.goto('/material-apoyo');
    await page.getByRole('link', { name: /crear|nuevo material/i }).click();

    await page.getByLabel(/título|title/i).fill(`Material E2E ${timestamp}`);
    await page.getByLabel(/descripción|description/i)
      .fill('Material creado por test E2E');

    await page.getByRole('button', { name: /guardar|crear/i }).click();

    await expect(
      page.getByText(/creado.*éxito|created.*successfully/i)
    ).toBeVisible({ timeout: 5000 });

    // ==========================================
    // PASO 2: Crear Módulo
    // ==========================================
    const createModuleButton = page.getByRole('button', {
      name: /agregar.*módulo|crear módulo/i
    });
    await createModuleButton.waitFor({ state: 'visible', timeout: 5000 });
    await createModuleButton.click();

    await page.getByLabel(/título.*módulo|module.*title/i)
      .fill(`Módulo E2E ${timestamp}`);
    await page.getByLabel(/descripción.*módulo|module.*description/i)
      .fill('Módulo creado por test E2E');

    await page.getByRole('button', { name: /guardar.*módulo|save.*module/i }).click();

    await expect(
      page.getByText(/módulo.*creado|module.*created/i)
    ).toBeVisible({ timeout: 5000 });

    // ==========================================
    // PASO 3: Entrar al Módulo y Crear Post
    // ==========================================
    const moduleCard = page.getByText(`Módulo E2E ${timestamp}`);
    await moduleCard.click();

    await expect(
      page.getByRole('heading', { name: `Módulo E2E ${timestamp}` })
    ).toBeVisible();

    const createPostButton = page.getByRole('button', {
      name: /agregar.*post|crear post/i
    });
    await createPostButton.waitFor({ state: 'visible', timeout: 5000 });
    await createPostButton.click();

    await page.getByLabel(/título.*post|post.*title/i)
      .fill(`Post E2E ${timestamp}`);
    await page.getByLabel(/contenido|content|descripción/i)
      .fill('Post creado por test E2E');

    await page.getByRole('button', { name: /guardar.*post|save.*post/i }).click();

    await expect(
      page.getByText(/post.*creado|post.*created/i)
    ).toBeVisible({ timeout: 5000 });

    console.log('✓ Jerarquía completa creada exitosamente');
  });

  test('should delete module (cascade deletes posts)', async ({ page }) => {
    const timestamp = Date.now();

    // Crear material y módulo con posts
    await page.goto('/material-apoyo/create');
    await page.getByLabel(/título/i).fill(`Material Cascade ${timestamp}`);
    await page.getByLabel(/descripción/i).fill('Para probar cascade delete');
    await page.getByRole('button', { name: /guardar|crear/i }).click();

    await page.waitForURL(/\/material-apoyo\/[a-f0-9-]+/);

    // Crear módulo
    await page.getByRole('button', { name: /agregar.*módulo/i }).click();
    await page.getByLabel(/título.*módulo/i).fill('Módulo a Eliminar');
    await page.getByRole('button', { name: /guardar.*módulo/i }).click();

    await expect(page.getByText(/módulo.*creado/i)).toBeVisible({ timeout: 5000 });

    // Eliminar el módulo
    const deleteModuleButton = page.getByRole('button', {
      name: /eliminar.*módulo/i
    }).first();
    await deleteModuleButton.click();

    // Confirmar
    await page.getByRole('button', { name: /confirmar|sí/i }).click();

    // Verificar eliminación
    await expect(
      page.getByText(/eliminado.*éxito/i)
    ).toBeVisible({ timeout: 5000 });

    console.log('✓ Módulo eliminado con cascade');
  });
});
```

**Cobertura E2E**:
- ✅ Flujo completo: Crear Material → Módulo → Post
- ✅ Operaciones de edición en cada nivel
- ✅ Operaciones de eliminación con cascade
- ✅ Navegación entre niveles
- ✅ Reordenamiento de módulos y posts

### 3. Tests E2E de Autorización

**Archivo**: `Front/e2e/material-apoyo/authorization.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Material de Apoyo - Authorization Tests', () => {
  test.describe('Public Access (No Authentication)', () => {
    test('should allow viewing materials list without login', async ({ page }) => {
      await page.goto('/material-apoyo');

      await expect(page).toHaveURL(/\/material-apoyo/);
      await expect(
        page.getByRole('heading', { name: /material.*apoyo|materiales/i })
      ).toBeVisible();

      // Verificar que NO aparecen botones de crear
      await expect(
        page.getByRole('link', { name: /crear|nuevo/i })
      ).not.toBeVisible();
    });

    test('should redirect to login when trying to create without auth', async ({ page }) => {
      await page.goto('/material-apoyo/create');

      await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/auth/login');
    });
  });

  test.describe('Admin Role - Full Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
      await page.getByLabel(/usuario/i).fill('admin');
      await page.getByLabel(/contraseña/i).fill('admin123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      await page.waitForURL(/\/(dashboard|material-apoyo|blog)?/);
    });

    test('admin should create material de apoyo', async ({ page }) => {
      const timestamp = Date.now();

      await page.goto('/material-apoyo');
      await page.getByRole('link', { name: /crear|nuevo material/i }).click();

      await page.getByLabel(/título|title/i).fill(`Material Admin ${timestamp}`);
      await page.getByLabel(/descripción|description/i).fill('Creado por admin');

      await page.getByRole('button', { name: /guardar|crear/i }).click();

      await expect(
        page.getByText(/creado.*éxito|created.*successfully/i)
      ).toBeVisible({ timeout: 5000 });
    });

    test('admin should update any material de apoyo', async ({ page }) => {
      await page.goto('/material-apoyo');

      const firstMaterial = page.locator('[data-testid="material-card"]').first();

      if (await firstMaterial.isVisible()) {
        await firstMaterial.click();

        const editButton = page.getByRole('button', { name: /editar|edit/i });
        await expect(editButton).toBeVisible();
        await editButton.click();

        const titleInput = page.getByLabel(/título|title/i);
        await titleInput.clear();
        await titleInput.fill(`Material Editado ${Date.now()}`);

        await page.getByRole('button', { name: /guardar|actualizar/i }).click();

        await expect(
          page.getByText(/actualizado.*éxito|updated.*successfully/i)
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Invalid or Expired Token', () => {
    test('should reject invalid token', async ({ page }) => {
      await page.goto('/material-apoyo');

      await page.evaluate(() => {
        localStorage.setItem('jwt_token', 'invalid-token-123');
        localStorage.setItem('jwt_user', JSON.stringify({ id: 1, username: 'fake' }));
      });

      await page.goto('/material-apoyo/create');

      const isLoginPage = await page.url().includes('/auth/login');
      const hasError = await page.getByText(/no autorizado|unauthorized/i).isVisible();

      expect(isLoginPage || hasError).toBe(true);
    });
  });
});
```

**Cobertura de Autorización**:
- ✅ Acceso público sin autenticación
- ✅ Redirección a login para rutas protegidas
- ✅ Permisos de administrador (full access)
- ✅ Validación de tokens inválidos/expirados
- ✅ Persistencia de sesión

### 4. Tests de Componentes Svelte

**Archivo**: `Front/src/lib/components/material-apoyo/__tests__/MaterialApoyoCard.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import MaterialApoyoCard from '../MaterialApoyoCard.svelte';

describe('MaterialApoyoCard', () => {
  const mockMaterial = {
    id: 'test-1',
    title: 'Matemáticas Básicas',
    description: 'Curso completo de matemáticas',
    isActive: true,
    isFeatured: false,
    createdAt: 1735689600,
    educatorId: '1',
    educatorName: 'Prof. Test',
    imagePath: '/media/test.jpg',
    moduleCount: 5,
    postCount: 15
  };

  it('should render material card with all information', () => {
    render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: false });

    expect(screen.getByText('Matemáticas Básicas')).toBeInTheDocument();
    expect(screen.getByText(/Curso completo de matemáticas/)).toBeInTheDocument();
    expect(screen.getByText('Prof. Test')).toBeInTheDocument();
    expect(screen.getByText(/5 módulos/)).toBeInTheDocument();
    expect(screen.getByText(/15 contenidos/)).toBeInTheDocument();
  });

  it('should display featured badge when isFeatured is true', () => {
    const featuredMaterial = { ...mockMaterial, isFeatured: true };
    render(MaterialApoyoCard, { materialApoyo: featuredMaterial, showActions: false });

    expect(screen.getByText('Destacado')).toBeInTheDocument();
  });

  it('should show admin actions when showActions is true', () => {
    render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: true });

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('should open delete modal when delete button is clicked', async () => {
    render(MaterialApoyoCard, { materialApoyo: mockMaterial, showActions: true });

    const deleteButton = screen.getByRole('button', { name: /eliminar/i });
    await fireEvent.click(deleteButton);

    expect(screen.getByText(/eliminar material de apoyo/i)).toBeInTheDocument();
  });
});
```

**Cobertura de Componentes**:
- ✅ Renderizado de información
- ✅ Badges (destacado, activo/inactivo)
- ✅ Acciones de administrador
- ✅ Modales de confirmación
- ✅ Eventos personalizados
- ✅ Manejo de imágenes

### 5. Tests Unitarios Backend (C#)

**Archivo**: `Back/CentroCultural.Tests/Unit/Services/MaterialApoyoServiceTests.cs`

```csharp
using CentroCultural.Application.Services;
using CentroCultural.Domain.Entities;
using CentroCultural.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class MaterialApoyoServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly MaterialApoyoService _service;

    public MaterialApoyoServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _service = new MaterialApoyoService(_context);

        SeedTestData();
    }

    private void SeedTestData()
    {
        var materiales = new List<MaterialApoyo>
        {
            new MaterialApoyo
            {
                Id = "test-1",
                Title = "Matemáticas Básicas",
                Description = "Curso de matemáticas",
                IsActive = true,
                IsFeatured = true,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                EducatorId = "1",
                EducatorName = "Prof. Test"
            }
        };

        _context.MaterialApoyo.AddRange(materiales);
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllActiveMaterials()
    {
        var result = await _service.GetAllAsync();

        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.Should().OnlyContain(m => m.IsActive == true);
    }

    [Fact]
    public async Task CreateAsync_WithValidData_ShouldCreateMaterial()
    {
        var newMaterial = new MaterialApoyo
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Nuevo Material",
            Description = "Descripción",
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            EducatorId = "1"
        };

        var result = await _service.CreateAsync(newMaterial);

        result.Should().NotBeNull();
        result.Id.Should().Be(newMaterial.Id);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
```

### Resumen de Cobertura Material de Apoyo

| Tipo de Test | Archivo | Tests | Cobertura |
|-------------|---------|-------|-----------|
| **Service Unit Tests** | `materialApoyoService.test.ts` | 40+ | Servicios completos |
| **Component Tests** | `MaterialApoyoCard.test.ts` | 30+ | Componente card |
| **Component Tests** | `ModuleCard.test.ts` | 35+ | Componente módulo |
| **Component Tests** | `MaterialApoyoForm.test.ts` | 40+ | Formulario |
| **E2E Hierarchy** | `hierarchy.spec.ts` | 6 | Flujos completos |
| **E2E Authorization** | `authorization.spec.ts` | 12 | Autorización JWT |
| **Backend Unit** | `MaterialApoyoServiceTests.cs` | 10+ | Servicios backend |

**Total**: ~170+ test cases cubriendo la jerarquía completa de Material de Apoyo.

### Ejecutar Tests de Material de Apoyo

```bash
# Frontend - Todos los tests de Material de Apoyo
npm run test:unit -- materialApoyo
npm run test:e2e -- material-apoyo

# Backend
dotnet test --filter "FullyQualifiedName~MaterialApoyoServiceTests"
```

---

## 🎓 Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [xUnit Documentation](https://xunit.net/)
- [FluentAssertions Documentation](https://fluentassertions.com/)
- [Moq Documentation](https://github.com/moq/moq4)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)

---

**Nota**: Esta guía se actualizará conforme se agreguen más tests al proyecto.

*Última actualización: Octubre 2025*
