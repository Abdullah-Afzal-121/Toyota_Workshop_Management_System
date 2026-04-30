const mongoose = require('mongoose');

const BaySchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, unique: true, trim: true },
    description:  { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bay', BaySchema);
