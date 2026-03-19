const Category = require("../models/categoryModel");

class CategoryService {
  async createCategory(categoryData) {
    const { name, description } = categoryData;

    const existingCategory = await Category.findOne({ name: String(name) });
    if (existingCategory) {
      throw new Error("A category with this name already exists");
    }

    const category = await Category.create({
      name,
      description,
    });

    return category;
  }

  async getAllCategories() {
    return await Category.find().sort({ name: 1 });
  }

  async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug: String(slug) });

    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async updateCategory(categoryId, updatedData) {
    const { name, description } = updatedData;

    const category = await Category.findById(String(categoryId));

    if (!category) {
      throw new Error('Category not found');
    }

    if (name && name !== category.name) {
      const existing = await Category.findOne({ name: String(name) });
      if (existing) {
        throw new Error('A category with this name already exists');
      }
    }

    // The 'pre-save' hook will auto-update the slug if name changes
    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;

    const updatedCategory = await category.save();
    return updatedCategory;
  }

  async deleteCategory(categoryId) {
    const category = await Category.findById(String(categoryId));

    if (!category) {
      throw new Error('Category not found');
    }

    // Note: We need to add logic here later to check if any
    // products are using this category before deleting.
    // For Week 2, a simple delete is fine.

    await category.deleteOne();
  }
}

module.exports = new CategoryService();