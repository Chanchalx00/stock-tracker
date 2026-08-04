const request = require('supertest');
const { app } = require('../../src/app');
const User = require('../../src/models/User');

const validSignup = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'correct-horse-battery',
};

describe('POST /api/auth/signup', () => {
  it('creates an account and returns a token + user without the password', async () => {
    const res = await request(app).post('/api/auth/signup').send(validSignup);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: validSignup.name, email: validSignup.email });
    expect(res.body.user.password).toBeUndefined();

    const stored = await User.findOne({ email: validSignup.email }).select('+password');
    expect(stored.password).not.toBe(validSignup.password); // hashed, not plaintext
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/signup').send(validSignup);
    const res = await request(app).post('/api/auth/signup').send(validSignup);

    expect(res.status).toBe(409);
  });

  it('rejects a password shorter than the minimum with 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validSignup, email: 'short@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('sets an httpOnly refreshToken cookie', async () => {
    const res = await request(app).post('/api/auth/signup').send(validSignup);
    const cookies = res.headers['set-cookie'] || [];

    expect(cookies.some((c) => c.startsWith('refreshToken=') && /HttpOnly/i.test(c))).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(validSignup);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validSignup.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with 401 (not 404 — don\'t leak account existence)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever12345' });

    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validSignup.email, password: validSignup.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });
});

describe('GET /api/auth/me', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage bearer token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const signup = await request(app).post('/api/auth/signup').send(validSignup);
    const token = signup.body.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validSignup.email);
  });
});

describe('POST /api/auth/google', () => {
  it('rejects a missing credential with 400', async () => {
    const res = await request(app).post('/api/auth/google').send({});
    expect(res.status).toBe(400);
  });

  it('rejects a malformed credential with 401 (never trusts an unverified token)', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: 'not-a-jwt' });
    expect(res.status).toBe(401);
  });
});
