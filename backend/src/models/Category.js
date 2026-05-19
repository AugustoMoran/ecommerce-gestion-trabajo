const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, default: '' },
    imagen: { type: String, default: '' },
    imagenPublicId: { type: String, default: '' },
    // Keywords used by the chatbot for dynamic context building
    keywords: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

categorySchema.methods.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema);
