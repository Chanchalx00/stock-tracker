const request = require('supertest');
const { app } = require('../../src/app');

describe('GET /health', () => {
  it('reports 200 and mongo:up when the database is reachable', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.mongo).toBe('up');
  });
});

describe('404 handler', () => {
  it('returns a JSON 404 for an unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
