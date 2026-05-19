require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const testQuery = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    
    const id = '6a086dfa59fb31c56735b04f';
    
    console.log(`🔍 Buscando producto con ID: ${id}\n`);
    
    // Query 1: Sin filtro
    console.log('=== QUERY 1: Sin filtro ===');
    const product1 = await Product.findOne({ _id: id });
    console.log(`Resultado: ${product1 ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    if (product1) {
      console.log(`- nombre: ${product1.nombre}`);
      console.log(`- isActive: ${product1.isActive}`);
      console.log(`- hasInstallation: ${product1.hasInstallation}`);
    }
    console.log();
    
    // Query 2: Con isActive
    console.log('=== QUERY 2: Con isActive: true ===');
    const product2 = await Product.findOne({ _id: id, isActive: true });
    console.log(`Resultado: ${product2 ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    if (product2) {
      console.log(`- nombre: ${product2.nombre}`);
      console.log(`- isActive: ${product2.isActive}`);
      console.log(`- hasInstallation: ${product2.hasInstallation}`);
    }
    console.log();

    // Query 3: Con populate
    console.log('=== QUERY 3: Con populate de categoria ===');
    const product3 = await Product.findOne({ _id: id, isActive: true }).populate('categoria', 'nombre');
    console.log(`Resultado: ${product3 ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    if (product3) {
      console.log(`- nombre: ${product3.nombre}`);
      console.log(`- isActive: ${product3.isActive}`);
      console.log(`- hasInstallation: ${product3.hasInstallation}`);
      console.log(`- categoria: ${product3.categoria}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testQuery();
