const mongoose = require('mongoose');

const JobMasterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    default: 'General'
  },
  estimatedMinutes: {
    type: Number,
    required: true,
    default: 30
  }
}, { timestamps: true });

module.exports = mongoose.model('JobMaster', JobMasterSchema);
