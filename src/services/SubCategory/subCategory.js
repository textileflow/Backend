const SubCategory = require("../../models/SubCategory/subCategory");
const Category = require("../../models/Category/category");
const Merchant = require("../../models/Merchant/merchant");
const CustomError = require("../../utils/Common/customError");

/**
 * Format subCategory object safely with populated Category details
 */
const formatSubCategory = async (subCategory) => {
  if (!subCategory) return {};
  const obj = typeof subCategory.toJSON === "function" ? subCategory.toJSON() : { ...subCategory };
  
  const category = await Category.findOne({ categoryId: obj.categoryId });
  if (category) {
    obj.category = {
      id: category.categoryId,
      name: category.name,
    };
  }
  delete obj.categoryId;
  return obj;
};

class SubCategoryService {
  /**
   * Create a new SubCategory
   */
  async createSubCategory({ categoryId, name, note }) {
    const numCategoryId = Number(categoryId);
    if (isNaN(numCategoryId)) {
      throw new CustomError("Invalid Category ID", 400);
    }

    // Check if category exists
    const category = await Category.findOne({ categoryId: numCategoryId });
    if (!category) {
      throw new CustomError("Category not found", 404);
    }

    // Check duplicate name under the same category
    const existing = await SubCategory.findOne({
      categoryId: numCategoryId,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      throw new CustomError(
        "Sub Category with this name already exists under selected Category",
        400
      );
    }

    const subCategory = await SubCategory.create({
      categoryId: numCategoryId,
      name: name.trim(),
      note: note ? note.trim() : "",
    });

    return await formatSubCategory(subCategory);
  }

  /**
   * Get all SubCategories
   */
  async getAllSubCategories() {
    const subCategories = await SubCategory.find().sort({ subCategoryId: 1 });
    return await Promise.all(subCategories.map((s) => formatSubCategory(s)));
  }

  /**
   * Get single SubCategory by numeric ID
   */
  async getSubCategoryById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Sub Category ID", 400);
    }

    const subCategory = await SubCategory.findOne({ subCategoryId: numericId });
    if (!subCategory) {
      throw new CustomError("Sub Category not found", 404);
    }
    return await formatSubCategory(subCategory);
  }

  /**
   * Get SubCategories by Category numeric ID
   */
  async getSubCategoriesByCategoryId(categoryId) {
    const numCategoryId = Number(categoryId);
    if (isNaN(numCategoryId)) {
      throw new CustomError("Invalid Category ID", 400);
    }

    const category = await Category.findOne({ categoryId: numCategoryId });
    if (!category) {
      throw new CustomError("Category not found", 404);
    }

    const subCategories = await SubCategory.find({ categoryId: numCategoryId }).sort({ subCategoryId: 1 });
    return await Promise.all(subCategories.map((s) => formatSubCategory(s)));
  }

  /**
   * Update SubCategory by numeric ID
   */
  async updateSubCategory(id, { categoryId, name, note }) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Sub Category ID", 400);
    }

    const subCategory = await SubCategory.findOne({ subCategoryId: numericId });
    if (!subCategory) {
      throw new CustomError("Sub Category not found", 404);
    }

    const targetCategoryId = categoryId ? Number(categoryId) : subCategory.categoryId;

    if (categoryId) {
      const category = await Category.findOne({ categoryId: targetCategoryId });
      if (!category) {
        throw new CustomError("Category not found", 404);
      }
    }

    const newName = name ? name.trim() : subCategory.name;

    // If category or name changed, check duplicate
    if (
      (name && name.trim().toLowerCase() !== subCategory.name.toLowerCase()) ||
      (categoryId && Number(categoryId) !== subCategory.categoryId)
    ) {
      const existing = await SubCategory.findOne({
        subCategoryId: { $ne: numericId },
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

    if (categoryId) subCategory.categoryId = targetCategoryId;
    if (name) subCategory.name = newName;
    if (note !== undefined) subCategory.note = note ? note.trim() : "";

    await subCategory.save();
    return await formatSubCategory(subCategory);
  }

  /**
   * Delete SubCategory by numeric ID (Prevent deletion if used by Merchant)
   */
  async deleteSubCategory(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Sub Category ID", 400);
    }

    const subCategory = await SubCategory.findOne({ subCategoryId: numericId });
    if (!subCategory) {
      throw new CustomError("Sub Category not found", 404);
    }

    // Check if subCategory is used by any Merchant
    const merchantCount = await Merchant.countDocuments({ subCategoryId: numericId });
    if (merchantCount > 0) {
      throw new CustomError(
        "Cannot delete sub-category as it is currently associated with merchants",
        400
      );
    }

    await SubCategory.findOneAndDelete({ subCategoryId: numericId });
    return { id: numericId };
  }
}

module.exports = new SubCategoryService();
