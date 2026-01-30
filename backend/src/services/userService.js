const User = require('../models/userModel');

class UserService {
  // UPGRADED: Added Pagination
  async getAllUsers(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await User.countDocuments();
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      users,
      count,
      page,
      pages: Math.ceil(count / limit)
    };
  }

  async getUserById(id) {
    const user = await User.findById(id).select('-password');
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  }

  async updateUserRole(id, role, currentOwnerId) {
    const user = await User.findById(id);

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    // SAFETY: Prevent changing the Owner's role
    if (user.role === 'owner') {
      throw { statusCode: 400, message: 'Cannot change the role of the Owner' };
    }

    if (user._id.toString() === currentOwnerId.toString()) {
      throw { statusCode: 400, message: 'You cannot change your own role here' };
    }

    user.role = role;
    return await user.save();
  }

  async deleteUser(id, currentOwnerId) {
    const user = await User.findById(id);

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    // SAFETY: Owner cannot delete themselves
    if (user._id.toString() === currentOwnerId.toString()) {
      throw { statusCode: 400, message: 'You cannot delete yourself' };
    }

    if (user.role === 'owner') {
      throw { statusCode: 400, message: 'Cannot delete the Owner account' };
    }

    await user.deleteOne();
    return { message: 'User removed successfully' };
  }
}

module.exports = new UserService();