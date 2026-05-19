const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema - INLINE
const userSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  email: { type: String, unique: true },
  password: String,
  telefono: String,
  direccion: String,
  role: { type: String, default: 'user' },
  zone: { type: String, enum: ['AMBA', 'CABA', null], default: null },
  favoritos: [mongoose.Schema.Types.ObjectId],
  isActive: { type: Boolean, default: true },
  deletedAt: Date,
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    console.log('Conectando a MongoDB...');
    console.log('MONGO_URI:', process.env.MONGO_URI?.substring(0, 50) + '...');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Check existing users
    const users = await User.find({ isActive: true }).select('email zone role');
    console.log('Usuarios en DB:', users.length);
    users.forEach(u => console.log(`  - ${u.email} (zone: ${u.zone})`));

    // Delete if exists
    await User.deleteOne({ email: 'testinstall@test.com' });
    console.log('Antiguo usuario eliminado (si existía)');

    // Create new user
    const newUser = new User({
      nombre: 'Test',
      apellido: 'Install',
      email: 'testinstall@test.com',
      password: 'Pass123456',
      telefono: '1234567890',
      direccion: 'Calle Test 123',
      role: 'user',
      zone: 'AMBA',
      isActive: true
    });

    await newUser.save();
    console.log('✅ Usuario creado exitosamente:');
    console.log(`   Email: testinstall@test.com`);
    console.log(`   Password: Pass123456`);
    console.log(`   Zone: AMBA`);
    console.log(`   Role: user`);

    // Verify it was created
    const created = await User.findOne({ email: 'testinstall@test.com' });
    console.log('\n✅ Verificación - Usuario encontrado:');
    console.log(`   Email: ${created.email}`);
    console.log(`   Zone: ${created.zone}`);
    console.log(`   Role: ${created.role}`);

    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createTestUser();
