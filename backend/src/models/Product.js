const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const colorSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    codigo: { type: String, required: true },
    habilitado: { type: Boolean, default: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    precio: { type: Number, default: null, min: 0 },
    precioOferta: { type: Number, default: null, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    imagenes: [mediaSchema],
    videos: [mediaSchema],
    tags: [{ type: String, trim: true }],
    
    // Tallas y colores (max 8 colores)
    tallas: {
      habilitadas: [{ type: String, trim: true }],
      rango: { type: String, default: '' },
    },
    colores: [colorSchema],
    
    // NEW: Pricing en USD y ARS (para sistema profesional multi-moneda)
    priceUSD: { type: Number, default: null, min: 0 },
    priceOfferUSD: { type: Number, default: null, min: 0 },
    pricePesos: { type: Number, default: null, min: 0 },
    priceOfferPesos: { type: Number, default: null, min: 0 },
    
    // NEW: Instalación y zonas
    hasInstallation: { type: Boolean, default: false },
    installationZones: {
      type: [{ type: String, enum: ['AMBA', 'CABA'] }],
      default: [],
    },
    
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    vendidos: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index for search
productSchema.index({ nombre: 'text', descripcion: 'text', tags: 'text' });

productSchema.methods.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
