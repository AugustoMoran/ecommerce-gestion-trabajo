#!/usr/bin/env node

/**
 * 🚀 SETUP & TEST COMPLETO - GEOLOCALIZACIÓN CABA/AMBA
 * 
 * Este script:
 * 1. Valida que backend/frontend estén corriendo
 * 2. Ejecuta tests integrales
 * 3. Genera reporte de resultados
 * 
 * Uso:
 *   node setup_and_test.js
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, label, msg) {
  console.log(`${color}${label}${colors.reset} ${msg}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${colors.bold}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}${title}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}${'═'.repeat(60)}${colors.reset}\n`);
}

async function checkServer(url, name, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const res = await axios.get(url);
      log(colors.green, '✅', `${name} respondiendo en ${url}`);
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  log(colors.red, '❌', `${name} no responde en ${url}`);
  return false;
}

async function runTests() {
  section('🧪 VALIDANDO SETUP');

  // Check backends
  const backendOk = await checkServer('http://localhost:5000/health', 'Backend');
  const frontendOk = await checkServer('http://localhost:5173', 'Frontend');

  if (!backendOk) {
    log(colors.red, '❌', 'Backend no está corriendo');
    log(colors.yellow, '💡', 'Ejecuta en otra terminal: cd backend && npm run dev');
    process.exit(1);
  }

  section('📋 CONFIGURACIÓN ENCONTRADA');

  // Check env variables
  const envChecks = {
    'GOOGLE_MAPS_API_KEY': process.env.GOOGLE_MAPS_API_KEY ? '✅ Configurado' : '⚠️  No configurado',
    'NODE_ENV': process.env.NODE_ENV || 'development',
    'Frontend URL': 'http://localhost:5173',
    'Backend URL': 'http://localhost:5000',
  };

  for (const [key, value] of Object.entries(envChecks)) {
    console.log(`  ${colors.blue}•${colors.reset} ${key}: ${colors.yellow}${value}${colors.reset}`);
  }

  section('🔬 EJECUTANDO TESTS INTEGRALES');

  log(colors.cyan, '📊', 'Iniciando suite de tests...\n');

  return new Promise((resolve) => {
    const test = spawn('node', ['test_geovalidation_integral.js'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
    });

    test.on('close', (code) => {
      section('📈 RESULTADOS');

      if (code === 0) {
        log(colors.green, '🎉', 'TODOS LOS TESTS PASARON');
        console.log();
        log(colors.green, '✅', 'Sistema de geolocalización está 100% funcional');
        console.log();
        
        section('📝 PRÓXIMOS PASOS');
        console.log(`
${colors.green}1. Integrar LocationValidator en tu checkout${colors.reset}
   ${colors.yellow}import LocationValidator from './components/location/LocationValidator';${colors.reset}

${colors.green}2. Mostrar InstallationZonesDisplay en tu página${colors.reset}
   ${colors.yellow}import InstallationZonesDisplay from './components/location/InstallationZonesDisplay';${colors.reset}

${colors.green}3. Validar órdenes tienen campos geo${colors.reset}
   ${colors.yellow}order.esEnAMBA, order.coordenadas, order.partido${colors.reset}

${colors.green}4. Admin dashboard - mostrar mapa de zonas${colors.reset}
   ${colors.yellow}// Implementar visualización en MapBox o Google Maps${colors.reset}

${colors.green}5. Ir a producción${colors.reset}
   ${colors.yellow}npm run build && npm run deploy${colors.reset}
        `);

        log(colors.cyan, '📚', 'Documentación disponible en:');
        console.log(`  • GEOVALIDATION_GUIDE.md - Guía completa`);
        console.log(`  • TESTS_GUIDE.md - Cómo ejecutar tests`);
        console.log(`  • CheckoutExample.jsx - Ejemplo de implementación`);

        resolve(true);
      } else {
        log(colors.red, '❌', `Tests fallaron con código ${code}`);
        resolve(false);
      }
    });
  });
}

// Main
(async () => {
  try {
    section('🚀 SETUP & TEST GEOLOCALIZACIÓN CABA/AMBA');

    const success = await runTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(colors.red, '🔴', `Error: ${error.message}`);
    process.exit(1);
  }
})();
