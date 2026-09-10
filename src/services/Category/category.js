const Category = require("../../models/Category/category");
const SubCategory = require("../../models/SubCategory/subCategory");
const Trader = require("../../models/Trader/trader");
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
    return await Category.find().sort({ createdAt: -1 });
  }

  /**
   * Get single Category by ID
   */
  async getCategoryById(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new CustomError("Category not found", 404);
    }
    return category;
  }

  /**
   * Update Category by ID
   */
  async updateCategory(id, { name, note }) {
    const category = await Category.findById(id);
    if (!category) {
      throw new CustomError("Category not found", 404);
    }

    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await Category.findOne({
        _id: { $ne: id },
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
   * Delete Category by ID (Prevent deletion if in use)
   */
  async deleteCategory(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new CustomError("Category not found", 404);
    }

    // Check if category is used by any SubCategory
    const subCategoryCount = await SubCategory.countDocuments({ categoryId: id });
    if (subCategoryCount > 0) {
      throw new CustomError(
        "Cannot delete category as it is currently associated with sub-categories",
        400
      );
    }

    // Check if category is used by any Trader
    const traderCount = await Trader.countDocuments({ categoryId: id });
    if (traderCount > 0) {
      throw new CustomError(
        "Cannot delete category as it is currently associated with traders",
        400
      );
    }

    await Category.findByIdAndDelete(id);
    return { id };
  }
}

module.exports = new CategoryService();
