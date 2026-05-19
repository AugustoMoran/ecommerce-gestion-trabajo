#!/usr/bin/env node

/**
 * 🧪 TEST MANUAL - VALIDAR INSTALACIÓN POR UBICACIÓN
 * 
 * Este script:
 * 1. Valida direcciones dentro de AMBA/CABA
 * 2. Valida direcciones fuera de AMBA/CABA
 * 3. Verifica que la opción de instalación aparezca/desaparezca
 * 
 * Para ejecutar:
 *   node backend/test_installation_by_location.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

function log(color, label, msg) {
  console.log(`${colors[color]}${colors.bold}${label}${colors.reset} ${msg}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${colors.bold}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}${title}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}${'═'.repeat(70)}${colors.reset}\n`);
}

// Datos de prueba
const TEST_DATA = {
  dentro: [
    { direccion: 'Morón, Buenos Aires', esperado: true, zona: 'AMBA', partido: 'Morón' },
    { direccion: 'San Isidro, Buenos Aires', esperado: true, zona: 'AMBA', partido: 'San Isidro' },
    { direccion: 'Avellaneda, Buenos Aires', esperado: true, zona: 'AMBA', partido: 'Avellaneda' },
    { direccion: 'Flores, Ciudad de Buenos Aires', esperado: true, zona: 'CABA', caba: true },
  ],
  fuera: [
    { direccion: 'La Plata, Buenos Aires', esperado: false, zona: 'NO CABA/AMBA' },
    { direccion: 'Mar del Plata, Buenos Aires', esperado: false, zona: 'NO CABA/AMBA' },
    { direccion: 'Córdoba, Córdoba', esperado: false, zona: 'NO CABA/AMBA' },
    { direccion: 'Mendoza, Mendoza', esperado: false, zona: 'NO CABA/AMBA' },
  ],
};

async function testLocationValidation() {
  try {
    // Verificar que backend está corriendo
    section('🔌 VERIFICANDO BACKEND');
    
    try {
      const health = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
      log('green', '✅', `Backend respondiendo en ${BACKEND_URL}`);
    } catch {
      log('red', '❌', `Backend no responde en ${BACKEND_URL}`);
      log('yellow', '💡', 'Asegúrate de ejecutar: cd backend && npm run dev');
      process.exit(1);
    }

    // TEST 1: Direcciones DENTRO de AMBA/CABA
    section('✅ TEST 1: DIRECCIONES DENTRO DE AMBA/CABA');
    section('Deberían mostrar opción de instalación ✨');
    
    let testsDentro = { pasados: 0, fallidos: 0 };
    
    for (let i = 0; i < TEST_DATA.dentro.length; i++) {
      const test = TEST_DATA.dentro[i];
      
      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/location/validate`,
          { direccion: test.direccion },
          { timeout: 10000 }
        );

        const { esEnAMBA, caba, partido, coordenadas } = response.data;
        const debeInstalar = esEnAMBA === true || caba === true;

        if (debeInstalar === test.esperado) {
          log('green', `✅ [${i + 1}/4]`, `${test.direccion}`);
          log('blue', '      ', `Ubicación: ${test.zona}`);
          if (partido) log('blue', '      ', `Partido: ${partido}`);
          if (coordenadas) log('blue', '      ', `Coordenadas: ${coordenadas.lat.toFixed(4)}, ${coordenadas.lng.toFixed(4)}`);
          log('green', '      ', '✨ Instalación: DISPONIBLE (SÍ mostrar)');
          testsDentro.pasados++;
        } else {
          log('red', `❌ [${i + 1}/4]`, `${test.direccion}`);
          log('red', '      ', `Esperaba: ${test.esperado}, Recibió: ${debeInstalar}`);
          testsDentro.fallidos++;
        }
      } catch (error) {
        log('red', `❌ [${i + 1}/4]`, `${test.direccion}`);
        log('red', '      ', `Error: ${error.message}`);
        testsDentro.fallidos++;
      }
      
      if (i < TEST_DATA.dentro.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // TEST 2: Direcciones FUERA de AMBA/CABA
    section('❌ TEST 2: DIRECCIONES FUERA DE AMBA/CABA');
    section('NO deberían mostrar opción de instalación ⚠️');
    
    let testsFuera = { pasados: 0, fallidos: 0 };
    
    for (let i = 0; i < TEST_DATA.fuera.length; i++) {
      const test = TEST_DATA.fuera[i];
      
      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/location/validate`,
          { direccion: test.direccion },
          { timeout: 10000 }
        );

        const { esEnAMBA, caba } = response.data;
        const debeInstalar = esEnAMBA === true || caba === true;

        if (debeInstalar === test.esperado) {
          log('green', `✅ [${i + 1}/4]`, `${test.direccion}`);
          log('blue', '      ', `Ubicación: ${test.zona}`);
          log('red', '      ', '⚠️  Instalación: NO disponible (NO mostrar)');
          testsFuera.pasados++;
        } else {
          log('red', `❌ [${i + 1}/4]`, `${test.direccion}`);
          log('red', '      ', `Esperaba: ${test.esperado}, Recibió: ${debeInstalar}`);
          testsFuera.fallidos++;
        }
      } catch (error) {
        log('red', `❌ [${i + 1}/4]`, `${test.direccion}`);
        log('red', '      ', `Error: ${error.message}`);
        testsFuera.fallidos++;
      }
      
      if (i < TEST_DATA.fuera.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // RESUMEN
    section('📊 RESUMEN DE TESTS');
    
    const totalPasados = testsDentro.pasados + testsFuera.pasados;
    const totalFallidos = testsDentro.fallidos + testsFuera.fallidos;
    const total = totalPasados + totalFallidos;

    console.log(`${colors.green}${colors.bold}✅ DENTRO DE AMBA/CABA:${colors.reset}`);
    console.log(`   Pasados: ${testsDentro.pasados}/4`);
    console.log(`   Fallidos: ${testsDentro.fallidos}/4\n`);

    console.log(`${colors.red}${colors.bold}❌ FUERA DE AMBA/CABA:${colors.reset}`);
    console.log(`   Pasados: ${testsFuera.pasados}/4`);
    console.log(`   Fallidos: ${testsFuera.fallidos}/4\n`);

    console.log(`${colors.cyan}${colors.bold}📈 TOTAL:${colors.reset}`);
    console.log(`   Pasados: ${totalPasados}/${total}`);
    console.log(`   Fallidos: ${totalFallidos}/${total}\n`);

    // Resultado final
    if (totalFallidos === 0) {
      log('green', '🎉', 'TODOS LOS TESTS PASARON');
      log('green', '✨', 'Sistema de instalación por ubicación está funcionando correctamente');
      
      section('✅ VALIDACIÓN COMPLETADA');
      console.log(`
${colors.green}DENTRO DE AMBA/CABA:${colors.reset}
  ✓ Morón → ✨ Instalación disponible
  ✓ San Isidro → ✨ Instalación disponible
  ✓ Avellaneda → ✨ Instalación disponible
  ✓ Flores (CABA) → ✨ Instalación disponible

${colors.red}FUERA DE AMBA/CABA:${colors.reset}
  ✗ La Plata → ⚠️  Instalación NO disponible
  ✗ Mar del Plata → ⚠️  Instalación NO disponible
  ✗ Córdoba → ⚠️  Instalación NO disponible
  ✗ Mendoza → ⚠️  Instalación NO disponible

${colors.green}📝 PRÓXIMOS PASOS:${colors.reset}
  1. Ejecutar seed con usuarios de prueba:
     node backend/seeds/seed_test_addresses.js
     
  2. Test manual en browser:
     • Ir a http://localhost:5173/checkout
     • Login con usuarios de prueba
     • Verificar que opción de instalación aparezca/desaparezca
     
  3. Ejecutar tests de React:
     npm run test -- test_installation_display.test.js
      `);
      
      process.exit(0);
    } else {
      log('red', '❌', `${totalFallidos} tests fallaron`);
      process.exit(1);
    }

  } catch (error) {
    log('red', '🔴', `Error general: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar
testLocationValidation();
