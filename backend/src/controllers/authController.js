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
    message: 'User registered successfully. Please check your email to verify your account.',
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide an email and password'); 
  }

  try {
    const user = await AuthService.loginUser(email, password);
    res.status(200).json({
      success: true,
      data: user,
      message: 'User logged in successfully',
    });
  } catch (error) {
    res.status(401);
    throw error;
  }
});

// ---> NEW: Verify Email Controller <---
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  if (!token) {
    res.status(400);
    throw new Error('Verification token is missing');
  }
  
  await AuthService.verifyEmail(token);
  
  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You now have full access.',
  });
});

// ---> NEW: Resend Verification Controller <---
const resendVerification = asyncHandler(async (req, res) => {
  // We will protect this route, so req.user.id is guaranteed to exist
  await AuthService.resendVerification(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'Verification email resent. Please check your inbox.',
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await AuthService.getUserById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: user });
});

// --- UPDATED: FORGOT PASSWORD (Cleaner, no token leaking) ---
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  try {
    await AuthService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    });
  }
});

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
    res.status(400);
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

// --- WISHLIST CONTROLLERS ---
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    res.status(400);
    throw new Error('Please provide a product ID');
  }
  const wishlist = await AuthService.toggleWishlist(req.user.id, productId);
  res.status(200).json({ success: true, data: wishlist });
});

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await AuthService.getWishlist(req.user.id);
  res.status(200).json({ success: true, data: wishlist });
});

// --- ADDRESS CONTROLLERS ---
const addAddress = asyncHandler(async (req, res) => {
  const addresses = await AuthService.addAddress(req.user.id, req.body);
  res.status(201).json({ success: true, data: addresses, message: 'Address added successfully' });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await AuthService.deleteAddress(req.user.id, req.params.id);
  res.status(200).json({ success: true, data: addresses, message: 'Address removed successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,       // Exported the new controller
  resendVerification, // Exported the new controller
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  toggleWishlist,
  getWishlist,
  addAddress,
  deleteAddress
};