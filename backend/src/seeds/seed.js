/**
 * Seed script — populates the database with demo data.
 *
 * Usage:
 *   node src/seeds/seed.js            # insert demo data
 *   node src/seeds/seed.js --destroy  # wipe all data first
 *
 * Requires a .env file with MONGO_URI set.
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// ─── Demo data ────────────────────────────────────────────────────────────────

const adminUser = {
  nombre: 'Admin',
  apellido: 'Demo',
  email: 'admin@demo.com',
  password: 'Admin1234!',
  role: 'admin',
  isActive: true,
};

const categories = [
  { nombre: 'Ropa deportiva', slug: 'ropa-deportiva', descripcion: 'Indumentaria para entrenar y competir', orden: 1, isActive: true },
  { nombre: 'Calzado', slug: 'calzado', descripcion: 'Zapatillas y botines', orden: 2, isActive: true },
  { nombre: 'Accesorios', slug: 'accesorios', descripcion: 'Bolsos, mochilas y más', orden: 3, isActive: true },
];

const coupons = [
  {
    codigo: 'BIENVENIDO10',
    tipo: 'porcentaje',
    valor: 10,
    minimoCompra: 5000,
    maxUsos: 100,
    fechaVencimiento: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    isActive: true,
  },
  {
    codigo: 'DESCUENTO500',
    tipo: 'monto',
    valor: 500,
    minimoCompra: 10000,
    maxUsos: 50,
    fechaVencimiento: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    isActive: true,
  },
];

// Products are generated after categories are inserted so we have real IDs.
const buildProducts = (categoryMap) => [
  {
    nombre: 'Remera deportiva básica',
    descripcion: 'Remera de poliéster transpirable, ideal para entrenar. Tecnología dry-fit.',
    precio: 8500,
    precioOferta: 6990,
    stock: 50,
    categoria: categoryMap['ropa-deportiva'],
    imagenes: ['https://placehold.co/600x600?text=Remera'],
    tags: ['remera', 'deportiva', 'dry-fit'],
    isActive: true,
  },
  {
    nombre: 'Short de running',
    descripcion: 'Short liviano con bolsillo lateral y terminación elástica.',
    precio: 7200,
    stock: 30,
    categoria: categoryMap['ropa-deportiva'],
    imagenes: ['https://placehold.co/600x600?text=Short'],
    tags: ['short', 'running', 'hombre'],
    isActive: true,
  },
  {
    nombre: 'Zapatillas training pro',
    descripcion: 'Suela de goma de alta tracción, plantilla removible, ideal para cross training.',
    precio: 32000,
    precioOferta: 27990,
    stock: 20,
    categoria: categoryMap['calzado'],
    imagenes: ['https://placehold.co/600x600?text=Zapatillas'],
    tags: ['zapatillas', 'training', 'cross'],
    isActive: true,
  },
  {
    nombre: 'Mochila deportiva 20L',
    descripcion: 'Mochila resistente al agua con compartimento para hidratación.',
    precio: 15000,
    stock: 15,
    categoria: categoryMap['accesorios'],
    imagenes: ['https://placehold.co/600x600?text=Mochila'],
    tags: ['mochila', 'bolso', 'gym'],
    isActive: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function connect() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined. Make sure .env is loaded.');
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
}

async function destroy() {
  console.log('Destroying existing data...');
  await Promise.all([
    User.deleteMany({ role: { $ne: 'admin' } }), // keep existing admins
    Category.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
  ]);
  // Also remove seed admin if present (re-seed will recreate it)
  await User.deleteMany({ email: adminUser.email });
  console.log('Done destroying');
}

async function seed() {
  // Admin user
  const existingAdmin = await User.findOne({ email: adminUser.email });
  if (!existingAdmin) {
    await User.create(adminUser);
    console.log(`Admin created: ${adminUser.email} / ${adminUser.password}`);
  } else {
    console.log(`Admin already exists: ${adminUser.email}`);
  }

  // Categories
  const insertedCategories = await Category.insertMany(categories);
  const categoryMap = Object.fromEntries(insertedCategories.map((c) => [c.slug, c._id]));
  console.log(`Categories created: ${insertedCategories.length}`);

  // Products
  const products = buildProducts(categoryMap);
  await Product.insertMany(products);
  console.log(`Products created: ${products.length}`);

  // Coupons
  await Coupon.insertMany(coupons);
  console.log(`Coupons created: ${coupons.length}`);

  console.log('\nSeed complete!');
  console.log(`Login: ${adminUser.email} / ${adminUser.password}`);
  console.log('Coupons:', coupons.map((c) => c.codigo).join(', '));
}

// ─── Entry point ─────────────────────────────────────────────────────────────

(async () => {
  try {
    await connect();
    if (process.argv.includes('--destroy')) {
      await destroy();
    }
    await seed();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
