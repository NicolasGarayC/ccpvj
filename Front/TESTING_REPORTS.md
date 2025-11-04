# 📊 Guía de Reportes de Pruebas

Sistema completo de generación de reportes HTML para tests unitarios (Vitest) y E2E (Playwright) con cobertura de código.

## 🚀 Inicio Rápido

### Generar Todos los Reportes (Recomendado)

```bash
cd Front/
npm run test:report
```

Este comando ejecutará:
1. ✅ Tests unitarios con cobertura
2. ✅ Tests E2E (Playwright)
3. ✅ Generación de reporte consolidado HTML

**Tiempo estimado**: 5-15 minutos (depende del número de tests)

---

## 📁 Reportes Generados

Después de ejecutar `npm run test:report`, encontrarás los siguientes reportes:

### 1. 🎯 **Reporte Consolidado** (Recomendado)
- **Ubicación**: `Front/test-reports/consolidated-report.html`
- **Descripción**: Vista unificada con estadísticas de todos los tests
- **Incluye**: Vitest + Playwright + Cobertura en un solo reporte visual
- **Ideal para**: Presentaciones, reportes ejecutivos, documentación

### 2. 🧪 **Reporte Vitest (Tests Unitarios)**
- **Ubicación**: `Front/test-results/vitest-report.html`
- **Descripción**: Detalle de tests unitarios
- **Incluye**: Tests pasados/fallidos por archivo, duración, errores

### 3. 📈 **Reporte de Cobertura**
- **Ubicación**: `Front/coverage/index.html`
- **Descripción**: Cobertura de código línea por línea
- **Incluye**:
  - % Líneas cubiertas
  - % Statements cubiertos
  - % Funciones cubiertas
  - % Branches cubiertos
  - Vista de archivos con líneas no cubiertas resaltadas

### 4. 🎭 **Reporte Playwright (Tests E2E)**
- **Ubicación**: `Front/playwright-report/index.html`
- **Descripción**: Tests end-to-end con capturas y videos
- **Incluye**:
  - Tests por navegador (Chrome, Firefox, Safari)
  - Screenshots de fallos
  - Videos de tests fallidos
  - Traces interactivos

---

## 🎯 Comandos Individuales

Si solo necesitas ejecutar algunos tests específicos:

### Tests Unitarios

```bash
# Ejecutar tests en modo watch (desarrollo)
npm run test:unit

# Ejecutar una vez (CI/CD)
npm run test:unit:run

# Ejecutar con cobertura
npm run test:unit:coverage

# Interfaz visual interactiva
npm run test:unit:ui
```

### Tests E2E

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Interfaz visual interactiva (recomendado para desarrollo)
npm run test:e2e:ui
```

### Solo Generar Reporte Consolidado

```bash
# Genera el reporte consolidado desde los resultados existentes
npm run report:generate
```

---

## 📤 Exportar a PDF

Para generar un PDF del reporte consolidado:

### Opción 1: Desde el Navegador (Recomendado)

1. Abre el reporte consolidado: `Front/test-reports/consolidated-report.html`
2. Presiona `Ctrl+P` (Windows/Linux) o `Cmd+P` (Mac)
3. Selecciona "Guardar como PDF"
4. Ajusta las opciones:
   - ✅ Gráficos de fondo activados
   - ✅ Márgenes mínimos
   - ✅ Escala: 100% o ajustar a página
5. Guarda el PDF

### Opción 2: Usando Herramientas CLI

```bash
# Instalar wkhtmltopdf (una vez)
# Ubuntu/Debian:
sudo apt-get install wkhtmltopdf

# macOS:
brew install wkhtmltopdf

# Windows: Descarga desde https://wkhtmltopdf.org/downloads.html

# Generar PDF
wkhtmltopdf Front/test-reports/consolidated-report.html Front/test-reports/test-report.pdf
```

### Opción 3: Usando Playwright (Automatizado)

```bash
# Crear script para generar PDF automáticamente
npx playwright screenshot --full-page --format pdf Front/test-reports/consolidated-report.html Front/test-reports/test-report.pdf
```

---

## 🎨 Características del Reporte Consolidado

### Información Incluida

- ✅ **Resumen General**
  - Tasa de éxito total
  - Número de tests pasados/fallidos
  - Cobertura promedio
  - Duración total

- ✅ **Tests Unitarios (Vitest)**
  - Total de tests
  - Tests pasados/fallidos/omitidos
  - Duración
  - Barra de progreso visual

- ✅ **Tests E2E (Playwright)**
  - Total de tests por navegador
  - Tests pasados/fallidos/omitidos
  - Duración
  - Barra de progreso visual

- ✅ **Cobertura de Código**
  - Líneas cubiertas
  - Statements cubiertos
  - Funciones cubiertas
  - Branches cubiertos

- ✅ **Enlaces a Reportes Detallados**
  - Acceso rápido a reportes específicos

### Diseño Visual

- 🎨 Diseño moderno y profesional
- 📱 Responsive (se adapta a móvil/tablet/desktop)
- 🖨️ Optimizado para impresión
- 📊 Gráficos y métricas visuales
- 🎯 Color coding (verde=éxito, rojo=fallo, amarillo=advertencia)

---

## 🔍 Interpretación de Resultados

### Tasa de Éxito

| Porcentaje | Estado | Acción |
|------------|--------|--------|
| ≥ 95% | ✅ Excelente | Sistema estable |
| 80-95% | ⚠️ Aceptable | Revisar tests fallidos |
| < 80% | ❌ Crítico | Corregir urgente |

### Cobertura de Código

| Porcentaje | Estado | Meta |
|------------|--------|------|
| ≥ 80% | ✅ Excelente | Mantener |
| 60-80% | ⚠️ Aceptable | Mejorar |
| < 60% | ❌ Insuficiente | Aumentar urgente |

---

## 📂 Estructura de Directorios

```
Front/
├── coverage/                   # Cobertura de código (HTML)
│   └── index.html             # Reporte principal de cobertura
├── test-results/              # Resultados de Vitest
│   ├── vitest-results.json    # Datos JSON
│   └── vitest-report.html     # Reporte HTML
├── playwright-report/         # Reportes de Playwright
│   ├── index.html            # Reporte principal
│   ├── data/                 # Datos de tests
│   └── screenshots/          # Capturas de fallos
├── test-reports/             # Reporte consolidado
│   └── consolidated-report.html  # Reporte unificado
└── scripts/
    └── generate-test-report.js   # Generador de reporte
```

---

## 🛠️ Configuración Avanzada

### Ajustar Umbrales de Cobertura

Edita `Front/vitest.config.ts`:

```typescript
coverage: {
  // Cambiar umbrales mínimos
  lines: 80,       // % mínimo de líneas
  functions: 80,   // % mínimo de funciones
  branches: 80,    // % mínimo de branches
  statements: 80   // % mínimo de statements
}
```

### Excluir Archivos de Cobertura

Edita `Front/vitest.config.ts`:

```typescript
coverage: {
  exclude: [
    'src/**/*.test.ts',          // Archivos de test
    'src/**/__tests__/**',       // Directorios de test
    'src/lib/legacy/**',         // Código legacy
    'node_modules/**'
  ]
}
```

### Cambiar Navegadores de Playwright

Edita `Front/playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },  // Desactivar
  // { name: 'webkit', use: { ...devices['Desktop Safari'] } }     // Desactivar
]
```

---

## 🐛 Solución de Problemas

### Error: "No se encuentran resultados de tests"

**Causa**: No se han ejecutado los tests antes de generar el reporte.

**Solución**:
```bash
# Ejecutar tests primero
npm run test:unit:coverage
npm run test:e2e

# Luego generar reporte
npm run report:generate
```

### Error: "vitest: command not found"

**Causa**: Dependencias no instaladas.

**Solución**:
```bash
npm install
```

### Tests E2E fallan con "ECONNREFUSED"

**Causa**: Servidor de desarrollo no está corriendo.

**Solución**: Playwright inicia automáticamente el servidor. Si falla:
```bash
# Terminal 1: Iniciar servidor manualmente
npm run dev

# Terminal 2: Ejecutar tests
npm run test:e2e
```

### Reporte no se abre en navegador

**Causa**: Archivo HTML no se encuentra.

**Solución**:
```bash
# Verificar que el archivo existe
ls -la Front/test-reports/consolidated-report.html

# Si no existe, regenerar
npm run report:generate

# Abrir manualmente
# Windows:
start Front/test-reports/consolidated-report.html

# macOS:
open Front/test-reports/consolidated-report.html

# Linux:
xdg-open Front/test-reports/consolidated-report.html
```

---

## 📊 Integración con CI/CD

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Instalar dependencias
        run: npm install
        working-directory: ./Front

      - name: Ejecutar tests y generar reportes
        run: npm run test:report
        working-directory: ./Front

      - name: Subir reportes
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-reports
          path: |
            Front/test-reports/
            Front/coverage/
            Front/playwright-report/
          retention-days: 30
```

---

## 📚 Referencias

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [Playwright Reporters](https://playwright.dev/docs/test-reporters)

---

## 🎯 Checklist de Testing

Antes de hacer commit/merge:

- [ ] Ejecutar `npm run test:report`
- [ ] Verificar que la tasa de éxito sea ≥ 80%
- [ ] Revisar cobertura de código ≥ 60%
- [ ] Corregir tests fallidos críticos
- [ ] Generar reporte consolidado
- [ ] Revisar que no hay errores de regresión

---

**¿Necesitas ayuda?** Consulta la documentación completa en `Documentation/GUIA_COMPLETA_TESTS.md`
