jest.mock('../../src/models/userModel', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
}));

const User = require('../../src/models/userModel');
const userService = require('../../src/services/userService');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserRole', () => {
    it('throws 400 when id === currentOwnerId (owner cannot change their own role here)', async () => {
      const ownerId = '507f1f77bcf86cd799439011';

      User.findById.mockResolvedValue({
        _id: { toString: () => ownerId },
        role: 'admin',
        save: jest.fn(),
      });

      await expect(userService.updateUserRole(ownerId, 'admin', ownerId)).rejects.toEqual({
        statusCode: 400,
        message: 'You cannot change your own role here',
      });

      expect(User.findById).toHaveBeenCalledWith(ownerId);
    });

    it('throws 400 when trying to change the role of the Owner account', async () => {
      const targetUserId = '507f1f77bcf86cd799439012';
      const ownerId = '507f1f77bcf86cd799439013';

      User.findById.mockResolvedValue({
        _id: { toString: () => targetUserId },
        role: 'owner',
      });

      await expect(userService.updateUserRole(targetUserId, 'admin', ownerId)).rejects.toEqual({
        statusCode: 400,
        message: 'Cannot change the role of the Owner',
      });
    });
  });

  describe('getUserById', () => {
    it("calls select('-password') to exclude the password field", async () => {
      const userId = '507f1f77bcf86cd799439014';
      const selectMock = jest.fn().mockResolvedValue({ _id: userId, email: 'a@b.com' });
      User.findById.mockReturnValue({ select: selectMock });

      const result = await userService.getUserById(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual({ _id: userId, email: 'a@b.com' });
    });

    it('throws 404 when user is not found', async () => {
      const missingUserId = '507f1f77bcf86cd799439015';
      const selectMock = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({ select: selectMock });

      await expect(userService.getUserById(missingUserId)).rejects.toEqual({
        statusCode: 404,
        message: 'User not found',
      });
    });
  });
});
