const Category = require("../../../models/Merchant/Category/category");
const SubCategory = require("../../../models/Merchant/SubCategory/subCategory");
const Merchant = require("../../../models/Merchant/merchant");
const CustomError = require("../../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../../utils/Common/pagination");

class CategoryService {
  /**
   * Create a new category
   */
  async createCategory(data) {
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
    });

    if (existingCategory) {
      throw new CustomError("Category with this name already exists", 400);
    }

    const category = await Category.create({
      name: data.name.trim(),
      note: data.note ? data.note.trim() : "",
    });

    return category;
  }

  /**
   * Get all categories sorted by categoryId with pagination & search
   */
  async getAllCategories(queryParams = {}) {
    const { page, limit, skip, search } = getPaginationQueryParams(queryParams);
    const query = {};

    if (search) {
      query.name = new RegExp(search, "i");
    }

    const totalCount = await Category.countDocuments(query);
    const categories = await Category.find(query)
      .sort({ categoryId: 1 })
      .skip(skip)
      .limit(limit);

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      categories,
      pagination,
    };
  }

  /**
   * Get category by numeric categoryId
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
   * Update category by numeric categoryId
   */
  async updateCategory(id, data) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Category ID", 400);
    }

    const category = await Category.findOne({ categoryId: numericId });
    if (!category) {
      throw new CustomError("Category not found", 404);
    }

    if (data.name && data.name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
        categoryId: { $ne: numericId },
      });

      if (existingCategory) {
        throw new CustomError("Category with this name already exists", 400);
      }

      category.name = data.name.trim();
    }

    if (data.note !== undefined) {
      category.note = data.note ? data.note.trim() : "";
    }

    await category.save();
    return category;
  }

  /**
   * Delete category by numeric categoryId (with dependency check)
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

    // Check if sub-categories are linked
    const linkedSubCategories = await SubCategory.countDocuments({
      categoryId: numericId,
    });
    if (linkedSubCategories > 0) {
      throw new CustomError(
        "Cannot delete category: It is associated with sub-categories",
        400
      );
    }

    // Check if merchants are linked
    const linkedMerchants = await Merchant.countDocuments({
      categoryId: numericId,
    });
    if (linkedMerchants > 0) {
      throw new CustomError(
        "Cannot delete category: It is associated with merchants",
        400
      );
    }

    await Category.findOneAndDelete({ categoryId: numericId });
    return { id: numericId };
  }
}

module.exports = new CategoryService();
