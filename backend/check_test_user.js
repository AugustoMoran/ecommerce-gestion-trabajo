require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const checkUser = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB\n');

    // Buscar el usuario
    const user = await User.findOne({ email: 'test@test.com' }).select('+password');
    
    if (!user) {
      console.log('❌ Usuario NO encontrado en la BD');
    } else {
      console.log('✅ Usuario encontrado:');
      console.log(`  _id: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password (hashed): ${user.password}`);
      console.log(`  Zone: ${user.zone}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  isActive: ${user.isActive}`);
      console.log(`\n  Intentando comparar contraseña "Test123!"...`);
      
      const valid = await user.comparePassword('Test123!');
      console.log(`  ¿Contraseña válida?: ${valid}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkUser();
