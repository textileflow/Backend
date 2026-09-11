const Category = require("../../models/Category/category");
const SubCategory = require("../../models/SubCategory/subCategory");
const Merchant = require("../../models/Merchant/merchant");
const CustomError = require("../../utils/Common/customError");

class CategoryService {
  /**
   * Create a new Category
   */
  async createCategory({ name, note }) {
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      throw new CustomError("Category with this name already exists", 400);
    }

    const category = await Category.create({
      name: name.trim(),
      note: note ? note.trim() : "",
    });

    return category;
  }

  /**
   * Get all Categories
   */
  async getAllCategories() {
    return await Category.find().sort({ categoryId: 1 });
  }

  /**
   * Get single Category by numeric ID
   */
  async getCategoryById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Category ID", 400);
    }

    const category = await Category.findOne({ categoryId: numericId });
    if (!category) {
      throw new CustomError("Category not found", 404);
    }
    return category;
  }

  /**
   * Update Category by numeric ID
   */
  async updateCategory(id, { name, note }) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Category ID", 400);
    }

    const category = await Category.findOne({ categoryId: numericId });
    if (!category) {
      throw new CustomError("Category not found", 404);
    }

    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await Category.findOne({
        categoryId: { $ne: numericId },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      if (existing) {
        throw new CustomError("Category with this name already exists", 400);
      }
      category.name = name.trim();
    }

    if (note !== undefined) {
      category.note = note ? note.trim() : "";
    }

    await category.save();
    return category;
  }

  /**
   * Delete Category by numeric ID (Prevent deletion if in use)
   */
  async deleteCategory(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Category ID", 400);
    }

    const category = await Category.findOne({ categoryId: numericId });
    if (!category) {
      throw new CustomError("Category not found", 404);
    }

    // Check if category is used by any SubCategory
    const subCategoryCount = await SubCategory.countDocuments({ categoryId: numericId });
    if (subCategoryCount > 0) {
      throw new CustomError(
        "Cannot delete category as it is currently associated with sub-categories",
        400
      );
    }

    // Check if category is used by any Merchant
    const merchantCount = await Merchant.countDocuments({ categoryId: numericId });
    if (merchantCount > 0) {
      throw new CustomError(
        "Cannot delete category as it is currently associated with merchants",
        400
      );
    }

    await Category.findOneAndDelete({ categoryId: numericId });
    return { id: numericId };
  }
}

module.exports = new CategoryService();
