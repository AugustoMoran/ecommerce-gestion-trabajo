require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const User = require('./src/models/User');

const seedInstallationData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}\n`);

    // PASO 1: Asignar zone a usuarios existentes
    console.log('=== PASO 1: Asignando zone a usuarios ===');
    const updateResult = await User.updateMany(
      { zone: null },
      { $set: { zone: 'AMBA' } }
    );
    console.log(`✅ Actualizados ${updateResult.modifiedCount} usuarios con zone: 'AMBA'\n`);

    // PASO 2: Crear algunos productos de prueba CON instalación
    console.log('=== PASO 2: Creando productos con instalación ===');
    
    const testProducts = [
      {
        nombre: 'Aire Acondicionado 3000W',
        descripcion: 'Aire acondicionado de alta potencia con instalación disponible',
        priceUSD: 500,
        pricePesos: 500000,
        priceOfferUSD: 450,
        priceOfferPesos: 450000,
        hasInstallation: true,
        installationZones: ['AMBA', 'CABA'],
        stock: 10,
        colores: [],
        tallas: { habilitadas: [] },
        imagenes: [],
        videos: [],
        isActive: true,
      },
      {
        nombre: 'Heladera Inverter',
        descripcion: 'Heladera con tecnología inverter. Servicio de instalación disponible en AMBA',
        priceUSD: 800,
        pricePesos: 800000,
        priceOfferUSD: null,
        priceOfferPesos: null,
        hasInstallation: true,
        installationZones: ['AMBA', 'CABA'],
        stock: 5,
        colores: [],
        tallas: { habilitadas: [] },
        imagenes: [],
        videos: [],
        isActive: true,
      },
      {
        nombre: 'Notebook Dell (SIN instalación)',
        descripcion: 'Notebook sin servicio de instalación',
        priceUSD: 1200,
        pricePesos: 1200000,
        priceOfferUSD: null,
        priceOfferPesos: null,
        hasInstallation: false,
        installationZones: [],
        stock: 15,
        colores: [],
        tallas: { habilitadas: [] },
        imagenes: [],
        videos: [],
        isActive: true,
      }
    ];

    const created = await Product.insertMany(testProducts);
    console.log(`✅ Creados ${created.length} productos de prueba\n`);

    created.forEach((p, i) => {
      console.log(`${i + 1}. "${p.nombre}"`);
      console.log(`   - hasInstallation: ${p.hasInstallation}`);
      console.log(`   - installationZones: ${JSON.stringify(p.installationZones)}`);
      console.log();
    });

    // PASO 3: Verificar nuevamente
    console.log('=== PASO 3: Verificación Final ===');
    const productsWithInstallation = await Product.countDocuments({ hasInstallation: true });
    const productsWithoutInstallation = await Product.countDocuments({ hasInstallation: false });
    const usersInAMBA = await User.countDocuments({ zone: 'AMBA' });

    console.log(`✅ Productos con instalación: ${productsWithInstallation}`);
    console.log(`✅ Productos SIN instalación: ${productsWithoutInstallation}`);
    console.log(`✅ Usuarios en AMBA: ${usersInAMBA}`);
    console.log('\n✅ Seed completado. Ahora abre ProductDetail en el navegador y verifica:\n');
    console.log('🧪 TEST 1: Abre un producto CON instalación → Debe mostrar botón "Solicitar instalación"');
    console.log('🧪 TEST 2: Abre un producto SIN instalación → NO debe mostrar botón de instalación');
    console.log('🧪 TEST 3: Verifica que el usuario esté con zone: "AMBA"\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedInstallationData();
