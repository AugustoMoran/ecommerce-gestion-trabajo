const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function createTecnico() {
  try {
    const url = process.env.MONGO_URI;
    if (!url) {
      throw new Error('MONGO_URI no está definida en .env');
    }
    console.log('Conectando a MongoDB...');
    await mongoose.connect(url);
    
    // Crear técnico
    const tecnico = await User.create({
      nombre: 'Juan',
      apellido: 'Técnico',
      email: 'tecnico@test.com',
      password: '123456',
      role: 'tecnico',
      telefono: '1234567890'
    });
    
    console.log('✅ Técnico creado:', tecnico.email);
    console.log('   Contraseña: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTecnico();
