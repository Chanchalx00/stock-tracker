const mongoose = require('mongoose');

// Refresh tokens are never stored raw — only a SHA-256 hash, so a database
// leak alone can't be used to impersonate a session (same reasoning as
// storing password hashes instead of passwords).
const refreshTokenSchema = new mongoose.Schema({
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

// MongoDB TTL index — expired tokens are automatically deleted, so the
// collection doesn't grow unbounded with stale sessions.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
