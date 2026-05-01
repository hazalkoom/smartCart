jest.mock('../../src/services/authService', () => ({
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
}));

const AuthService = require('../../src/services/authService');
const { verifyEmail, resendVerification } = require('../../src/controllers/authController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyEmail', () => {
    it('returns 200 on successful verification', async () => {
      AuthService.verifyEmail.mockResolvedValue(true);

      const req = { params: { token: 'valid-token' } };
      const res = makeRes();
      const next = jest.fn();

      await verifyEmail(req, res, next);

      expect(AuthService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Email verified successfully. You now have full access.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when token is missing', async () => {
      const req = { params: {} };
      const res = makeRes();
      const next = jest.fn();

      await verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('returns 400 when verification fails', async () => {
      AuthService.verifyEmail.mockRejectedValue(new Error('Invalid or expired verification token'));

      const req = { params: { token: 'bad-token' } };
      const res = makeRes();
      const next = jest.fn();

      await verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('resendVerification', () => {
    it('returns 200 when resend is queued', async () => {
      AuthService.resendVerification.mockResolvedValue(true);

      const req = { user: { id: 'user-1' } };
      const res = makeRes();
      const next = jest.fn();

      await resendVerification(req, res, next);

      expect(AuthService.resendVerification).toHaveBeenCalledWith('user-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Verification email resent. Please check your inbox.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when resend fails', async () => {
      AuthService.resendVerification.mockRejectedValue(new Error('Email is already verified'));

      const req = { user: { id: 'user-1' } };
      const res = makeRes();
      const next = jest.fn();

      await resendVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
