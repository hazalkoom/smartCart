const CategoryService = require('../services/categoryService');
const asyncHandler = require('../utils/asyncHandler');

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const category = await CategoryService.createCategory({ name, description });

  res.status(201).json({
    success: true,
    data: category,
    message: 'Category created successfully',
  });
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await CategoryService.getAllCategories();

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await CategoryService.getCategoryBySlug(slug);

  res.status(200).json({
    success: true,
    data: category,
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const updatedCategory = await CategoryService.updateCategory(id, {
    name,
    description,
  });

  res.status(200).json({
    success: true,
    data: updatedCategory,
    message: 'Category updated successfully',
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await CategoryService.deleteCategory(id);

  res.status(200).json({
    success: true,
    data: {},
    message: 'Category deleted successfully',
  });
});

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};