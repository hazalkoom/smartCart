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
});
