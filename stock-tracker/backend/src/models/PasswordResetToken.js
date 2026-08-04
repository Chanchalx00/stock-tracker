const mongoose = require('mongoose');

// Same reasoning as RefreshToken — never store the raw token, only its
// hash, so a database leak alone can't be used to reset someone's
// password. Single-use: deleted the moment it's redeemed.
const passwordResetTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// MongoDB TTL index — an unused reset token disappears on its own once expired.
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
