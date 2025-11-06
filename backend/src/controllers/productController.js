const ProductService = require('../services/productService');
const asyncHandler = require('../utils/asyncHandler');

const createProduct = asyncHandler(async (req, res) => {

  const productData = req.body;

  const product = await ProductService.createProduct(productData);

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully',
  });
});

const getAllProducts = asyncHandler(async (req, res) => {

  const result = await ProductService.getAllProducts(req.query);

  res.status(200).json({
    success: true,
    count: result.products.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    data: result.products,
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const product = await ProductService.getProductBySlug(slug);

  res.status(200).json({
    success: true,
    data: product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productData = req.body;

  const updatedProduct = await ProductService.updateProduct(id, productData);

  res.status(200).json({
    success: true,
    data: updatedProduct,
    message: 'Product updated successfully',
  });
});


const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ProductService.deleteProduct(id);

  res.status(200).json({
    success: true,
    data: {},
    message: 'Product deleted successfully',
  });
});

module.exports = {
  createProduct,
  getAllProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};