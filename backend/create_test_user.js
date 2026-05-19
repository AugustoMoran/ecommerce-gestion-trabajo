require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const createTestUser = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB\n');

    // Crear usuario de prueba
    const testUser = {
      nombre: 'Test',
      apellido: 'Usuario',
      email: 'test@test.com',
      password: 'Test123!',
      telefono: '1234567890',
      zone: 'AMBA',
      role: 'user',
      isActive: true,
    };

    // Eliminar si existe
    await User.deleteOne({ email: 'test@test.com' });

    // Crear nuevo
    const user = await User.create(testUser);
    
    console.log('✅ Usuario creado:\n');
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: Test123!`);
    console.log(`  Zone: ${user.zone}`);
    console.log(`  Role: ${user.role}`);
    console.log(`\n✅ Usa estas credenciales para loguarte en el navegador`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createTestUser();
