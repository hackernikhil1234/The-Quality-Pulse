const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default:'' },
  countryCode: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Engineer'], default: 'Engineer' },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  deactivationInfo: {
      reason: String,
      deactivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      deactivatedByName: String,
      deactivatedAt: Date
    },
    activationInfo: {
      activatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      activatedByName: String,
      activatedAt: Date
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  }, { timestamps: true });

module.exports = mongoose.model('User', userSchema);