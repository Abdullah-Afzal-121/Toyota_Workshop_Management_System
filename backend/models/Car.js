const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    carModel:     { type: String, required: true, trim: true },
    regNumber:    { type: String, required: true, unique: true, uppercase: true, trim: true },
    phoneNumber:  { type: String, trim: true, default: '' },
    needsAlignment: { type: Boolean, default: false },
    needsWashing:   { type: Boolean, default: false },
    status: {
      type:    String,
      enum:    ['pending', 'in-service', 'ready', 'closed'],
      default: 'pending',
    },
    feedback: {
      rating:      { type: Number, min: 1, max: 5, default: null },
      comment:     { type: String,  default: '' },
      submittedAt: { type: Date,    default: null },
    },
    assignedMechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    serviceAdvisor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    readyAt:          { type: Date, default: null }, // When car was marked ready for pickup
  },
  { timestamps: true }
);

module.exports = mongoose.model('Car', CarSchema);
