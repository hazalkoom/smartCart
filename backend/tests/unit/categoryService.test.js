jest.mock('../../src/models/categoryModel', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
}));

const Category = require('../../src/models/categoryModel');
const categoryService = require('../../src/services/categoryService');

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('throws when creating a category with a duplicate name', async () => {
      Category.findOne.mockResolvedValue({ _id: 'cat-1' });

      await expect(
        categoryService.createCategory({ name: 'Electronics', description: 'x' })
      ).rejects.toThrow('A category with this name already exists');

      expect(Category.findOne).toHaveBeenCalledWith({ name: 'Electronics' });
      expect(Category.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('renames a category when the new name is available', async () => {
      const category = {
        _id: 'cat-1',
        name: 'Old Name',
        description: 'Old Desc',
        save: jest.fn(async function () {
          return this;
        }),
      };

      Category.findById.mockResolvedValue(category);
      Category.findOne.mockResolvedValue(null);

      const updated = await categoryService.updateCategory('cat-1', {
        name: 'New Name',
        description: 'New Desc',
      });

      expect(Category.findById).toHaveBeenCalledWith('cat-1');
      expect(Category.findOne).toHaveBeenCalledWith({ name: 'New Name' });
      expect(category.name).toBe('New Name');
      expect(category.description).toBe('New Desc');
      expect(category.save).toHaveBeenCalled();
      expect(updated).toBe(category);
    });

    it('throws when renaming to an existing category name', async () => {
      const category = {
        _id: 'cat-1',
        name: 'Old Name',
        description: 'Old Desc',
        save: jest.fn(),
      };

      Category.findById.mockResolvedValue(category);
      Category.findOne.mockResolvedValue({ _id: 'cat-2', name: 'Taken Name' });

      await expect(
        categoryService.updateCategory('cat-1', { name: 'Taken Name', description: 'x' })
      ).rejects.toThrow('A category with this name already exists');

      expect(category.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('deletes a category (happy path)', async () => {
      const category = {
        _id: 'cat-1',
        deleteOne: jest.fn(async () => undefined),
      };

      Category.findById.mockResolvedValue(category);

      await expect(categoryService.deleteCategory('cat-1')).resolves.toBeUndefined();

      expect(Category.findById).toHaveBeenCalledWith('cat-1');
      expect(category.deleteOne).toHaveBeenCalled();
    });
  });
});
