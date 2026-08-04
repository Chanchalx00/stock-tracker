const { validateEnv } = require('../../src/config/validateEnv');

describe('validateEnv', () => {
  const ORIGINAL_ENV = { ...process.env };
  let exitSpy;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    exitSpy.mockRestore();
  });

  it('does not exit when all required vars are present and JWT_SECRET is long enough', () => {
    validateEnv();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits the process when a required var is missing', () => {
    delete process.env.MONGO_URI;
    validateEnv();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits the process when JWT_SECRET is present but too short', () => {
    process.env.JWT_SECRET = 'too-short';
    validateEnv();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
