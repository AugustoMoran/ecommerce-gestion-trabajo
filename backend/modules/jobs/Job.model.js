const mongoose = require('mongoose');

/**
 * Job (Trabajo) model.
 *
 * assignedTechnicians stores one entry PER SLOT taken.
 * A single technician ID may appear multiple times if they claimed multiple slots.
 * This allows proportional liquidation calculation.
 */
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    slots: { type: Number, required: true, min: 1, default: 1 },
    assignedTechnicians: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['OPEN', 'FULL', 'IN_PROGRESS', 'DONE'],
      default: 'OPEN',
    },
    observations: { type: String, default: '' },
    photos: [{ type: String }],
    // Reference to a previous job (warranty / follow-up)
    previousJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
