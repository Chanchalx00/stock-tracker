const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');

const blacklistedTokens = new Map();

const pruneBlacklist = () => {
  const now = Date.now();
  for (const [jti, expiresAt] of blacklistedTokens) {
    if (expiresAt <= now) blacklistedTokens.delete(jti);
  }
};
setInterval(pruneBlacklist, 5 * 60 * 1000).unref();

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, 'JWT secret is not configured.');
  }
  return process.env.JWT_SECRET;
};

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getRefreshTokenExpiryDays = () => parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS, 10) || 30;
const getRefreshTokenExpiryMs = () => getRefreshTokenExpiryDays() * 24 * 60 * 60 * 1000;


const issueTokens = async (user) => {
  const jti = crypto.randomUUID();
  const accessToken = jwt.sign(
    { id: user._id, jti },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' },
  );

  const refreshToken = generateRefreshToken();
  await RefreshToken.create({
    tokenHash: hashToken(refreshToken),
    userId: user._id,
    expiresAt: new Date(Date.now() + getRefreshTokenExpiryMs()),
  });

  return { accessToken, refreshToken };
};

const rotateRefreshToken = async (refreshToken) => {
  const normalized = typeof refreshToken === 'string' ? refreshToken.trim() : '';
  if (!normalized) throw new ApiError(401, 'Refresh token missing.');

  const hashed = hashToken(normalized);
  const stored = await RefreshToken.findOne({ tokenHash: hashed }).populate('userId');

  if (!stored) throw new ApiError(403, 'Invalid refresh token.');

  if (stored.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: stored._id });
    throw new ApiError(403, 'Refresh token expired.');
  }

  const user = stored.userId;
  await RefreshToken.deleteOne({ _id: stored._id });

  if (!user) {
    throw new ApiError(403, 'User no longer exists.');
  }

  const tokens = await issueTokens(user);
  return { ...tokens, user };
};

const blacklistAccessToken = (accessToken) => {
  try {
    const decoded = jwt.verify(accessToken, getJwtSecret(), { algorithms: ['HS256'] });
    if (decoded.jti && decoded.exp) {
      blacklistedTokens.set(decoded.jti, decoded.exp * 1000);
    }
  } catch (err) {
    // Already invalid/expired — nothing meaningful to blacklist.
    logger.debug(`Skipped blacklisting an already-invalid token: ${err.message}`, { tag: 'AUTH' });
  }
};

const isAccessTokenBlacklisted = (jti) => blacklistedTokens.has(jti);

const revokeRefreshToken = async (refreshToken) => {
  const normalized = typeof refreshToken === 'string' ? refreshToken.trim() : '';
  if (!normalized) return;
  await RefreshToken.deleteOne({ tokenHash: hashToken(normalized) });
};

const revokeAllRefreshTokensForUser = async (userId) => {
  await RefreshToken.deleteMany({ userId });
};

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const issuePasswordResetToken = async (user) => {
  const token = generateRefreshToken();
  await PasswordResetToken.deleteMany({ userId: user._id }); // invalidate any earlier request
  await PasswordResetToken.create({
    tokenHash: hashToken(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
  });
  return token;
};

const consumePasswordResetToken = async (token) => {
  const normalized = typeof token === 'string' ? token.trim() : '';
  if (!normalized) throw new ApiError(400, 'Reset token missing.');

  const hashed = hashToken(normalized);
  const stored = await PasswordResetToken.findOne({ tokenHash: hashed });

  if (!stored) throw new ApiError(400, 'Invalid or expired reset link.');

  await PasswordResetToken.deleteOne({ _id: stored._id });

  if (stored.expiresAt < new Date()) {
    throw new ApiError(400, 'Invalid or expired reset link.');
  }

  return stored.userId;
};

module.exports = {
  issueTokens,
  rotateRefreshToken,
  blacklistAccessToken,
  isAccessTokenBlacklisted,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  issuePasswordResetToken,
  consumePasswordResetToken,
  getRefreshTokenExpiryMs,
};
