require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const checkProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB\n');

    const allProducts = await Product.find().lean();
    console.log(`Total productos en BD: ${allProducts.length}\n`);

    console.log('=== TODOS LOS PRODUCTOS ===');
    allProducts.forEach((p, i) => {
      console.log(`${i + 1}. "${p.nombre}"`);
      console.log(`   - hasInstallation: ${p.hasInstallation}`);
      console.log(`   - installationZones: ${JSON.stringify(p.installationZones)}`);
      console.log(`   - _id: ${p._id}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkProducts();
