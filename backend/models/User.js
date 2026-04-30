const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name:              { type: String, required: true, trim: true },
    email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    role:              { type: String, enum: ['admin', 'advisor', 'job_controller', 'mechanic', 'customer'], default: 'customer' },
    password:          { type: String, required: false }, // optional for Google-only accounts
    googleId:          { type: String, default: null },
    resetToken:        { type: String, default: null },
    resetTokenExpiry:  { type: Date,   default: null },
    avatar:            { type: String, default: null }, // base64 data URL
    isActive:          { type: Boolean, default: true },
    bayName:           { type: String, default: null }, // for mechanics
    specialization:    { type: String, default: null }, // for mechanics
  },
  { timestamps: true }
);

// Hash password before saving
// NOTE: Mongoose 6+ async hooks do NOT receive `next` – just return/await
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare plain password against hash
UserSchema.methods.comparePassword = function (plain) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);
