const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['BUSY', 'SWAPPABLE', 'SWAP_PENDING'],
    default: 'BUSY'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // SOFT DELETE FIELDS - ADD THESE
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recoveryExpiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  }
}, {
  timestamps: true
});

// Add index for better query performance
eventSchema.index({ userId: 1, deleted: 1 });
eventSchema.index({ deleted: 1, recoveryExpiresAt: 1 });

module.exports = mongoose.model('Event', eventSchema);