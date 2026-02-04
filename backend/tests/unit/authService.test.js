jest.mock('../../src/models/userModel', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../src/utils/generateToken', () => jest.fn());

const User = require('../../src/models/userModel');
const generateToken = require('../../src/utils/generateToken');

const authService = require('../../src/services/authService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('throws when registering with a duplicate email', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(
        authService.registerUser({
          email: 'dup@test.com',
          password: 'password123',
          firstName: 'A',
          lastName: 'B',
        })
      ).rejects.toThrow('User already exists');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'dup@test.com' });
      expect(User.create).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('creates a user and returns an auth payload with token', async () => {
      User.findOne.mockResolvedValue(null);

      const createdUser = {
        _id: 'user-id-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'customer',
      };

      User.create.mockResolvedValue(createdUser);
      generateToken.mockReturnValue('token-abc');

      const result = await authService.registerUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '01000000000',
      });

      expect(User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '01000000000',
      });

      expect(generateToken).toHaveBeenCalledWith('user-id-1');
      expect(result).toEqual({
        _id: 'user-id-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'customer',
        token: 'token-abc',
      });
    });
  });

  describe('loginUser', () => {
    it('calls matchPassword (bcrypt compare lives under user model) and returns token for the user id', async () => {
      const user = {
        _id: 'user-id-2',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'customer',
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      const selectMock = jest.fn().mockResolvedValue(user);
      User.findOne.mockReturnValue({ select: selectMock });

      generateToken.mockReturnValue('token-xyz');

      const result = await authService.loginUser('jane@example.com', 'secret');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'jane@example.com' });
      expect(selectMock).toHaveBeenCalledWith('+password');
      expect(user.matchPassword).toHaveBeenCalledWith('secret');
      expect(generateToken).toHaveBeenCalledWith('user-id-2');

      expect(result).toEqual({
        _id: 'user-id-2',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'customer',
        token: 'token-xyz',
      });
    });

    it('throws Invalid credentials when user is not found', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      User.findOne.mockReturnValue({ select: selectMock });

      await expect(authService.loginUser('missing@example.com', 'x')).rejects.toThrow(
        'Invalid credentials'
      );

      expect(generateToken).not.toHaveBeenCalled();
    });

    it('throws Invalid credentials when password does not match', async () => {
      const user = {
        _id: 'user-id-3',
        matchPassword: jest.fn().mockResolvedValue(false),
      };

      const selectMock = jest.fn().mockResolvedValue(user);
      User.findOne.mockReturnValue({ select: selectMock });

      await expect(authService.loginUser('a@b.com', 'wrong')).rejects.toThrow(
        'Invalid credentials'
      );

      expect(user.matchPassword).toHaveBeenCalledWith('wrong');
      expect(generateToken).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('throws error when email is not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.forgotPassword('nonexistent@test.com')).rejects.toThrow(
        'There is no user with that email'
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@test.com' });
    });

    it('generates reset token, saves user, and returns raw token', async () => {
      const mockUser = {
        _id: 'user-id-reset',
        email: 'reset@test.com',
        getResetPasswordToken: jest.fn().mockReturnValue('raw-reset-token-123'),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.forgotPassword('reset@test.com');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'reset@test.com' });
      expect(mockUser.getResetPasswordToken).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
      expect(result).toBe('raw-reset-token-123');
    });
  });

  describe('resetPassword', () => {
    it('throws error for invalid or expired token', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.resetPassword('invalid-token', 'newpass123')).rejects.toThrow(
        'Invalid token or token has expired'
      );

      // Verify it searched with hashed token and expiry check
      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordToken: expect.any(String),
        resetPasswordExpire: { $gt: expect.any(Number) },
      });
    });

    it('updates password and clears reset fields on valid token', async () => {
      const mockUser = {
        _id: 'user-id-4',
        password: 'old-hashed-password',
        resetPasswordToken: 'hashed-token',
        resetPasswordExpire: Date.now() + 600000,
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.resetPassword('valid-raw-token', 'newSecurePass123');

      expect(mockUser.password).toBe('newSecurePass123');
      expect(mockUser.resetPasswordToken).toBeUndefined();
      expect(mockUser.resetPasswordExpire).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it('hashes the incoming token with SHA256 before searching', async () => {
      const crypto = require('crypto');
      const testToken = 'my-test-token';
      const expectedHash = crypto.createHash('sha256').update(testToken).digest('hex');

      User.findOne.mockResolvedValue(null);

      try {
        await authService.resetPassword(testToken, 'anypass');
      } catch (e) {
        // Expected to throw
      }

      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordToken: expectedHash,
        resetPasswordExpire: { $gt: expect.any(Number) },
      });
    });
  });
});
