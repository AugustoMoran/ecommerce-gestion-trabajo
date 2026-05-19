require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const checkNewProducts = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoUri);
    
    const products = await Product.find({}).lean();
    console.log(`Total: ${products.length}\n`);
    
    console.log('=== TODOS LOS PRODUCTOS ===');
    products.forEach((p, i) => {
      console.log(`${i + 1}. "${p.nombre}"`);
      console.log(`   - stock: ${p.stock}`);
      console.log(`   - isActive: ${p.isActive}`);
      console.log(`   - hasInstallation: ${p.hasInstallation}`);
      console.log(`   - precio: ${p.precio}`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkNewProducts();
