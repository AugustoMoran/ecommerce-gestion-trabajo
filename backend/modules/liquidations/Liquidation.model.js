const mongoose = require('mongoose');

/**
 * Liquidation model.
 *
 * Records a liquidation period for a technician.
 * Each job included can have a custom split mode:
 *  - "equal" → divide price evenly among unique technicians
 *  - "custom" → use slotRatio to weight each technician's share
 *
 * The `total` field stores the computed amount the technician earns in this period.
 */
const liquidationSchema = new mongoose.Schema(
  {
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
    ],
    total: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    splitMode: {
      type: String,
      enum: ['equal', 'custom'],
      default: 'equal',
    },
    // Breakdown detail per job for audit trail
    breakdown: [
      {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        jobPrice: Number,
        technicianSlots: Number,
        totalSlots: Number,
        earned: Number,
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Liquidation', liquidationSchema);
