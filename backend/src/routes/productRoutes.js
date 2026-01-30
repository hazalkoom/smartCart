const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validate,
  productValidationRules,
  productUpdateValidationRules,
} = require('../middleware/validationMiddleware');
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

// --- Public Routes ---
router.route('/').get(getAllProducts);
router.route('/:slug').get(getProduct);

// --- Admin/Owner Routes ---
router.route('/').post(protect, authorize('admin', 'owner'), productValidationRules, validate, createProduct);
router.route('/:id').put(protect, authorize('admin', 'owner'), productUpdateValidationRules, validate, updateProduct);

// --- OWNER ONLY: Permanent Delete (Soft Delete logic is in controller) ---
// Changed from 'admin', 'owner' to JUST 'owner'
router.route('/:id').delete(protect, authorize('owner'), deleteProduct);

module.exports = router;