const AuthService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
  
  const user = await AuthService.registerUser({
    email, password, firstName, lastName, phone,
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
    res.status(400); // Bad Request
    throw new Error('Please provide an email and password'); 
  }

  // We wrap this in try/catch to handle the 401 specifically
  try {
    const user = await AuthService.loginUser(email, password);
    res.status(200).json({
      success: true,
      data: user,
      message: 'User logged in successfully',
    });
  } catch (error) {
    res.status(401); // Unauthorized
    throw error;
  }
});

const getMe = asyncHandler(async (req, res) => {
  const user = await AuthService.getUserById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: user });
});

// --- FIXED ENDPOINT 1: FORGOT PASSWORD ---
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // 1. SECURITY PATCH: Strict Type Checking
  // This prevents the NoSQL Injection attack: {"email": {"$ne": null}}
  if (!email || typeof email !== 'string') {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  try {
    const resetToken = await AuthService.forgotPassword(email);

    // DEVELOPMENT ONLY: We return the token in the response for testing.
    // In production, you would send an email here.
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    res.status(200).json({
      success: true,
      message: 'Reset token generated',
      resetToken: resetToken,
      resetUrl: resetUrl
    });
  } catch (error) {
    // If user not found, we typically return 200 (for security) or 404. 
    // For this test suite, we need 404 or 400.
    res.status(404);
    throw error;
  }
});

// --- FIXED ENDPOINT 2: RESET PASSWORD ---
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('Please provide a new password');
  }

  try {
    await AuthService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now login with the new password.',
    });
  } catch (error) {
    // If token is invalid or expired
    res.status(400); // Bad Request (instead of 500)
    throw error;
  }
});

const updateDetails = asyncHandler(async (req, res) => {
  const updatedUser = await AuthService.updateUserDetail(req.user.id, req.body);
  res.status(200).json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully'
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails
};