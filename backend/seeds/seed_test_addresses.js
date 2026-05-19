/**
 * 🌍 SEED - USUARIOS DE PRUEBA CON DIRECCIONES DENTRO Y FUERA DE AMBA/CABA
 * 
 * Este seed crea:
 * - 4 usuarios CON direcciones dentro de AMBA/CABA (deberían ver opción de instalación)
 * - 4 usuarios CON direcciones FUERA de AMBA/CABA (NO deberían ver opción)
 * 
 * Para ejecutar:
 *   node backend/seeds/seed_test_addresses.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const path = require('path');

// Importar modelos
const User = require('../src/models/User');

// Direcciones de prueba dentro de AMBA/CABA ✅
const DIRECCIONES_DENTRO = [
  {
    nombre: "Test",
    apellido: "AMBA1",
    email: "moron.user@test.com",
    password: "TestPassword123!",
    direccion: "Calle Principal 123, Morón, Buenos Aires, Argentina",
    telefono: "1123456789",
    esperado: { esEnAMBA: true, zona: "AMBA", partido: "Morón" }
  },
  {
    nombre: "Test",
    apellido: "AMBA2",
    email: "sanisidro.user@test.com",
    password: "TestPassword123!",
    direccion: "Avenida del Libertador 1100, San Isidro, Buenos Aires, Argentina",
    telefono: "1134567890",
    esperado: { esEnAMBA: true, zona: "AMBA", partido: "San Isidro" }
  },
  {
    nombre: "Test",
    apellido: "AMBA3",
    email: "avellaneda.user@test.com",
    password: "TestPassword123!",
    direccion: "Mitre 789, Avellaneda, Buenos Aires, Argentina",
    telefono: "1145678901",
    esperado: { esEnAMBA: true, zona: "AMBA", partido: "Avellaneda" }
  },
  {
    nombre: "Test",
    apellido: "CABA",
    email: "flores.user@test.com",
    password: "TestPassword123!",
    direccion: "Avenida Rivadavia 5500, Flores, Ciudad Autónoma de Buenos Aires, Argentina",
    telefono: "1156789012",
    esperado: { esEnAMBA: true, zona: "CABA", caba: true }
  },
  {
    nombre: "Test",
    apellido: "AMBA5",
    email: "quilmes.user@test.com",
    password: "TestPassword123!",
    direccion: "Quilmes, Buenos Aires, Argentina",
    telefono: "1167890123",
    esperado: { esEnAMBA: true, zona: "AMBA", partido: "Quilmes" }
  },
  {
    nombre: "Test",
    apellido: "AMBA6",
    email: "lanus.user@test.com",
    password: "TestPassword123!",
    direccion: "Lanús, Buenos Aires, Argentina",
    telefono: "1178901234",
    esperado: { esEnAMBA: true, zona: "AMBA", partido: "Lanús" }
  }
];

// Direcciones de prueba FUERA de AMBA/CABA ❌
const DIRECCIONES_FUERA = [
  {
    nombre: "Test",
    apellido: "Fuera1",
    email: "laplata.user@test.com",
    password: "TestPassword123!",
    direccion: "Calle 7 100, La Plata, Buenos Aires, Argentina",
    telefono: "2215678901",
    esperado: { esEnAMBA: false, zona: "NO CABA/AMBA", provincia: "Buenos Aires" }
  },
  {
    nombre: "Test",
    apellido: "Fuera2",
    email: "mardel.user@test.com",
    password: "TestPassword123!",
    direccion: "Avenida Luro 3000, Mar del Plata, Buenos Aires, Argentina",
    telefono: "2235678901",
    esperado: { esEnAMBA: false, zona: "NO CABA/AMBA", provincia: "Buenos Aires" }
  },
  {
    nombre: "Test",
    apellido: "Fuera3",
    email: "cordoba.user@test.com",
    password: "TestPassword123!",
    direccion: "Calle 9 de Julio 200, Córdoba, Córdoba, Argentina",
    telefono: "3515678901",
    esperado: { esEnAMBA: false, zona: "NO CABA/AMBA", provincia: "Córdoba" }
  },
  {
    nombre: "Test",
    apellido: "Fuera4",
    email: "mendoza.user@test.com",
    password: "TestPassword123!",
    direccion: "Avenida San Martín 1500, Mendoza, Mendoza, Argentina",
    telefono: "2615678901",
    esperado: { esEnAMBA: false, zona: "NO CABA/AMBA", provincia: "Mendoza" }
  },
  {
    nombre: "Test",
    apellido: "Fuera5",
    email: "tucuman.user@test.com",
    password: "TestPassword123!",
    direccion: "San Miguel de Tucumán, Tucumán, Argentina",
    telefono: "3815678901",
    esperado: { esEnAMBA: false, zona: "NO CABA/AMBA", provincia: "Tucumán" }
  },
  {
    nombre: "Test",
    apellido: "Fuera6",
    email: "rosario.user@test.com",
    password: "TestPassword123!",
    direccion: "Rosario, Santa Fe, Argentina",
    telefono: "3415678901",
    esperado: { esEnAMBA: false, zona: "NO CABA/AMBA", provincia: "Santa Fe" }
  }
];

const log = (color, msg) => {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
  };
  console.log(`${colors[color]}${msg}${colors.reset}`);
};

async function seedTestAddresses() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    log('green', '✅ Connected to MongoDB');

    // Limpiar usuarios de prueba existentes
    const testEmails = [
      ...DIRECCIONES_DENTRO.map(d => d.email),
      ...DIRECCIONES_FUERA.map(d => d.email)
    ];
    
    await User.deleteMany({ email: { $in: testEmails } });
    log('yellow', '🗑️  Usuarios de prueba anteriores eliminados');

    // Crear usuarios dentro de AMBA/CABA
    log('blue', '\n📍 CREANDO USUARIOS CON DIRECCIONES DENTRO DE AMBA/CABA\n');
    
    for (const userData of DIRECCIONES_DENTRO) {
      const user = new User({
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        password: userData.password,
        direccion: userData.direccion,
        telefono: userData.telefono,
        rol: 'user',
      });

      await user.save();
      log('green', `✅ ${userData.apellido}`);
      log('blue', `   📍 Dirección: ${userData.direccion}`);
      log('green', `   ✓ Esperado: ${userData.esperado.zona}`);
    }

    // Crear usuarios fuera de AMBA/CABA
    log('blue', '\n❌ CREANDO USUARIOS CON DIRECCIONES FUERA DE AMBA/CABA\n');
    
    for (const userData of DIRECCIONES_FUERA) {
      const user = new User({
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        password: userData.password,
        direccion: userData.direccion,
        telefono: userData.telefono,
        rol: 'user',
      });

      await user.save();
      log('green', `✅ ${userData.apellido}`);
      log('blue', `   📍 Dirección: ${userData.direccion}`);
      log('red', `   ✗ Esperado: ${userData.esperado.zona}`);
    }

    log('green', '\n🎉 SEED COMPLETADO EXITOSAMENTE\n');

    log('yellow', '📋 RESUMEN:\n');
    log('green', `✅ 6 usuarios DENTRO de AMBA/CABA (deberían ver opción de instalación)`);
    log('red', `❌ 6 usuarios FUERA de AMBA/CABA (NO deberían ver opción)`);

    log('yellow', '\n🔑 CREDENCIALES DE PRUEBA:\n');
    
    log('green', 'DENTRO DE AMBA/CABA:');
    DIRECCIONES_DENTRO.forEach(d => {
      log('blue', `  • ${d.email} / ${d.password}`);
    });

    log('red', '\nFUERA DE AMBA/CABA:');
    DIRECCIONES_FUERA.forEach(d => {
      log('blue', `  • ${d.email} / ${d.password}`);
    });

    log('yellow', '\n🧪 PRÓXIMOS PASOS:\n');
    log('blue', '1. Ejecutar: npm run test -- test_installation_display.test.js');
    log('blue', '2. O hacer test manual en browser ingresando estos usuarios');

    process.exit(0);
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

seedTestAddresses();
