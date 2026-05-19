const mongoose = require('mongoose');

const adminRecommendationSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    ],
    message: {
      type: String,
      default: '',
      maxlength: 500,
      trim: true,
    },
    addedToCart: {
      type: Date,
      default: null,
    },
    viewedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index para búsquedas rápidas
adminRecommendationSchema.index({ clientId: 1, isActive: 1 });
adminRecommendationSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  'AdminRecommendation',
  adminRecommendationSchema
);
