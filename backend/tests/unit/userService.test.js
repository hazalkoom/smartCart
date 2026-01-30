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
      const ownerId = 'owner-id-1';

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
      User.findById.mockResolvedValue({
        _id: { toString: () => 'some-user' },
        role: 'owner',
      });

      await expect(userService.updateUserRole('some-user', 'admin', 'owner-id')).rejects.toEqual({
        statusCode: 400,
        message: 'Cannot change the role of the Owner',
      });
    });
  });

  describe('getUserById', () => {
    it("calls select('-password') to exclude the password field", async () => {
      const selectMock = jest.fn().mockResolvedValue({ _id: 'u1', email: 'a@b.com' });
      User.findById.mockReturnValue({ select: selectMock });

      const result = await userService.getUserById('u1');

      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(selectMock).toHaveBeenCalledWith('-password');
      expect(result).toEqual({ _id: 'u1', email: 'a@b.com' });
    });

    it('throws 404 when user is not found', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({ select: selectMock });

      await expect(userService.getUserById('missing')).rejects.toEqual({
        statusCode: 404,
        message: 'User not found',
      });
    });
  });
});
