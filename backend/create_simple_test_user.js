const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema - INLINE
const userSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  email: { type: String, unique: true, lowercase: true },
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

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function createSimpleUser() {
  try {
    console.log('📌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado');

    // Delete existing
    await User.deleteOne({ email: 'test@simple.com' });

    // Create user with simple password
    const user = new User({
      nombre: 'Test',
      apellido: 'Simple',
      email: 'test@simple.com',
      password: 'test123', // Simple password
      telefono: '1234567890',
      direccion: 'Test Street',
      role: 'user',
      zone: 'AMBA',
      isActive: true
    });

    const savedUser = await user.save();
    console.log(`\n✅ Usuario creado:`);
    console.log(`   Email: test@simple.com`);
    console.log(`   Password: test123`);
    console.log(`   Zone: AMBA`);

    // Verify password comparison works
    const foundUser = await User.findOne({ email: 'test@simple.com' }).select('+password');
    const passwordMatch = await foundUser.comparePassword('test123');
    console.log(`\n✅ Verificación:`);
    console.log(`   Password hash: ${foundUser.password.substring(0, 20)}...`);
    console.log(`   Password match: ${passwordMatch}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSimpleUser();
