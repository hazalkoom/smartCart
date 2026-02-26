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

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    const responseData = {
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    };

    // Only expose token in non-production (for testing)
    if (process.env.NODE_ENV !== 'production') {
      responseData.resetToken = resetToken;
      responseData.resetUrl = resetUrl;
    }

    res.status(200).json(responseData);
  } catch (error) {
    // Security: Always return 200 with same message to prevent user enumeration
    res.status(200).json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    });
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
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  toggleWishlist,
  getWishlist,
  addAddress,
  deleteAddress
};