/**
 * 🧪 TEST EXPANDIDO - 14 LOCALIDADES (8 anteriores + 6 nuevas)
 * Validación definitiva del sistema de instalación por geolocalización
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Localidades de prueba: 7 DENTRO + 7 FUERA
const TEST_LOCATIONS = {
  DENTRO: [
    { nombre: 'Morón', direccion: 'Morón, Buenos Aires', zona: 'AMBA' },
    { nombre: 'San Isidro', direccion: 'San Isidro, Buenos Aires', zona: 'AMBA' },
    { nombre: 'Avellaneda', direccion: 'Avellaneda, Buenos Aires', zona: 'AMBA' },
    { nombre: 'Flores', direccion: 'Flores, Ciudad de Buenos Aires', zona: 'CABA' },
    { nombre: 'Hurlingham', direccion: 'Hurlingham, Buenos Aires', zona: 'AMBA' },
    { nombre: 'La Matanza', direccion: 'La Matanza, Buenos Aires', zona: 'AMBA' },
    { nombre: 'San Martín', direccion: 'San Martín, Buenos Aires', zona: 'AMBA' },
  ],
  FUERA: [
    { nombre: 'La Plata', direccion: 'La Plata, Buenos Aires', zona: 'Exterior' },
    { nombre: 'Mar del Plata', direccion: 'Mar del Plata, Buenos Aires', zona: 'Exterior' },
    { nombre: 'Córdoba', direccion: 'Córdoba, Córdoba', zona: 'Exterior' },
    { nombre: 'Mendoza', direccion: 'Mendoza, Mendoza', zona: 'Exterior' },
    { nombre: 'Bahía Blanca', direccion: 'Bahía Blanca, Buenos Aires', zona: 'Exterior' },
    { nombre: 'Neuquén', direccion: 'Neuquén, Neuquén', zona: 'Exterior' },
    { nombre: 'Ushuaia', direccion: 'Ushuaia, Tierra del Fuego', zona: 'Exterior' },
  ]
};

async function runTests() {
  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log('🧪 TEST EXPANDIDO - VALIDACIÓN DEFINITIVA DEL SISTEMA DE INSTALACIÓN');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  // Verificar que backend esté corriendo
  try {
    await axios.get(`${BASE_URL}/../health`);
  } catch (error) {
    console.error('❌ Backend no está corriendo en puerto 5000');
    console.error('   Ejecuta: cd backend && npm run dev');
    process.exit(1);
  }

  let totalTests = 0;
  let passedTests = 0;
  const results = {
    DENTRO: { passed: 0, failed: 0, details: [] },
    FUERA: { passed: 0, failed: 0, details: [] }
  };

  // Test DENTRO de AMBA/CABA
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('✨ TEST 1: LOCALIDADES DENTRO DE AMBA/CABA (7 ubicaciones)');
  console.log('   Deberían mostrar opción de instalación disponible\n');

  for (let i = 0; i < TEST_LOCATIONS.DENTRO.length; i++) {
    const loc = TEST_LOCATIONS.DENTRO[i];
    totalTests++;
    
    try {
      const response = await axios.post(`${BASE_URL}/location/validate`, {
        direccion: loc.direccion
      });

      const data = response.data;
      const esperado = data.esEnAMBA === true;

      if (esperado) {
        passedTests++;
        results.DENTRO.passed++;
        console.log(`✅ [${i + 1}/7] ${loc.nombre}`);
        console.log(`   📍 Zona: ${data.caba ? 'CABA' : 'AMBA'}`);
        console.log(`   ✨ Instalación: DISPONIBLE (SÍ mostrar)`);
      } else {
        results.DENTRO.failed++;
        console.log(`❌ [${i + 1}/7] ${loc.nombre}`);
        console.log(`   ❌ ERROR: Debería estar en AMBA pero esEnAMBA=${data.esEnAMBA}`);
      }
      
      results.DENTRO.details.push({
        nombre: loc.nombre,
        resultado: esperado ? '✅ PASS' : '❌ FAIL',
        zona: data.caba ? 'CABA' : data.esEnAMBA ? 'AMBA' : 'FUERA'
      });

    } catch (error) {
      results.DENTRO.failed++;
      console.log(`❌ [${i + 1}/7] ${loc.nombre}`);
      console.log(`   ❌ Error: ${error.message}`);
      results.DENTRO.details.push({
        nombre: loc.nombre,
        resultado: '❌ ERROR',
        error: error.message
      });
    }
    console.log();
  }

  // Test FUERA de AMBA/CABA
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('⚠️  TEST 2: LOCALIDADES FUERA DE AMBA/CABA (7 ubicaciones)');
  console.log('   NO deberían mostrar opción de instalación\n');

  for (let i = 0; i < TEST_LOCATIONS.FUERA.length; i++) {
    const loc = TEST_LOCATIONS.FUERA[i];
    totalTests++;
    
    try {
      const response = await axios.post(`${BASE_URL}/location/validate`, {
        direccion: loc.direccion
      });

      const data = response.data;
      const esperado = data.esEnAMBA === false;

      if (esperado) {
        passedTests++;
        results.FUERA.passed++;
        console.log(`✅ [${i + 1}/7] ${loc.nombre}`);
        console.log(`   📍 Zona: ${data.provincia || 'Exterior'}`);
        console.log(`   ⚠️  Instalación: NO disponible (NO mostrar)`);
      } else {
        results.FUERA.failed++;
        console.log(`❌ [${i + 1}/7] ${loc.nombre}`);
        console.log(`   ❌ ERROR: No debería estar en AMBA pero esEnAMBA=${data.esEnAMBA}`);
      }

      results.FUERA.details.push({
        nombre: loc.nombre,
        resultado: esperado ? '✅ PASS' : '❌ FAIL',
        zona: data.provincia || 'Desconocida'
      });

    } catch (error) {
      results.FUERA.failed++;
      console.log(`❌ [${i + 1}/7] ${loc.nombre}`);
      console.log(`   ❌ Error: ${error.message}`);
      results.FUERA.details.push({
        nombre: loc.nombre,
        resultado: '❌ ERROR',
        error: error.message
      });
    }
    console.log();
  }

  // Resumen
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE TESTS');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  console.log('✅ DENTRO DE AMBA/CABA:');
  console.log(`   Pasados: ${results.DENTRO.passed}/7`);
  console.log(`   Fallidos: ${results.DENTRO.failed}/7`);
  console.log();

  console.log('❌ FUERA DE AMBA/CABA:');
  console.log(`   Pasados: ${results.FUERA.passed}/7`);
  console.log(`   Fallidos: ${results.FUERA.failed}/7`);
  console.log();

  console.log('📈 TOTAL:');
  console.log(`   Pasados: ${passedTests}/${totalTests}`);
  console.log(`   Fallidos: ${totalTests - passedTests}/${totalTests}`);
  console.log();

  if (passedTests === totalTests) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('✨ Sistema de instalación por ubicación está funcionando correctamente\n');
    return true;
  } else {
    console.log(`⚠️  ${totalTests - passedTests} TESTS FALLARON\n`);
    return false;
  }
}

// Ejecutar tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
  });
