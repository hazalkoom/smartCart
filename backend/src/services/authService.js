const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");

class AuthService {
  async registerUser(userData) {
    const { email, password, firstName, lastName, phone } = userData;

    const userExists = await User.findOne({ email });

    if (userExists) {
      throw new Error("User already exists");
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
    });

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

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

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

  async getUserById(userId) {
    const user = await User.findById(userId);
    return user;
  }
}

module.exports = new AuthService();