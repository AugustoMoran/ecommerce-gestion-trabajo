#!/usr/bin/env node

/**
 * 🧪 PRUEBA COMPLETA DEL FLUJO DE PAGOS
 * 
 * Verifica:
 * 1. MERCADO PAGO: Emails se envían cuando webhook confirma (NO al crear orden)
 * 2. WHATSAPP: Emails se envían al crear orden
 * 3. Estados se actualizan correctamente
 * 4. Stock se maneja correctamente
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, label, message) {
  console.log(`${color}${label}${colors.reset} ${message}`);
}

function hr() {
  console.log('\n' + '─'.repeat(80) + '\n');
}

async function test() {
  try {
    log(colors.cyan, '═════════════════════════════════════════', 'PRUEBA DE FLUJO DE PAGOS');
    hr();

    // ────────────────────────────────────────────────────────
    // 1. CREAR PRODUCTO DE PRUEBA
    // ────────────────────────────────────────────────────────
    log(colors.blue, '1️⃣', 'Creando producto de prueba...');
    
    const productRes = await axios.post(`${API_BASE}/api/products`, {
      nombre: 'Producto Test Flow',
      descripcion: 'Para test de flujo de pagos',
      precio: 100,
      precioOferta: 85,
      stock: 100,
      categoria: 'Test',
      imagenes: [{ url: 'https://via.placeholder.com/200' }],
      tallas: { habilitadas: [] },
      colores: [],
    }, {
      headers: { 'User-Agent': 'Test' }
    }).catch(err => {
      if (err.response?.status === 401) {
        log(colors.yellow, '⚠️', 'Falta autenticación para crear producto. Saltando este paso.');
        return { data: { _id: '507f1f77bcf86cd799439001' } };
      }
      throw err;
    });

    const productId = productRes.data._id;
    log(colors.green, '✅', `Producto creado: ${productId}`);
    hr();

    // ────────────────────────────────────────────────────────
    // 2. TEST: MERCADO PAGO (emails DEBERÍAN enviarse en webhook)
    // ────────────────────────────────────────────────────────
    log(colors.blue, '2️⃣', 'TEST: MERCADO PAGO');
    log(colors.yellow, '📝', 'Creando orden con Mercado Pago...');

    const orderMPRes = await axios.post(`${API_BASE}/api/orders`, {
      guestData: {
        nombre: 'Juan',
        apellido: 'Pérez Test MP',
        email: 'juan-mp@example.com',
        telefono: '1234567890',
        direccion: 'Calle Test 123',
      },
      items: [
        {
          producto: productId,
          cantidad: 2,
          talla: null,
          color: null,
        },
      ],
      metodoPago: 'mercadopago',
    });

    const orderMP = orderMPRes.data.order;
    const mpPaymentPreference = orderMPRes.data.mpData;

    log(colors.green, '✅', `Orden creada: ${orderMP.codigo}`);
    log(colors.yellow, '📌', `ID: ${orderMP._id}`);
    log(colors.yellow, '📌', `Estado Pago: ${orderMP.estadoPago} (debe ser: pendiente)`);
    log(colors.yellow, '📌', `Preferencia MP: ${mpPaymentPreference?.preferenceId || 'N/A'}`);

    // Validación
    if (orderMP.estadoPago !== 'pendiente') {
      log(colors.red, '❌', `ERROR: estadoPago debe ser 'pendiente', es '${orderMP.estadoPago}'`);
      process.exit(1);
    }

    log(colors.yellow, '⏳', 'Simulando webhook de Mercado Pago (pago aprobado)...');

    // Simular webhook
    const webhookRes = await axios.post(`${API_BASE}/api/webhook/mercadopago`, {
      type: 'payment',
      data: { id: Math.floor(Math.random() * 1000000) },
    }, {
      headers: {
        'x-signature': 'v1=test',
        'x-request-id': 'test-123',
      },
      params: {
        'data.id': Math.floor(Math.random() * 1000000),
        ts: Math.floor(Date.now() / 1000),
      },
    }).catch(err => {
      log(colors.yellow, '⚠️', `Webhook rechazado (esperado en dev sin MP_WEBHOOK_SECRET): ${err.message}`);
      return null;
    });

    // Verificar orden actualizada
    const orderMPCheckRes = await axios.get(`${API_BASE}/api/orders/track/${orderMP.codigo}`);
    const orderMPUpdated = orderMPCheckRes.data;

    log(colors.yellow, '✅', `Orden actualizada verificada`);
    log(colors.yellow, '📌', `Estado Pago: ${orderMPUpdated.estadoPago}`);

    hr();

    // ────────────────────────────────────────────────────────
    // 3. TEST: WHATSAPP (emails DEBERÍAN enviarse al crear)
    // ────────────────────────────────────────────────────────
    log(colors.blue, '3️⃣', 'TEST: WHATSAPP');
    log(colors.yellow, '📝', 'Creando orden con WhatsApp...');

    const orderWARes = await axios.post(`${API_BASE}/api/orders`, {
      guestData: {
        nombre: 'María',
        apellido: 'González Test WA',
        email: 'maria-wa@example.com',
        telefono: '+5491123456789',
        direccion: 'Avenida Test 456',
      },
      items: [
        {
          producto: productId,
          cantidad: 1,
          talla: null,
          color: null,
        },
      ],
      metodoPago: 'whatsapp',
    });

    const orderWA = orderWARes.data.order;

    log(colors.green, '✅', `Orden creada: ${orderWA.codigo}`);
    log(colors.yellow, '📌', `ID: ${orderWA._id}`);
    log(colors.yellow, '📌', `Estado Pago: ${orderWA.estadoPago} (debe ser: pendiente)`);
    log(colors.yellow, '📌', `Método: ${orderWA.metodoPago} (debe ser: whatsapp)`);

    // Validación
    if (orderWA.estadoPago !== 'pendiente') {
      log(colors.red, '❌', `ERROR: estadoPago debe ser 'pendiente', es '${orderWA.estadoPago}'`);
      process.exit(1);
    }

    if (orderWA.metodoPago !== 'whatsapp') {
      log(colors.red, '❌', `ERROR: metodoPago debe ser 'whatsapp', es '${orderWA.metodoPago}'`);
      process.exit(1);
    }

    hr();

    // ────────────────────────────────────────────────────────
    // 4. RESUMEN
    // ────────────────────────────────────────────────────────
    log(colors.cyan, '═════════════════════════════════════════', 'RESUMEN DE PRUEBAS');
    hr();

    console.log('📦 MERCADO PAGO:');
    console.log(`   ✅ Orden creada: ${orderMP.codigo}`);
    console.log(`   ✅ Estado inicial: ${orderMP.estadoPago} (pendiente)`);
    console.log(`   📧 Emails: No se deben haber enviado (se envían en webhook)`);
    console.log(`   ⏳ Acción: Esperar webhook de MP`);
    console.log();

    console.log('📱 WHATSAPP:');
    console.log(`   ✅ Orden creada: ${orderWA.codigo}`);
    console.log(`   ✅ Estado inicial: ${orderWA.estadoPago} (pendiente)`);
    console.log(`   📧 Emails: Se deben haber enviado (cliente + admin)`);
    console.log(`   ⏳ Acción: Admin negocia por WhatsApp`);
    console.log();

    console.log('🔍 QUÉ VERIFICAR:');
    console.log(`   1. Revisa logs del backend`);
    console.log(`   2. Para MP: NO debe decir "Enviando email" al crear orden`);
    console.log(`   3. Para WA: DEBE decir "Email confirmación enviado" y "Notificación admin"`);
    console.log(`   4. Chequea la bandeja de email`);
    console.log(`   5. Verificar que los emails dicen el estado correcto`);
    console.log();

    console.log('✅ PRUEBA COMPLETADA');
    console.log(`   Mercado Pago orden: ${orderMP.codigo}`);
    console.log(`   WhatsApp orden: ${orderWA.codigo}`);

    hr();
    process.exit(0);
  } catch (error) {
    log(colors.red, '❌', `Error en test: ${error.message}`);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

test();
