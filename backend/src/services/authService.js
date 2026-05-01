const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // Needed for custom verification tokens
const { emailQueue } = require('../workers/queueSetup'); // Import your Redis queue!

class AuthService {
  async registerUser(userData) {
    const { email, password, firstName, lastName, phone } = userData;
    const userExists = await User.findOne({ email: String(email) });
    if (userExists) {
      throw new Error("User already exists");
    }
    const user = await User.create({ email, password, firstName, lastName, phone });
    const token = generateToken(user._id);

    // ---> THE UPGRADE: Generate a 1-hour verification token & queue the email <---
    const verificationToken = jwt.sign(
      { id: user._id, purpose: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Throw the job into Redis. DO NOT await the email sending!
    await emailQueue.add('send-verification', {
      type: 'verification',
      email: user.email,
      token: verificationToken
    });

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified, // Let frontend know they are unverified
      token: token,
    };
  }

  async loginUser(email, password) {
    const user = await User.findOne({ email: String(email) }).select("+password");
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
      isEmailVerified: user.isEmailVerified, // Must send this to frontend on login
      token: token,
    };
  }

  // ---> NEW: Verify the stateless JWT <---
  async verifyEmail(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.purpose !== 'email_verification') {
        throw new Error('Invalid token purpose');
      }

      const user = await User.findById(decoded.id);
      if (!user) throw new Error('User not found');
      if (user.isEmailVerified) throw new Error('Email is already verified');

      // Flip the switch in the database
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });

      return user;
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }

  // ---> NEW: Resend the verification email <---
  async resendVerification(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.isEmailVerified) throw new Error('Email is already verified');

    const verificationToken = jwt.sign(
      { id: user._id, purpose: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await emailQueue.add('send-verification', {
      type: 'verification',
      email: user.email,
      token: verificationToken
    });

    return true;
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email: String(email) });
    if (!user) {
      throw new Error('There is no user with that email');
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // ---> THE FIX: URL must point to your Angular Frontend! <---
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    // Throw the reset job into Redis
    await emailQueue.add('send-reset', {
      type: 'reset-password',
      email: user.email,
      resetUrl: resetUrl
    });

    return resetToken;
  }

  async resetPassword(token, newPassword) {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: String(resetPasswordToken),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error('Invalid token or token has expired');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return user;
  }

  async getUserById(userId) {
    return await User.findById(String(userId));
  }

  async updateUserDetail(userId, updatedData) {
    const { firstName, lastName } = updatedData;
    const user = await User.findByIdAndUpdate(
      String(userId),
      { 
        firstName: firstName ? String(firstName) : undefined, 
        lastName: lastName ? String(lastName) : undefined 
      },
      { new: true, runValidators: true }
    );
    if (!user) throw new Error('User not found');
    return user;
  }

  async toggleWishlist(userId, productId) {
    const user = await User.findById(String(userId));
    if (!user) throw new Error('User not found');
    
    const isLiked = user.wishlist.some(id => id.toString() === productId.toString());
    if (isLiked) {
      user.wishlist.pull(productId);
    } else {
      user.wishlist.push(productId);
    }
    await user.save();
    return user.wishlist;
  }

  async getWishlist(userId) {
    const user = await User.findById(String(userId)).populate('wishlist');
    if (!user) throw new Error('User not found');
    return user.wishlist;
  }

  async addAddress(userId, addressData) {
    const user = await User.findById(String(userId));
    if (!user) throw new Error('User not found');

    if (addressData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    user.addresses.push(addressData);
    await user.save();
    return user.addresses;
  }

  async deleteAddress(userId, addressId) {
    const user = await User.findById(String(userId));
    if (!user) throw new Error('User not found');

    user.addresses.pull({ _id: addressId });
    await user.save();
    return user.addresses;
  }
}

module.exports = new AuthService();