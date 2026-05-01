const { requireEmailVerification } = require('../../src/middleware/authMiddleware');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  return res;
};

describe('requireEmailVerification middleware', () => {
  it('returns 401 when user is missing', async () => {
    const req = { user: null };
    const res = makeRes();
    const next = jest.fn();

    await requireEmailVerification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns 403 when user is not verified', async () => {
    const req = { user: { role: 'customer', isEmailVerified: false } };
    const res = makeRes();
    const next = jest.fn();

    await requireEmailVerification(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('calls next when user is verified', async () => {
    const req = { user: { role: 'customer', isEmailVerified: true } };
    const res = makeRes();
    const next = jest.fn();

    await requireEmailVerification(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next for admin or owner even if unverified', async () => {
    const res = makeRes();
    const next = jest.fn();

    await requireEmailVerification({ user: { role: 'admin', isEmailVerified: false } }, res, next);
    await requireEmailVerification({ user: { role: 'owner', isEmailVerified: false } }, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(2);
  });
});
