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
  getProductBySlug,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

// --- Public Routes ---

router.route('/').get(getAllProducts);
router.route('/:slug').get(getProductBySlug);


// --- Admin/Owner Only Routes ---

router.route('/').post(protect, authorize('admin', 'owner'), productValidationRules, validate, createProduct);

router.route('/:id').put(protect, authorize('admin', 'owner'), productUpdateValidationRules, validate, updateProduct);

router.route('/:id').delete(protect, authorize('admin', 'owner'), deleteProduct);

module.exports = router;