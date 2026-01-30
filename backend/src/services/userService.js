const User = require('../models/userModel');

class UserService {
  // Get all users (sorted by newest)
  async getAllUsers() {
    return await User.find({}).select('-password').sort({ createdAt: -1 });
  }

  // Get single user
  async getUserById(id) {
    const user = await User.findById(id).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Promote / Demote / Update User
  async updateUserRole(id, role, currentOwnerId) {
    const user = await User.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    // SAFETY: Prevent changing the Owner's role
    if (user.role === 'owner') {
      throw new Error('Cannot change the role of the Owner');
    }

    // SAFETY: Prevent Owner from demoting themselves (redundant but safe)
    if (user._id.toString() === currentOwnerId.toString()) {
      throw new Error('You cannot change your own role here');
    }

    user.role = role;
    return await user.save();
  }

  // Ban (Delete) User
  async deleteUser(id, currentOwnerId) {
    const user = await User.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    // SAFETY: Owner cannot delete themselves
    if (user._id.toString() === currentOwnerId.toString()) {
      throw new Error('You cannot delete yourself');
    }

    // SAFETY: Cannot delete the main Owner account
    if (user.role === 'owner') {
      throw new Error('Cannot delete the Owner account');
    }

    await user.deleteOne();
    return { message: 'User removed successfully' };
  }
}

module.exports = new UserService();