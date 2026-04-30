const mongoose = require('mongoose');

const ServiceStageSchema = new mongoose.Schema(
  {
    carId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    stageName:          { type: String, required: true, trim: true },
    isCompleted:        { type: Boolean, default: false },
    order:              { type: Number, required: true },
    startedAt:          { type: Date,   default: null },
    completedAt:        { type: Date,   default: null },
    durationSeconds:    { type: Number, default: null },
    estimatedMinutes:   { type: Number, default: null },
    // Workflow fields
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    jcVerified:         { type: Boolean, default: false },
    isPaused:           { type: Boolean, default: false },
    totalPausedSeconds: { type: Number, default: 0 },
    lastPausedAt:       { type: Date, default: null },
    remarks: [{
      text:                 { type: String, required: true },
      isStoppage:           { type: Boolean, default: false },
      acknowledgedByJC:     { type: Boolean, default: false },
      // Customer response fields (filled by advisor after contacting customer)
      customerResponse:     { type: String, enum: ['approved', 'declined', null], default: null },
      customerResponseAt:   { type: Date, default: null },
      responseRecordedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      createdAt:            { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceStage', ServiceStageSchema);
