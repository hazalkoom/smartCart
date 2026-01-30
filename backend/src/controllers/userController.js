const UserService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await UserService.getAllUsers();
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});


const getUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const userIdToUpdate = req.params.id;
  const currentOwnerId = req.user._id; // From authMiddleware

  // Call Service
  const updatedUser = await UserService.updateUserRole(userIdToUpdate, role, currentOwnerId);

  res.status(200).json({
    success: true,
    data: {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      email: updatedUser.email,
      role: updatedUser.role,
    },
    message: `User role updated to ${updatedUser.role}`
  });
});


const deleteUser = asyncHandler(async (req, res) => {
  const userIdToDelete = req.params.id;
  const currentOwnerId = req.user._id; // From authMiddleware

  await UserService.deleteUser(userIdToDelete, currentOwnerId);

  res.status(200).json({
    success: true,
    message: 'User removed successfully',
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};