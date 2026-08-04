const request = require('supertest');

// Mocked before anything requires it (Jest hoists this above the
// requires below) — the controller destructures sendPasswordResetEmail
// at import time, so spying on the real module's property afterwards
// wouldn't reach that already-bound reference; a full module mock does.
jest.mock('../../src/services/email.service');

const { app } = require('../../src/app');
const User = require('../../src/models/User');
const PasswordResetToken = require('../../src/models/PasswordResetToken');
const { sendPasswordResetEmail } = require('../../src/services/email.service');

const signupPayload = {
  name: 'Marie Curie',
  email: 'marie@example.com',
  password: 'original-password',
};

const extractTokenFromUrl = (url) => new URL(url).searchParams.get('token');

describe('POST /api/auth/forgot-password', () => {
  it('responds with the same generic message for an unknown email (no account-existence leak)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account exists/i);
  });

  it('rejects a malformed email with 400', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('issues a reset token for a known email, with the same generic response', async () => {
    await request(app).post('/api/auth/signup').send(signupPayload);

    const res = await request(app).post('/api/auth/forgot-password').send({ email: signupPayload.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account exists/i);

    const user = await User.findOne({ email: signupPayload.email });
    const stored = await PasswordResetToken.findOne({ userId: user._id });
    expect(stored).not.toBeNull();
  });
});

describe('POST /api/auth/reset-password', () => {
  it('rejects an invalid token with 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'a-new-password' });

    expect(res.status).toBe(400);
  });

  it('rejects a password shorter than the minimum with 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'whatever', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('completes the full flow: reset, sign in with the new password, old password stops working, other sessions are revoked', async () => {
    sendPasswordResetEmail.mockClear();
    sendPasswordResetEmail.mockResolvedValue(undefined);

    await request(app).post('/api/auth/signup').send(signupPayload);
    // A second login before the reset, to prove its session gets revoked too.
    const otherSessionLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: signupPayload.email, password: signupPayload.password });
    const otherSessionCookie = otherSessionLogin.headers['set-cookie'][0];

    await request(app).post('/api/auth/forgot-password').send({ email: signupPayload.email });

    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const resetUrl = sendPasswordResetEmail.mock.calls[0][1];
    const token = extractTokenFromUrl(resetUrl);
    expect(token).toEqual(expect.any(String));

    const newPassword = 'brand-new-password';
    const resetRes = await request(app).post('/api/auth/reset-password').send({ token, password: newPassword });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.token).toEqual(expect.any(String));

    // The token is single-use.
    const reuseRes = await request(app).post('/api/auth/reset-password').send({ token, password: 'irrelevant123' });
    expect(reuseRes.status).toBe(400);

    // Old password no longer works.
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: signupPayload.email, password: signupPayload.password });
    expect(oldLoginRes.status).toBe(401);

    // New password works.
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: signupPayload.email, password: newPassword });
    expect(newLoginRes.status).toBe(200);

    // The refresh cookie from before the reset is dead — every other
    // session was revoked, not just replaced.
    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', otherSessionCookie);
    expect(refreshRes.status).toBe(403);
  });
});
