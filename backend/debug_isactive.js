require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const checkActiveProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    
    const products = await Product.find().lean();
    console.log(`Total: ${products.length}\n`);
    
    console.log('=== ESTADO isActive DE TODOS LOS PRODUCTOS ===');
    products.forEach((p, i) => {
      console.log(`${i + 1}. "${p.nombre}"`);
      console.log(`   - _id: ${p._id}`);
      console.log(`   - isActive: ${p.isActive}`);
      console.log(`   - hasInstallation: ${p.hasInstallation}`);
      console.log(`   - deletedAt: ${p.deletedAt}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkActiveProducts();
