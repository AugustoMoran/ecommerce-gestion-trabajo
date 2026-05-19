const mongoose = require('mongoose');

const guestOrderSchema = new mongoose.Schema(
  {
    // Datos del visitante
    guestData: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      zone: { type: String, enum: ['AMBA', 'CABA'], required: true },
    },

    // Artículos del pedido
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        priceUSD: { type: Number, default: null, min: 0 },
      },
    ],

    // Totales
    total: { type: Number, required: true, min: 0 },
    totalUSD: { type: Number, default: null, min: 0 },
    currency: { type: String, enum: ['ARS', 'USD'], default: 'ARS' },

    // Pago y envío
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['MERCADO_PAGO', 'TRANSFER', 'CASH', 'OTHER'],
      default: 'MERCADO_PAGO',
    },
    paymentId: { type: String, default: null },
    paymentDate: { type: Date, default: null },
    trackingNumber: { type: String, default: null },

    // Notas internas
    notes: { type: String, default: '' },
    adminNotes: { type: String, default: '' },

    // Fecha de cancelación
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index para búsquedas rápidas
guestOrderSchema.index({ 'guestData.email': 1 });
guestOrderSchema.index({ status: 1 });
guestOrderSchema.index({ createdAt: -1 });

// Método para cambiar estado
guestOrderSchema.methods.updateStatus = function (newStatus, notes = '') {
  this.status = newStatus;
  if (notes) this.adminNotes = notes;
  return this.save();
};

// Método para cancelar
guestOrderSchema.methods.cancel = function (reason = '') {
  this.status = 'CANCELLED';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

module.exports = mongoose.model('GuestOrder', guestOrderSchema);
