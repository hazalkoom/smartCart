const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const crypto = require('crypto');

class AuthService {
  async registerUser(userData) {
    const { email, password, firstName, lastName, phone } = userData;
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error("User already exists");
    }
    const user = await User.create({ email, password, firstName, lastName, phone });
    const token = generateToken(user._id);
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: token,
    };
  }

  async loginUser(email, password) {
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid credentials");

    const isMatch = await user.matchPassword(password);
    if (!isMatch) throw new Error("Invalid credentials");

    const token = generateToken(user._id);
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: token,
    };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('There is no user with that email');
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    return resetToken;
  }

  async resetPassword(token, newPassword) {
    // 1. Hash the incoming token to compare with DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 2. Find user with this token AND ensure it is not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error('Invalid token or token has expired');
    }

    // 3. Update password and clear token fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return user;
  }

  async getUserById(userId) {
    const user = await User.findById(userId);
    return user;
  }

   async updateUserDetail(userId, updatedData) {
    const { firstName, lastName } = updatedData;
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName },
      { new: true, runValidators: true }
    );
    if (!user) throw new Error('User not found');
    return user;
  }
}

module.exports = new AuthService();