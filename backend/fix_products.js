require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const fixProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB\n');

    // Actualizar los 3 últimos productos (los que creamos) para tener isActive: true
    const result = await Product.updateMany(
      { nombre: { $in: ['Aire Acondicionado 3000W', 'Heladera Inverter', 'Notebook Dell (SIN instalación)'] } },
      { $set: { isActive: true, deletedAt: null } }
    );

    console.log(`✅ Actualizados ${result.modifiedCount} productos\n`);

    // Verificar
    const products = await Product.find({ 
      nombre: { $in: ['Aire Acondicionado 3000W', 'Heladera Inverter', 'Notebook Dell (SIN instalación)'] } 
    }).lean();

    console.log('=== PRODUCTOS ACTUALIZADOS ===');
    products.forEach((p, i) => {
      console.log(`${i + 1}. "${p.nombre}"`);
      console.log(`   - isActive: ${p.isActive}`);
      console.log(`   - hasInstallation: ${p.hasInstallation}`);
      console.log(`   - installationZones: ${JSON.stringify(p.installationZones)}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

fixProducts();
