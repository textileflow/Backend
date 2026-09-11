const SubCategory = require("../../models/SubCategory/subCategory");
const Category = require("../../models/Category/category");
const Merchant = require("../../models/Merchant/merchant");
const CustomError = require("../../utils/Common/customError");

class SubCategoryService {
  /**
   * Create a new SubCategory
   */
  async createSubCategory({ categoryId, name, note }) {
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new CustomError("Category not found", 404);
    }

    // Check duplicate name under the same category
    const existing = await SubCategory.findOne({
      categoryId,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      throw new CustomError(
        "Sub Category with this name already exists under selected Category",
        400
      );
    }

    const subCategory = await SubCategory.create({
      categoryId,
      name: name.trim(),
      note: note ? note.trim() : "",
    });

    return await subCategory.populate("categoryId", "name note");
  }

  /**
   * Get all SubCategories
   */
  async getAllSubCategories() {
    return await SubCategory.find()
      .populate("categoryId", "name note")
      .sort({ createdAt: -1 });
  }

  /**
   * Get single SubCategory by ID
   */
  async getSubCategoryById(id) {
    const subCategory = await SubCategory.findById(id).populate(
      "categoryId",
      "name note"
    );
    if (!subCategory) {
      throw new CustomError("Sub Category not found", 404);
    }
    return subCategory;
  }

  /**
   * Get SubCategories by Category ID
   */
  async getSubCategoriesByCategoryId(categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new CustomError("Category not found", 404);
    }

    return await SubCategory.find({ categoryId })
      .populate("categoryId", "name note")
      .sort({ createdAt: -1 });
  }

  /**
   * Update SubCategory by ID
   */
  async updateSubCategory(id, { categoryId, name, note }) {
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      throw new CustomError("Sub Category not found", 404);
    }

    const targetCategoryId = categoryId || subCategory.categoryId;

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new CustomError("Category not found", 404);
      }
    }

    const newName = name ? name.trim() : subCategory.name;

    // If category or name changed, check duplicate
    if (
      (name && name.trim().toLowerCase() !== subCategory.name.toLowerCase()) ||
      (categoryId && categoryId.toString() !== subCategory.categoryId.toString())
    ) {
      const existing = await SubCategory.findOne({
        _id: { $ne: id },
        categoryId: targetCategoryId,
        name: { $regex: new RegExp(`^${newName}$`, "i") },
      });
      if (existing) {
        throw new CustomError(
          "Sub Category with this name already exists under selected Category",
          400
        );
      }
    }

    if (categoryId) subCategory.categoryId = categoryId;
    if (name) subCategory.name = newName;
    if (note !== undefined) subCategory.note = note ? note.trim() : "";

    await subCategory.save();
    return await subCategory.populate("categoryId", "name note");
  }

  /**
   * Delete SubCategory by ID (Prevent deletion if used by Merchant)
   */
  async deleteSubCategory(id) {
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      throw new CustomError("Sub Category not found", 404);
    }

    // Check if subCategory is used by any Merchant
    const merchantCount = await Merchant.countDocuments({ subCategoryId: id });
    if (merchantCount > 0) {
      throw new CustomError(
        "Cannot delete sub-category as it is currently associated with merchants",
        400
      );
    }

    await SubCategory.findByIdAndDelete(id);
    return { id };
  }
}

module.exports = new SubCategoryService();
