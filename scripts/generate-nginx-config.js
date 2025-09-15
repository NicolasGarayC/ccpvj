#!/usr/bin/env node
/**
 * Script para generar la configuración de nginx usando variables de entorno
 * Uso: node scripts/generate-nginx-config.js [PROJECT_ROOT]
 *
 * Ejemplos:
 * - Windows: node scripts/generate-nginx-config.js "D:"
 * - Linux: node scripts/generate-nginx-config.js "/var/www"
 * - macOS: node scripts/generate-nginx-config.js "/Users/username"
 */

const fs = require('fs');
const path = require('path');

// Obtener PROJECT_ROOT desde argumentos o variable de entorno
const projectRoot = process.argv[2] || process.env.PROJECT_ROOT || 'D:';

// Rutas de los archivos
const templatePath = path.join(__dirname, '..', 'Infraestructure', 'nginx', 'sites-available', 'centro-cultural-dev.conf.template');
const outputPath = path.join(__dirname, '..', 'Infraestructure', 'nginx', 'sites-available', 'centro-cultural-dev.conf');

try {
    // Leer el template
    const template = fs.readFileSync(templatePath, 'utf-8');

    // Reemplazar variables
    const config = template.replace(/\$\{PROJECT_ROOT\}/g, projectRoot);

    // Escribir el archivo de configuración
    fs.writeFileSync(outputPath, config, 'utf-8');

    console.log(`✅ Configuración nginx generada exitosamente:`);
    console.log(`   Template: ${templatePath}`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   PROJECT_ROOT: ${projectRoot}`);
    console.log('');
    console.log('🔧 Para aplicar la configuración:');
    console.log('   1. Copia el archivo generado a tu configuración de nginx');
    console.log('   2. Reinicia nginx');

} catch (error) {
    console.error('❌ Error generando configuración nginx:', error.message);
    process.exit(1);
}