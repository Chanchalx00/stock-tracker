const validator = require('validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  issueTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  issuePasswordResetToken,
  consumePasswordResetToken,
  blacklistAccessToken,
  getRefreshTokenExpiryMs,
} = require('../services/token.service');
const { sendPasswordResetEmail } = require('../services/email.service');
const logger = require('../utils/logger');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const MIN_PASSWORD_LENGTH = 8;
const isProduction = process.env.NODE_ENV === 'production';

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: getRefreshTokenExpiryMs(),
  path: '/api/auth',
};

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, avatar: user.avatar || null });

const sendAuthResponse = async (user, statusCode, res, message) => {
  const { accessToken, refreshToken } = await issueTokens(user);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res
    .status(statusCode)
    .json(new ApiResponse(statusCode, message, null, { token: accessToken, user: publicUser(user) }));
};

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'All fields are required.');
  }

  if (typeof name !== 'string' || name.trim().length < 2) {
    throw new ApiError(400, 'Name must be at least 2 characters.', [
      { field: 'name', message: 'Name must be at least 2 characters.' },
    ]);
  }

  if (!validator.isEmail(email)) {
    throw new ApiError(400, 'Please provide a valid email address.', [
      { field: 'email', message: 'Please provide a valid email address.' },
    ]);
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, [
      { field: 'password', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
    ]);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'Email already in use.');
  }

  const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
  await sendAuthResponse(user, 201, res, 'Account created successfully.');
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password required.');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  if (user && !user.password && user.googleId) {
    throw new ApiError(401, 'This account uses Google sign-in. Use "Continue with Google" instead.');
  }

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  await sendAuthResponse(user, 200, res, 'Login successful.');
});

exports.googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new ApiError(400, 'Google credential is required.');
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(500, 'Google sign-in is not configured.');
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Invalid Google credential.');
  }

  if (!payload?.email) {
    throw new ApiError(401, 'Google account has no email.');
  }

  if (!payload.email_verified) {
    throw new ApiError(401, 'Google email is not verified.');
  }

  const normalizedEmail = payload.email.trim().toLowerCase();

  let user = await User.findOne({ googleId: payload.sub });

  if (!user) {
    user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.googleId = payload.sub;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        googleId: payload.sub,
        avatar: payload.picture,
      });
    }
  }

  await sendAuthResponse(user, 200, res, 'Login successful.');
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new ApiError(401, 'Refresh token missing.');
  }

  const { accessToken, refreshToken, user } = await rotateRefreshToken(token);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res
    .status(200)
    .json(new ApiResponse(200, 'Token refreshed.', null, { token: accessToken, user: publicUser(user) }));
});

exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  const accessToken = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (accessToken) {
    blacklistAccessToken(accessToken);
  }

  res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: undefined });
  res.status(200).json(new ApiResponse(200, 'Logged out successfully.'));
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    throw new ApiError(400, 'Please provide a valid email address.');
  }

  const GENERIC_MESSAGE = 'If an account exists for that email, a reset link has been sent.';
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const token = await issuePasswordResetToken(user);
    const primaryOrigin = (process.env.CLIENT_URL || '').split(',')[0].trim();
    const resetUrl = `${primaryOrigin}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      logger.error(`Failed to send password reset email to ${user.email}: ${err.message}`, { tag: 'EMAIL' });
    }
  }

  res.status(200).json(new ApiResponse(200, GENERIC_MESSAGE));
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, [
      { field: 'password', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
    ]);
  }

  const userId = await consumePasswordResetToken(token);
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset link.');
  }

  user.password = password;
  await user.save();

  await revokeAllRefreshTokensForUser(user._id);

  await sendAuthResponse(user, 200, res, 'Password reset successful.');
});

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'Current user fetched.', null, { user: publicUser(req.user) }));
});
