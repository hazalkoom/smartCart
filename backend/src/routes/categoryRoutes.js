const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validate,
  categoryValidationRules,
} = require('../middleware/validationMiddleware');
const {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();
// --- Public Routes ---
router.route('/').get(getAllCategories);
router.route('/:slug').get(getCategoryBySlug);

// --- Admin/Owner Only Routes ---

router.route('/').post(protect, authorize('admin', 'owner'), categoryValidationRules, validate,createCategory); // create category
router.route('/:id').put(protect, authorize('admin', 'owner'), categoryValidationRules, validate, updateCategory); // update category
router.route('/:id').delete(protect, authorize('admin', 'owner'), deleteCategory); // delete category



module.exports = router;