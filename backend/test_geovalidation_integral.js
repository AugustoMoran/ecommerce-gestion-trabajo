#!/usr/bin/env node

/**
 * 🧪 TESTS INTEGRALES - GEOLOCALIZACIÓN CABA/AMBA
 * 
 * Prueba:
 * 1. Validación de ubicaciones
 * 2. Creación de órdenes con geolocalización
 * 3. Almacenamiento correcto en BD
 * 4. Respuestas correctas de API
 */

const axios = require('axios');
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const API_BASE = 'http://localhost:5000';
let testsPassed = 0;
let testsFailed = 0;

function log(color, label, message) {
  console.log(`${color}${label}${colors.reset} ${message}`);
}

function pass(test) {
  testsPassed++;
  log(colors.green, '✅', test);
}

function fail(test, error) {
  testsFailed++;
  log(colors.red, '❌', test);
  console.error(`   Error: ${error.message || error}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${'─'.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}\n`);
}

async function test(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (error) {
    fail(name, error);
  }
}

async function runTests() {
  try {
    log(colors.cyan, '╔════════════════════════════════════════════════════╗', '');
    log(colors.cyan, '║', '  🧪 TESTS INTEGRALES - GEOLOCALIZACIÓN CABA/AMBA');
    log(colors.cyan, '╚════════════════════════════════════════════════════╝', '');

    // ────────────────────────────────────────────────────────
    // TEST 1: API de validación
    // ────────────────────────────────────────────────────────
    section('TEST 1: API /location/validate');

    await test('GET /health (server running)', async () => {
      const res = await axios.get(`${API_BASE}/health`);
      if (res.status !== 200) throw new Error('Server not responding');
    });

    // Caso 1: Morón (en AMBA)
    await test('Validar Morón → esEnAMBA: true', async () => {
      const res = await axios.post(`${API_BASE}/api/location/validate`, {
        direccion: 'Morón, Buenos Aires',
      });
      if (!res.data.esEnAMBA) throw new Error('Debería estar en AMBA');
      if (res.data.partido !== 'Morón') throw new Error('Partido incorrecto');
    });

    // Caso 2: San Isidro (en AMBA)
    await test('Validar San Isidro → esEnAMBA: true', async () => {
      const res = await axios.post(`${API_BASE}/api/location/validate`, {
        direccion: 'San Isidro, Buenos Aires',
      });
      if (!res.data.esEnAMBA) throw new Error('Debería estar en AMBA');
    });

    // Caso 3: CABA
    await test('Validar CABA → caba: true', async () => {
      const res = await axios.post(`${API_BASE}/api/location/validate`, {
        direccion: 'Buenos Aires, CABA',
      });
      if (!res.data.caba) throw new Error('Debería estar en CABA');
    });

    // Caso 4: La Plata (fuera AMBA)
    await test('Validar La Plata → esEnAMBA: false', async () => {
      const res = await axios.post(`${API_BASE}/api/location/validate`, {
        direccion: 'La Plata, Buenos Aires',
      });
      if (res.data.esEnAMBA) throw new Error('No debería estar en AMBA');
    });

    // Caso 5: Mar del Plata (fuera AMBA)
    await test('Validar Mar del Plata → esEnAMBA: false', async () => {
      const res = await axios.post(`${API_BASE}/api/location/validate`, {
        direccion: 'Mar del Plata, Buenos Aires',
      });
      if (res.data.esEnAMBA) throw new Error('No debería estar en AMBA');
    });

    // ────────────────────────────────────────────────────────
    // TEST 2: API de disponibilidad de instalación
    // ────────────────────────────────────────────────────────
    section('TEST 2: API /location/check-installation-available');

    await test('Verificar disponibilidad en Morón', async () => {
      const res = await axios.get(`${API_BASE}/api/location/check-installation-available`, {
        params: { direccion: 'Morón, Buenos Aires' },
      });
      if (!res.data.disponible) throw new Error('Debería estar disponible');
      if (!res.data.razon.includes('disponible')) throw new Error('Razón incompleta');
    });

    await test('Verificar NO disponibilidad en La Plata', async () => {
      const res = await axios.get(`${API_BASE}/api/location/check-installation-available`, {
        params: { direccion: 'La Plata, Buenos Aires' },
      });
      if (res.data.disponible) throw new Error('No debería estar disponible');
      if (!res.data.razon.includes('CABA')) throw new Error('Razón incompleta');
    });

    // ────────────────────────────────────────────────────────
    // TEST 3: Creación de órdenes con geolocalización
    // ────────────────────────────────────────────────────────
    section('TEST 3: Creación de órdenes con geolocalización');

    let orderIdMoron = null;
    let orderIdLaPlata = null;

    await test('Crear orden en Morón → esEnAMBA guardado', async () => {
      const res = await axios.post(`${API_BASE}/api/orders`, {
        guestData: {
          nombre: 'Test',
          apellido: 'Moron',
          email: 'test-moron@test.com',
          telefono: '1234567890',
          direccion: 'Morón, Buenos Aires',
        },
        items: [
          {
            producto: '507f1f77bcf86cd799439001',
            cantidad: 1,
          },
        ],
        metodoPago: 'whatsapp',
      }).catch(err => {
        if (err.response?.status === 400) {
          // Producto no existe, pero orden debería crearse igual
          return err.response;
        }
        throw err;
      });

      if (!res.data.order) throw new Error('Orden no creada');
      if (res.data.order.esEnAMBA !== true) throw new Error('esEnAMBA debería ser true');
      if (res.data.order.partido !== 'Morón') throw new Error('Partido incorrecto');
      
      orderIdMoron = res.data.order._id;
    });

    await test('Crear orden en La Plata → esEnAMBA guardado', async () => {
      const res = await axios.post(`${API_BASE}/api/orders`, {
        guestData: {
          nombre: 'Test',
          apellido: 'LaPlata',
          email: 'test-laplata@test.com',
          telefono: '1234567890',
          direccion: 'La Plata, Buenos Aires',
        },
        items: [
          {
            producto: '507f1f77bcf86cd799439001',
            cantidad: 1,
          },
        ],
        metodoPago: 'whatsapp',
      }).catch(err => {
        if (err.response?.status === 400) {
          return err.response;
        }
        throw err;
      });

      if (!res.data.order) throw new Error('Orden no creada');
      if (res.data.order.esEnAMBA !== false) throw new Error('esEnAMBA debería ser false');
      
      orderIdLaPlata = res.data.order._id;
    });

    // ────────────────────────────────────────────────────────
    // TEST 4: Consulta de órdenes por código
    // ────────────────────────────────────────────────────────
    section('TEST 4: Consulta de órdenes con geolocalización');

    await test('Obtener orden Morón y verificar campos geo', async () => {
      if (!orderIdMoron) throw new Error('Orden no fue creada');
      
      const res = await axios.get(`${API_BASE}/api/orders`);
      const order = res.data.orders?.find(o => o._id === orderIdMoron);
      
      if (!order) throw new Error('Orden no encontrada');
      if (order.esEnAMBA !== true) throw new Error('esEnAMBA debería ser true');
      if (!order.coordenadas) throw new Error('Coordenadas no guardadas');
      if (!order.coordenadas.lat || !order.coordenadas.lng) throw new Error('Lat/lng incompleto');
    });

    await test('Obtener orden La Plata y verificar campos geo', async () => {
      if (!orderIdLaPlata) throw new Error('Orden no fue creada');
      
      const res = await axios.get(`${API_BASE}/api/orders`);
      const order = res.data.orders?.find(o => o._id === orderIdLaPlata);
      
      if (!order) throw new Error('Orden no encontrada');
      if (order.esEnAMBA !== false) throw new Error('esEnAMBA debería ser false');
      if (!order.coordenadas) throw new Error('Coordenadas no guardadas');
    });

    // ────────────────────────────────────────────────────────
    // TEST 5: Validación de casos edge
    // ────────────────────────────────────────────────────────
    section('TEST 5: Casos Edge');

    await test('Dirección vacía → error 400', async () => {
      try {
        await axios.post(`${API_BASE}/api/location/validate`, {
          direccion: '',
        });
        throw new Error('Debería rechazar dirección vacía');
      } catch (err) {
        if (err.response?.status !== 400) throw err;
      }
    });

    await test('Dirección inválida → fallback a búsqueda palabra clave', async () => {
      const res = await axios.post(`${API_BASE}/api/location/validate`, {
        direccion: 'xyzabc123notreal',
      });
      // Debería retornar algo, aunque no sea preciso
      if (!res.data) throw new Error('No retornó datos');
    });

    // ────────────────────────────────────────────────────────
    // RESUMEN
    // ────────────────────────────────────────────────────────
    section('📊 RESUMEN DE TESTS');

    console.log(`${colors.green}✅ Passed: ${testsPassed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${testsFailed}${colors.reset}`);
    console.log(`${colors.blue}📊 Total: ${testsPassed + testsFailed}${colors.reset}`);

    if (testsFailed === 0) {
      log(colors.green, '╔════════════════════════════════════════╗', '');
      log(colors.green, '║', '  🎉 TODOS LOS TESTS PASARON');
      log(colors.green, '╚════════════════════════════════════════╝', '');
      process.exit(0);
    } else {
      log(colors.red, '╔════════════════════════════════════════╗', '');
      log(colors.red, '║', `  ⚠️  ${testsFailed} TEST(S) FALLARON`);
      log(colors.red, '╚════════════════════════════════════════╝', '');
      process.exit(1);
    }
  } catch (error) {
    log(colors.red, '🔴', `Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Esperar a que el backend esté listo
console.log(`${colors.yellow}⏳${colors.reset} Esperando que backend esté listo...`);
setTimeout(() => {
  runTests();
}, 2000);
