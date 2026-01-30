const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);
router.use(authorize('owner'));

router.route('/')
  .get(getAllUsers)

router.route('/:id')
  .get(getUserById)
  .put(updateUserRole)
  .delete(deleteUser);

module.exports = router;