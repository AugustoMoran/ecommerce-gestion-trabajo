require('dotenv').config();
const DollarQuote = require('./src/models/DollarQuote');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

const seedQuote = async () => {
  try {
    // Conectar a MongoDB (usa MONGO_URI del .env)
    await connectDB();
    console.log('✅ MongoDB conectado');

    // Obtener un admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No se encontró un usuario admin');
      process.exit(1);
    }

    console.log(`Usando admin: ${adminUser.email}`);

    // Verificar si ya existe una cotización
    const existingQuote = await DollarQuote.findOne();
    if (existingQuote) {
      console.log('⚠️ Ya existe una cotización en la base de datos');
      console.log(`Cotización actual: $${existingQuote.quotePesosPerDollar} ARS por USD`);
      process.exit(0);
    }

    // Crear cotización inicial
    const initialQuote = new DollarQuote({
      quotePesosPerDollar: 1100.50,
      description: 'Cotización inicial de la plataforma',
      updatedBy: adminUser._id,
      isActive: true,
    });

    await initialQuote.save();
    console.log('✅ Cotización inicial creada');
    console.log(`   Cotización: $${initialQuote.quotePesosPerDollar} ARS por USD`);
    console.log(`   ID: ${initialQuote._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedQuote();
