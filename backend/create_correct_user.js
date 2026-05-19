require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const createCorrectUser = async () => {
  try {
    // Usar EXACTAMENTE la misma URL que el backend
    const mongoUri = process.env.MONGO_URI;
    console.log(`[DEBUG] Conectando a: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    
    console.log(`[DEBUG] Conexión exitosa a MongoDB`);
    console.log('✅ Conectado a MongoDB\n');

    // Crear usuario
    const testUser = {
      nombre: 'Test',
      apellido: 'Usuario',
      email: 'testinstall@test.com',
      password: 'Pass123456',
      telefono: '1234567890',
      zone: 'AMBA',
      role: 'user',
      isActive: true,
    };

    // Eliminar si existe
    await User.deleteOne({ email: 'testinstall@test.com' });

    // Crear nuevo
    const user = await User.create(testUser);
    
    console.log('✅ Usuario creado EN LA BASE DE DATOS CORRECTA:\n');
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: Pass123456`);
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

createCorrectUser();
