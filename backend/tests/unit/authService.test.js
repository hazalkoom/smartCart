jest.mock('../../src/models/userModel', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../src/utils/generateToken', () => jest.fn());
jest.mock('../../src/workers/queueSetup', () => ({
  emailQueue: { add: jest.fn() },
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const User = require('../../src/models/userModel');
const generateToken = require('../../src/utils/generateToken');
const { emailQueue } = require('../../src/workers/queueSetup');
const jwt = require('jsonwebtoken');

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
      process.env.JWT_SECRET = 'test-secret';

      const createdUser = {
        _id: 'user-id-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'customer',
        isEmailVerified: false,
      };

      User.create.mockResolvedValue(createdUser);
      generateToken.mockReturnValue('token-abc');
      jwt.sign.mockReturnValue('verify-token-123');

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
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user-id-1', purpose: 'email_verification' },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(emailQueue.add).toHaveBeenCalledWith('send-verification', {
        type: 'verification',
        email: 'test@example.com',
        token: 'verify-token-123',
      });
      expect(result).toEqual({
        _id: 'user-id-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'customer',
        isEmailVerified: false,
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
        isEmailVerified: true,
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
        isEmailVerified: true,
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

  describe('verifyEmail', () => {
    it('marks the user as verified for a valid token', async () => {
      process.env.JWT_SECRET = 'verify-secret';
      jwt.verify.mockReturnValue({ id: 'user-id-5', purpose: 'email_verification' });

      const mockUser = {
        _id: 'user-id-5',
        isEmailVerified: false,
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await authService.verifyEmail('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'verify-secret');
      expect(User.findById).toHaveBeenCalledWith('user-id-5');
      expect(mockUser.isEmailVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
      expect(result).toBe(mockUser);
    });

    it('throws when token purpose is invalid', async () => {
      process.env.JWT_SECRET = 'verify-secret';
      jwt.verify.mockReturnValue({ id: 'user-id-6', purpose: 'reset_password' });

      await expect(authService.verifyEmail('wrong-purpose-token')).rejects.toThrow(
        'Invalid or expired verification token'
      );

      expect(User.findById).not.toHaveBeenCalled();
    });

    it('throws when token is invalid or expired', async () => {
      process.env.JWT_SECRET = 'verify-secret';
      jwt.verify.mockImplementation(() => {
        throw new Error('expired');
      });

      await expect(authService.verifyEmail('expired-token')).rejects.toThrow(
        'Invalid or expired verification token'
      );

      expect(User.findById).not.toHaveBeenCalled();
    });
  });

  describe('resendVerification', () => {
    it('queues a new verification email for unverified users', async () => {
      process.env.JWT_SECRET = 'verify-secret';
      const mockUser = {
        _id: 'user-id-7',
        email: 'verify@test.com',
        isEmailVerified: false,
      };

      User.findById.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('verify-token-xyz');

      const result = await authService.resendVerification('user-id-7');

      expect(User.findById).toHaveBeenCalledWith('user-id-7');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user-id-7', purpose: 'email_verification' },
        'verify-secret',
        { expiresIn: '1h' }
      );
      expect(emailQueue.add).toHaveBeenCalledWith('send-verification', {
        type: 'verification',
        email: 'verify@test.com',
        token: 'verify-token-xyz',
      });
      expect(result).toBe(true);
    });

    it('throws when the email is already verified', async () => {
      User.findById.mockResolvedValue({ isEmailVerified: true });

      await expect(authService.resendVerification('user-id-8')).rejects.toThrow(
        'Email is already verified'
      );

      expect(emailQueue.add).not.toHaveBeenCalled();
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
      process.env.FRONTEND_URL = 'http://localhost:4200';
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
      expect(emailQueue.add).toHaveBeenCalledWith('send-reset', {
        type: 'reset-password',
        email: 'reset@test.com',
        resetUrl: 'http://localhost:4200/reset-password/raw-reset-token-123',
      });
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

  describe('Wishlist Logic', () => {
    it('toggleWishlist throws if user is not found', async () => {
      User.findById.mockResolvedValue(null);
      await expect(authService.toggleWishlist('bad-id', 'prod-1')).rejects.toThrow('User not found');
    });

    it('toggleWishlist adds product if it is not in the wishlist', async () => {
      // Mock an array with Mongoose-like push/pull methods
      const mockWishlist = ['prod-other'];
      mockWishlist.pull = jest.fn();
      mockWishlist.push = jest.fn();

      const mockUser = {
        _id: 'user-1',
        wishlist: mockWishlist,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await authService.toggleWishlist('user-1', 'prod-new');

      expect(mockWishlist.push).toHaveBeenCalledWith('prod-new');
      expect(mockWishlist.pull).not.toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toBe(mockWishlist);
    });

    it('toggleWishlist removes product if it is already in the wishlist', async () => {
      const mockWishlist = ['prod-existing'];
      mockWishlist.pull = jest.fn();
      mockWishlist.push = jest.fn();

      const mockUser = {
        _id: 'user-1',
        wishlist: mockWishlist,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      await authService.toggleWishlist('user-1', 'prod-existing');

      expect(mockWishlist.pull).toHaveBeenCalledWith('prod-existing');
      expect(mockWishlist.push).not.toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('getWishlist returns populated wishlist', async () => {
      const mockUser = { wishlist: [{ _id: 'prod-1', name: 'Populated Product' }] };
      const populateMock = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({ populate: populateMock });

      const result = await authService.getWishlist('user-1');

      expect(User.findById).toHaveBeenCalledWith('user-1');
      expect(populateMock).toHaveBeenCalledWith('wishlist');
      expect(result).toEqual(mockUser.wishlist);
    });
  });

  describe('Address Logic', () => {
    it('addAddress adds a new address to the array', async () => {
      const mockAddresses = [];
      mockAddresses.push = jest.fn();

      const mockUser = {
        _id: 'user-1',
        addresses: mockAddresses,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      const newAddress = { street: '123 Test St', isDefault: false };
      await authService.addAddress('user-1', newAddress);

      expect(mockAddresses.push).toHaveBeenCalledWith(newAddress);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('addAddress unsets previous defaults if the new address is default', async () => {
      const oldDefaultAddr = { street: 'Old', isDefault: true };
      const mockAddresses = [oldDefaultAddr];
      mockAddresses.push = jest.fn();

      const mockUser = {
        _id: 'user-1',
        addresses: mockAddresses,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      const newAddress = { street: 'New', isDefault: true };
      await authService.addAddress('user-1', newAddress);

      // The old address should have been mutated to false
      expect(oldDefaultAddr.isDefault).toBe(false);
      expect(mockAddresses.push).toHaveBeenCalledWith(newAddress);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('deleteAddress pulls the address by id', async () => {
      const mockAddresses = [];
      mockAddresses.pull = jest.fn();

      const mockUser = {
        _id: 'user-1',
        addresses: mockAddresses,
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      await authService.deleteAddress('user-1', 'addr-123');

      expect(mockAddresses.pull).toHaveBeenCalledWith({ _id: 'addr-123' });
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
