const AuthService = require('../services/authService');

const asyncHandler = require('../utils/asyncHandler');

const registerUser = asyncHandler(async (req, res) => {

  const { email, password, firstName, lastName, phone } = req.body;

  
  const user = await AuthService.registerUser({
    email,
    password,
    firstName,
    lastName,
    phone,
  });

  res.status(201).json({
    success: true,
    data: user,
    message: 'User registered successfully',
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new Error('Please provide an email and password'); 
  }

  const user = await AuthService.loginUser(email, password);

  res.status(200).json({
    success: true,
    data: user,
    message: 'User logged in successfully',
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await AuthService.getUserById(req.user.id);

  if (!user) {
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  console.log('Forgot Password endpoint called');
  res.status(200).json({
    success: true,
    message: 'Password reset email (not yet implemented)',
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  console.log('Reset Password endpoint called');
  res.status(200).json({
    success: true,
    message: 'Password has been reset (not yet implemented)',
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
};