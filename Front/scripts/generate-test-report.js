#!/usr/bin/env node

/**
 * Script para generar reporte consolidado de pruebas
 * Combina resultados de Vitest y Playwright en un reporte HTML unificado
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colores para consola
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function readJsonFile(path) {
	try {
		if (!existsSync(path)) {
			log(`⚠️  Archivo no encontrado: ${path}`, 'yellow');
			return null;
		}
		return JSON.parse(readFileSync(path, 'utf8'));
	} catch (error) {
		log(`❌ Error leyendo ${path}: ${error.message}`, 'red');
		return null;
	}
}

function generateConsolidatedReport() {
	log('\n🔍 Generando reporte consolidado de pruebas...', 'cyan');

	// Leer resultados de Vitest
	const vitestResults = readJsonFile(join(rootDir, 'test-results', 'vitest-results.json'));

	// Leer resultados de Playwright
	const playwrightResults = readJsonFile(
		join(rootDir, 'test-results', 'results.json')
	);

	// Leer cobertura de Vitest
	const coverageResults = readJsonFile(join(rootDir, 'coverage', 'coverage-summary.json'));

	// Calcular estadísticas
	const stats = calculateStats(vitestResults, playwrightResults, coverageResults);

	// Generar HTML
	const html = generateHTML(stats, vitestResults, playwrightResults, coverageResults);

	// Guardar reporte
	const outputDir = join(rootDir, 'test-reports');
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	const outputPath = join(outputDir, 'consolidated-report.html');
	writeFileSync(outputPath, html, 'utf8');

	log('\n✅ Reporte consolidado generado exitosamente!', 'green');
	log(`📄 Ubicación: ${outputPath}`, 'cyan');

	// Mostrar estadísticas
	displayStats(stats);

	return outputPath;
}

function calculateStats(vitestResults, playwrightResults, coverageResults) {
	const stats = {
		vitest: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
		playwright: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
		coverage: { lines: 0, statements: 0, functions: 0, branches: 0 },
		timestamp: new Date().toISOString()
	};

	// Procesar Vitest
	if (vitestResults) {
		stats.vitest.total = vitestResults.numTotalTests || 0;
		stats.vitest.passed = vitestResults.numPassedTests || 0;
		stats.vitest.failed = vitestResults.numFailedTests || 0;
		stats.vitest.skipped = vitestResults.numPendingTests || 0;
		stats.vitest.duration = vitestResults.testResults?.reduce(
			(sum, result) => sum + (result.perfStats?.runtime || 0),
			0
		) || 0;
	}

	// Procesar Playwright
	if (playwrightResults?.suites) {
		const countTests = (suite) => {
			let count = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
			if (suite.specs) {
				suite.specs.forEach((spec) => {
					count.total++;
					const result = spec.tests?.[0]?.results?.[0];
					if (result) {
						count.duration += result.duration || 0;
						if (result.status === 'passed') count.passed++;
						else if (result.status === 'failed') count.failed++;
						else if (result.status === 'skipped') count.skipped++;
					}
				});
			}
			if (suite.suites) {
				suite.suites.forEach((s) => {
					const subCount = countTests(s);
					count.total += subCount.total;
					count.passed += subCount.passed;
					count.failed += subCount.failed;
					count.skipped += subCount.skipped;
					count.duration += subCount.duration;
				});
			}
			return count;
		};

		playwrightResults.suites.forEach((suite) => {
			const count = countTests(suite);
			stats.playwright.total += count.total;
			stats.playwright.passed += count.passed;
			stats.playwright.failed += count.failed;
			stats.playwright.skipped += count.skipped;
			stats.playwright.duration += count.duration;
		});
	}

	// Procesar cobertura
	if (coverageResults?.total) {
		stats.coverage.lines = coverageResults.total.lines?.pct || 0;
		stats.coverage.statements = coverageResults.total.statements?.pct || 0;
		stats.coverage.functions = coverageResults.total.functions?.pct || 0;
		stats.coverage.branches = coverageResults.total.branches?.pct || 0;
	}

	return stats;
}

function displayStats(stats) {
	log('\n📊 Estadísticas de Pruebas:', 'blue');
	log('─'.repeat(60), 'blue');

	// Vitest (Unit Tests)
	log('\n🧪 Tests Unitarios (Vitest):', 'cyan');
	log(`  Total:    ${stats.vitest.total}`);
	log(`  ✅ Pasados: ${stats.vitest.passed}`, 'green');
	log(`  ❌ Fallidos: ${stats.vitest.failed}`, stats.vitest.failed > 0 ? 'red' : 'reset');
	log(`  ⏭️  Omitidos: ${stats.vitest.skipped}`, 'yellow');
	log(`  ⏱️  Duración: ${(stats.vitest.duration / 1000).toFixed(2)}s`);

	// Playwright (E2E Tests)
	log('\n🎭 Tests E2E (Playwright):', 'cyan');
	log(`  Total:    ${stats.playwright.total}`);
	log(`  ✅ Pasados: ${stats.playwright.passed}`, 'green');
	log(`  ❌ Fallidos: ${stats.playwright.failed}`, stats.playwright.failed > 0 ? 'red' : 'reset');
	log(`  ⏭️  Omitidos: ${stats.playwright.skipped}`, 'yellow');
	log(`  ⏱️  Duración: ${(stats.playwright.duration / 1000).toFixed(2)}s`);

	// Cobertura
	log('\n📈 Cobertura de Código:', 'cyan');
	log(`  Líneas:      ${stats.coverage.lines.toFixed(2)}%`);
	log(`  Statements:  ${stats.coverage.statements.toFixed(2)}%`);
	log(`  Funciones:   ${stats.coverage.functions.toFixed(2)}%`);
	log(`  Branches:    ${stats.coverage.branches.toFixed(2)}%`);

	// Total
	const totalTests = stats.vitest.total + stats.playwright.total;
	const totalPassed = stats.vitest.passed + stats.playwright.passed;
	const totalFailed = stats.vitest.failed + stats.playwright.failed;
	const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0;

	log('\n📊 Total General:', 'blue');
	log(`  Tests:       ${totalTests}`);
	log(`  Éxito:       ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
	log(`  ✅ Pasados:   ${totalPassed}`, 'green');
	log(`  ❌ Fallidos:  ${totalFailed}`, totalFailed > 0 ? 'red' : 'reset');
	log('─'.repeat(60), 'blue');
	log('');
}

function generateHTML(stats, vitestResults, playwrightResults, coverageResults) {
	const totalTests = stats.vitest.total + stats.playwright.total;
	const totalPassed = stats.vitest.passed + stats.playwright.passed;
	const totalFailed = stats.vitest.failed + stats.playwright.failed;
	const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0;

	return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Pruebas - Centro Cultural Víctor Jara</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .timestamp {
            margin-top: 1rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        .content {
            padding: 2rem;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        .card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 1.5rem;
            border-left: 4px solid;
            transition: transform 0.2s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .card.success { border-color: #10b981; }
        .card.danger { border-color: #ef4444; }
        .card.warning { border-color: #f59e0b; }
        .card.info { border-color: #3b82f6; }
        .card h3 {
            font-size: 0.875rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
        }
        .card .value {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
        }
        .card .subvalue {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.25rem;
        }
        .section {
            margin-bottom: 3rem;
        }
        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .section-title::before {
            content: '';
            width: 4px;
            height: 1.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }
        .stat-item {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .stat-label {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .stat-value {
            font-weight: 600;
            font-size: 1.25rem;
            color: #1f2937;
        }
        .progress-bar {
            width: 100%;
            height: 12px;
            background: #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 0.3s ease;
        }
        .progress-fill.warning { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); }
        .progress-fill.danger { background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%); }
        .footer {
            background: #f8f9fa;
            padding: 2rem;
            text-align: center;
            color: #6b7280;
            font-size: 0.875rem;
        }
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge.success { background: #d1fae5; color: #065f46; }
        .badge.danger { background: #fee2e2; color: #991b1b; }
        .badge.warning { background: #fef3c7; color: #92400e; }
        .links {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            flex-wrap: wrap;
        }
        .link-button {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            transition: transform 0.2s;
        }
        .link-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        @media print {
            body { padding: 0; background: white; }
            .container { box-shadow: none; }
            .link-button { display: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Reporte de Pruebas</h1>
            <p>Centro Cultural Víctor Jara - Frontend</p>
            <div class="timestamp">
                Generado: ${new Date(stats.timestamp).toLocaleString('es-ES', {
									dateStyle: 'full',
									timeStyle: 'medium'
								})}
            </div>
        </div>

        <div class="content">
            <!-- Resumen General -->
            <div class="summary">
                <div class="card ${totalFailed === 0 ? 'success' : 'warning'}">
                    <h3>Tasa de Éxito</h3>
                    <div class="value">${successRate}%</div>
                    <div class="subvalue">${totalPassed} de ${totalTests} tests</div>
                </div>
                <div class="card info">
                    <h3>Total Tests</h3>
                    <div class="value">${totalTests}</div>
                    <div class="subvalue">
                        <span class="badge success">✓ ${totalPassed}</span>
                        ${totalFailed > 0 ? `<span class="badge danger">✗ ${totalFailed}</span>` : ''}
                    </div>
                </div>
                <div class="card ${stats.coverage.lines >= 80 ? 'success' : 'warning'}">
                    <h3>Cobertura</h3>
                    <div class="value">${stats.coverage.lines.toFixed(1)}%</div>
                    <div class="subvalue">Líneas de código</div>
                </div>
                <div class="card info">
                    <h3>Duración Total</h3>
                    <div class="value">${((stats.vitest.duration + stats.playwright.duration) / 1000).toFixed(1)}s</div>
                    <div class="subvalue">Tiempo de ejecución</div>
                </div>
            </div>

            <!-- Tests Unitarios (Vitest) -->
            <div class="section">
                <div class="section-title">🧪 Tests Unitarios (Vitest)</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Total</span>
                        <span class="stat-value">${stats.vitest.total}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">✅ Pasados</span>
                        <span class="stat-value" style="color: #10b981;">${stats.vitest.passed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">❌ Fallidos</span>
                        <span class="stat-value" style="color: #ef4444;">${stats.vitest.failed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⏭️ Omitidos</span>
                        <span class="stat-value" style="color: #f59e0b;">${stats.vitest.skipped}</span>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <div class="stat-label">Progreso</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${stats.vitest.failed > 0 ? 'warning' : ''}"
                             style="width: ${stats.vitest.total > 0 ? (stats.vitest.passed / stats.vitest.total) * 100 : 0}%">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tests E2E (Playwright) -->
            <div class="section">
                <div class="section-title">🎭 Tests E2E (Playwright)</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Total</span>
                        <span class="stat-value">${stats.playwright.total}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">✅ Pasados</span>
                        <span class="stat-value" style="color: #10b981;">${stats.playwright.passed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">❌ Fallidos</span>
                        <span class="stat-value" style="color: #ef4444;">${stats.playwright.failed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⏭️ Omitidos</span>
                        <span class="stat-value" style="color: #f59e0b;">${stats.playwright.skipped}</span>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <div class="stat-label">Progreso</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${stats.playwright.failed > 0 ? 'warning' : ''}"
                             style="width: ${stats.playwright.total > 0 ? (stats.playwright.passed / stats.playwright.total) * 100 : 0}%">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cobertura de Código -->
            <div class="section">
                <div class="section-title">📈 Cobertura de Código</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Líneas</span>
                        <span class="stat-value">${stats.coverage.lines.toFixed(2)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Statements</span>
                        <span class="stat-value">${stats.coverage.statements.toFixed(2)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Funciones</span>
                        <span class="stat-value">${stats.coverage.functions.toFixed(2)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Branches</span>
                        <span class="stat-value">${stats.coverage.branches.toFixed(2)}%</span>
                    </div>
                </div>
            </div>

            <!-- Enlaces a Reportes Detallados -->
            <div class="section">
                <div class="section-title">🔗 Reportes Detallados</div>
                <div class="links">
                    <a href="../test-results/vitest-report.html" class="link-button">📊 Vitest HTML</a>
                    <a href="../coverage/index.html" class="link-button">📈 Cobertura Detallada</a>
                    <a href="../playwright-report/index.html" class="link-button">🎭 Playwright HTML</a>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Centro Cultural Víctor Jara</strong> - Sistema de Gestión Educativa</p>
            <p style="margin-top: 0.5rem;">Reporte generado automáticamente por el sistema de CI/CD</p>
        </div>
    </div>
</body>
</html>`;
}

// Ejecutar
try {
	const reportPath = generateConsolidatedReport();
	log(`\n💡 Tip: Abre el reporte en tu navegador para ver el informe completo.`, 'cyan');
	log(`💡 Puedes imprimir el reporte como PDF desde tu navegador (Ctrl+P / Cmd+P)`, 'cyan');
} catch (error) {
	log(`\n❌ Error generando reporte: ${error.message}`, 'red');
	console.error(error);
	process.exit(1);
}
