const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  googleLogin,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Signup, login, and the current session.
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Create a new account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "John Doe" }
 *               email: { type: string, format: email, example: "john@example.com" }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       201:
 *         description: Account created, returns a JWT and the user.
 *       400:
 *         description: Validation failed (bad email, weak password, etc).
 *       409:
 *         description: Email already in use.
 */
router.post('/signup', signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Logged in, returns a JWT and the user.
 *       401:
 *         description: Invalid credentials.
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Log in or sign up with a Google ID token
 *     description: Verifies the ID token returned by Google's Sign In With Google button. Creates a new account on first use, or links to an existing email/password account with the same email.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credential]
 *             properties:
 *               credential: { type: string, description: "Google ID token (JWT) from the GIS client." }
 *     responses:
 *       200:
 *         description: Logged in, returns a JWT and the user.
 *       401:
 *         description: Invalid, unverified, or unverifiable Google credential.
 */
router.post('/google', googleLogin);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Exchange the httpOnly refresh-token cookie for a new access token
 *     description: Reads the refresh token from the httpOnly cookie (not the body). Used on page load to silently restore a session, and by the frontend's axios interceptor after a 401.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: New access token and user, rotates the refresh cookie.
 *       401:
 *         description: Refresh cookie missing.
 *       403:
 *         description: Refresh token invalid, expired, or already used.
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     description: Always responds 200 with a generic message, whether or not the email has an account — the response never reveals account existence. If it does, an email with a one-hour reset link is sent (or, without SMTP configured, logged server-side for local dev).
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Generic confirmation message.
 *       400:
 *         description: Missing or malformed email.
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Redeem a reset token and set a new password
 *     description: Signs the user in on this device and revokes every other active session (all other devices are logged out).
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string, description: "Token from the emailed reset link." }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset, returns a JWT and the user.
 *       400:
 *         description: Invalid/expired token, or the new password fails validation.
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out — revokes the refresh token and blacklists the access token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Logged out.
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: The current user.
 *       401:
 *         description: Missing, invalid, or expired token.
 */
router.get('/me', protect, getMe);

module.exports = router;
