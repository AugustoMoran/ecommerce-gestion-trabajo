const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      unique: true,
      required: true, // Ej: PSP-0001
    },
    client: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      nombre: String,
      email: String,
      telefono: String,
      direccion: {
        calle: String,
        ciudad: String,
        provincia: String,
        codigoPostal: String,
        pais: String,
      },
    },
    items: [
      {
        producto: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        nombre: String,
        cantidad: Number,
        precioUnitario: Number,
        subtotal: Number,
        currency: { type: String, enum: ['USD', 'ARS'], default: 'USD' },
      },
    ],
    instalacion: {
      incluye: { type: Boolean, default: false },
      monto: { type: Number, default: 0 },
      descripcion: String,
    },
    totales: {
      subtotal: Number,
      instalacion: { type: Number, default: 0 },
      descuento: { type: Number, default: 0 },
      total: Number,
      // Totales por moneda
      USD: {
        subtotal: { type: Number, default: 0 },
        instalacion: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      ARS: {
        subtotal: { type: Number, default: 0 },
        instalacion: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
    },
    estado: {
      type: String,
      enum: ['borrador', 'enviado', 'aceptado', 'rechazado'],
      default: 'borrador',
    },
    notas: String, // Notas internas para admin
    enviado: {
      fecha: Date,
      email: String,
      visto: { type: Boolean, default: false },
      descargadoFecha: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quote', quoteSchema);
