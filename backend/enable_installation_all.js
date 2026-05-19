require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const enableInstallation = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoUri);
    
    // Actualizar los 3 productos para tener instalación
    const result = await Product.updateMany(
      {},
      { 
        $set: { 
          hasInstallation: true,
          installationZones: ['AMBA', 'CABA']
        } 
      }
    );
    
    console.log(`✅ Actualizados ${result.modifiedCount} productos\n`);

    const products = await Product.find({}).lean();
    console.log('=== PRODUCTOS ACTUALIZADOS ===');
    products.forEach((p, i) => {
      console.log(`${i + 1}. "${p.nombre}"`);
      console.log(`   - _id: ${p._id}`);
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

enableInstallation();
