const UserService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Owner
const getAllUsers = asyncHandler(async (req, res) => {
  // Pass query params for pagination
  const result = await UserService.getAllUsers(req.query);
  
  res.status(200).json({
    success: true,
    count: result.count,      // Total users in DB
    total: result.count,      // Alias for consistency
    page: result.page,
    pages: result.pages,
    data: result.users,       // The actual array
  });
});

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Private/Owner
const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(err.statusCode || 500);
    throw new Error(err.message);
  }
});

// @desc    Update user role
// @route   PUT /api/v1/users/:id
// @access  Private/Owner
const updateUserRole = asyncHandler(async (req, res) => {
  try {
    const { role } = req.body;
    const updatedUser = await UserService.updateUserRole(req.params.id, role, req.user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      message: `User role updated to ${updatedUser.role}`
    });
  } catch (err) {
    res.status(err.statusCode || 500);
    throw new Error(err.message);
  }
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Owner
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const result = await UserService.deleteUser(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    res.status(err.statusCode || 500);
    throw new Error(err.message);
  }
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};