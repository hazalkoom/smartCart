const mongoose = require('mongoose');
const User = require('../models/userModel');

class UserService {
  async createUser(userData, currentOwnerId) {
    const { email, password, firstName, lastName, role } = userData;

    if (typeof email !== 'string') {
      throw { statusCode: 400, message: 'Invalid email format' };
    }

    const existing = await User.findOne({ email: { $eq: email } });
    if (existing) {
      throw { statusCode: 400, message: 'User already exists' };
    }

    if (role === 'owner') {
      throw { statusCode: 400, message: 'Cannot create an Owner account' };
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'customer'
    });

    const safeUser = user.toObject();
    delete safeUser.password;
    return safeUser;
  }

  // UPGRADED: Added Pagination
  async getAllUsers(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};

    if (query.role) {
      const roles = query.role
        .split(',')
        .map(role => role.trim())
        .filter(role => role.length > 0);

      if (roles.length > 0) {
        filter.role = { $in: roles };
      }
    }

    const count = await User.countDocuments(filter);
    const users = await User.find(filter)
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid user ID' };
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return user;
  }

  async updateUserRole(id, role, currentOwnerId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid user ID' };
    }

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

  async updateUser(id, userData, currentOwnerId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid user ID' };
    }

    const { email, firstName, lastName, role, password } = userData;
    const user = await User.findById(id).select('+password');

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    // Prevent updating other owner accounts
    if (user.role === 'owner' && user._id.toString() !== currentOwnerId.toString()) {
      throw { statusCode: 400, message: 'Cannot update the Owner account' };
    }

    // Prevent owner from changing their own role
    if (
      user.role === 'owner' &&
      user._id.toString() === currentOwnerId.toString() &&
      role &&
      role !== 'owner'
    ) {
      throw { statusCode: 400, message: 'Owner cannot change their own role' };
    }

    // Prevent assigning owner role
    if (role === 'owner') {
      throw { statusCode: 400, message: 'Cannot assign Owner role' };
    }

    if (email) {
      if (typeof email !== 'string') {
        throw { statusCode: 400, message: 'Invalid email format' };
      }

      const existing = await User.findOne({
        email: { $eq: email },
        _id: { $ne: id }
      });

      if (existing) {
        throw { statusCode: 400, message: 'Email already in use' };
      }

      user.email = email;
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (role) user.role = role;
    if (password) user.password = password;

    const updatedUser = await user.save();
    const safeUser = updatedUser.toObject();
    delete safeUser.password;

    return safeUser;
  }

  async deleteUser(id, currentOwnerId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw { statusCode: 400, message: 'Invalid user ID' };
    }

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