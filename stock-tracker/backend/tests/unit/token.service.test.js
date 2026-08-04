const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const {
  issueTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  blacklistAccessToken,
  isAccessTokenBlacklisted,
} = require('../../src/services/token.service');

const makeUser = () =>
  User.create({ name: 'Grace Hopper', email: `grace-${Date.now()}@example.com`, password: 'a-real-password' });

describe('token.service', () => {
  it('issueTokens signs an access token carrying the user id and a jti', async () => {
    const user = await makeUser();
    const { accessToken, refreshToken } = await issueTokens(user);

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    expect(decoded.id).toBe(String(user._id));
    expect(decoded.jti).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));

    const stored = await RefreshToken.findOne({ userId: user._id });
    expect(stored).not.toBeNull();
    expect(stored.tokenHash).not.toBe(refreshToken); // never stored raw
  });

  it('rotateRefreshToken consumes the old token and issues a new pair', async () => {
    const user = await makeUser();
    const { refreshToken } = await issueTokens(user);

    const rotated = await rotateRefreshToken(refreshToken);
    expect(rotated.refreshToken).not.toBe(refreshToken);
    expect(String(rotated.user._id)).toBe(String(user._id));

    // The old token is dead — reusing it is exactly the "stolen refresh
    // token replayed" scenario rotation exists to catch.
    await expect(rotateRefreshToken(refreshToken)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rotateRefreshToken rejects an unknown token with 403', async () => {
    await expect(rotateRefreshToken('not-a-real-token')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('revokeRefreshToken deletes the stored hash so it can no longer rotate', async () => {
    const user = await makeUser();
    const { refreshToken } = await issueTokens(user);

    await revokeRefreshToken(refreshToken);

    await expect(rotateRefreshToken(refreshToken)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('blacklistAccessToken makes isAccessTokenBlacklisted true for that token\'s jti', async () => {
    const user = await makeUser();
    const { accessToken } = await issueTokens(user);
    const { jti } = jwt.decode(accessToken);

    expect(isAccessTokenBlacklisted(jti)).toBe(false);
    blacklistAccessToken(accessToken);
    expect(isAccessTokenBlacklisted(jti)).toBe(true);
  });
});
