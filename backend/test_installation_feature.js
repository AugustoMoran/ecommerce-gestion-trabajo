require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const User = require('./src/models/User');

const testInstallationFeature = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB\n');

    // TEST 1: Buscar productos con instalación
    console.log('=== TEST 1: Productos CON Instalación ===');
    const productsWithInstallation = await Product.find({ hasInstallation: true }).lean();
    console.log(`Encontrados: ${productsWithInstallation.length} productos\n`);
    
    if (productsWithInstallation.length > 0) {
      productsWithInstallation.slice(0, 3).forEach((p, i) => {
        console.log(`${i + 1}. "${p.nombre}"`);
        console.log(`   - hasInstallation: ${p.hasInstallation}`);
        console.log(`   - installationZones: ${JSON.stringify(p.installationZones)}`);
        console.log();
      });
    } else {
      console.log('⚠️  No hay productos con instalación habilitada\n');
    }

    // TEST 2: Buscar productos SIN instalación
    console.log('=== TEST 2: Productos SIN Instalación ===');
    const productsWithoutInstallation = await Product.find({ hasInstallation: false }).lean();
    console.log(`Encontrados: ${productsWithoutInstallation.length} productos\n`);
    
    if (productsWithoutInstallation.length > 0) {
      productsWithoutInstallation.slice(0, 3).forEach((p, i) => {
        console.log(`${i + 1}. "${p.nombre}"`);
        console.log(`   - hasInstallation: ${p.hasInstallation}`);
        console.log(`   - installationZones: ${JSON.stringify(p.installationZones)}`);
        console.log();
      });
    }

    // TEST 3: Verificar usuarios en AMBA
    console.log('=== TEST 3: Usuarios en AMBA/CABA ===');
    const usersInAMBA = await User.find({ zone: { $in: ['AMBA', 'CABA'] } }).lean();
    console.log(`Encontrados: ${usersInAMBA.length} usuarios en AMBA/CABA\n`);
    
    if (usersInAMBA.length > 0) {
      usersInAMBA.slice(0, 5).forEach((u, i) => {
        console.log(`${i + 1}. ${u.nombre} ${u.apellido} (${u.email})`);
        console.log(`   - zone: ${u.zone}`);
        console.log(`   - role: ${u.role}`);
        console.log();
      });
    } else {
      console.log('⚠️  No hay usuarios con zone definida\n');
    }

    // TEST 4: Verificar usuarios SIN zone
    console.log('=== TEST 4: Usuarios SIN zone definida ===');
    const usersWithoutZone = await User.find({ zone: null }).lean();
    console.log(`Encontrados: ${usersWithoutZone.length} usuarios sin zone\n`);
    
    if (usersWithoutZone.length > 0) {
      usersWithoutZone.slice(0, 5).forEach((u, i) => {
        console.log(`${i + 1}. ${u.nombre} ${u.apellido} (${u.email})`);
        console.log(`   - zone: ${u.zone}`);
        console.log(`   - role: ${u.role}`);
        console.log();
      });
      console.log('💡 SOLUCIÓN: Asignar zone a estos usuarios para que vean instalación\n');
    }

    // TEST 5: Simular lógica de canRequestInstallation
    console.log('=== TEST 5: Validación de Lógica Installation ===');
    
    if (productsWithInstallation.length > 0 && usersInAMBA.length > 0) {
      const testProduct = productsWithInstallation[0];
      const testUser = usersInAMBA[0];
      
      const canRequestInstallation = () => {
        if (!testProduct.hasInstallation) {
          return false;
        }
        if (!testUser) {
          return false;
        }
        const userInAMBA = testUser?.zone === 'AMBA' || testUser?.zone === 'CABA';
        return userInAMBA;
      };

      console.log(`Producto: "${testProduct.nombre}"`);
      console.log(`Usuario: ${testUser.nombre} (${testUser.email})`);
      console.log(`\n✅ ¿Debería mostrar botón instalación? ${canRequestInstallation() ? 'SÍ' : 'NO'}`);
      console.log(`   - Producto hasInstallation: ${testProduct.hasInstallation}`);
      console.log(`   - Producto installationZones: ${JSON.stringify(testProduct.installationZones)}`);
      console.log(`   - Usuario zone: ${testUser.zone}`);
    }

    console.log('\n=== TEST COMPLETADO ===\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testInstallationFeature();
