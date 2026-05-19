const mongoose = require('mongoose');

const dollarQuoteSchema = new mongoose.Schema(
  {
    quotePesosPerDollar: {
      type: Number,
      required: true,
      min: 0,
      description: 'Cotización: cuántos pesos argentinos por 1 dólar USD',
    },
    description: {
      type: String,
      default: '',
      maxlength: 200,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index para obtener rápidamente la cotización más reciente y activa
dollarQuoteSchema.index({ isActive: 1, createdAt: -1 });

// Método para obtener la cotización actual
dollarQuoteSchema.statics.getCurrentQuote = async function () {
  const quote = await this.findOne({ isActive: true })
    .sort({ createdAt: -1 })
    .populate('updatedBy', 'nombre apellido email');
  return quote;
};

module.exports = mongoose.model('DollarQuote', dollarQuoteSchema);
