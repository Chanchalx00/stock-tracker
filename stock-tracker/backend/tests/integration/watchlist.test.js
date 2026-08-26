const request = require('supertest');
const { app } = require('../../src/app');

const account = {
  name: 'Grace Hopper',
  email: 'grace@example.com',
  password: 'correct-horse-battery',
};

const signIn = async () => {
  const res = await request(app).post('/api/auth/signup').send(account);
  return res.body.token;
};

describe('POST /api/watchlist', () => {
  it('adds a symbol and normalizes it to uppercase', async () => {
    const token = await signIn();

    const res = await request(app)
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'reliance.ns', companyName: 'Reliance Industries' });

    expect(res.status).toBe(201);
    expect(res.body.data.symbol).toBe('RELIANCE.NS');
  });

  it('accepts a full-length NSE ticker', async () => {
    const token = await signIn();

    const res = await request(app)
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'BHARTIARTL.NS' });

    expect(res.status).toBe(201);
    expect(res.body.data.symbol).toBe('BHARTIARTL.NS');
  });

  it('rejects a non-string symbol with 400, not 500', async () => {
    const token = await signIn();

    const res = await request(app)
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 12345 });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate with 409', async () => {
    const token = await signIn();
    const add = () =>
      request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'TCS.NS' });

    await add();
    const res = await add();

    expect(res.status).toBe(409);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/watchlist').send({ symbol: 'TCS.NS' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/watchlist/:symbol', () => {
  it('removes a symbol that is present', async () => {
    const token = await signIn();
    await request(app)
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'TCS.NS' });

    const res = await request(app)
      .delete('/api/watchlist/TCS.NS')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('404s when the symbol is not in the watchlist', async () => {
    const token = await signIn();

    const res = await request(app)
      .delete('/api/watchlist/NOTHERE.NS')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("cannot delete another user's entry", async () => {
    const ownerToken = await signIn();
    await request(app)
      .post('/api/watchlist')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ symbol: 'TCS.NS' });

    const outsider = await request(app)
      .post('/api/auth/signup')
      .send({ ...account, email: 'someone-else@example.com' });

    const res = await request(app)
      .delete('/api/watchlist/TCS.NS')
      .set('Authorization', `Bearer ${outsider.body.token}`);

    expect(res.status).toBe(404);
  });
});
