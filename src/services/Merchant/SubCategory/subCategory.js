const SubCategory = require("../../../models/Merchant/SubCategory/subCategory");
const Category = require("../../../models/Merchant/Category/category");
const Merchant = require("../../../models/Merchant/merchant");
const CustomError = require("../../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../../utils/Common/pagination");

/**
 * Format sub-category object with parent Category details
 */
const formatSubCategory = async (subCategory) => {
  if (!subCategory) return {};
  const obj =
    typeof subCategory.toJSON === "function"
      ? subCategory.toJSON()
      : { ...subCategory };

  const category = await Category.findOne({ categoryId: obj.categoryId });
  if (category) {
    obj.category = {
      id: category.categoryId,
      name: category.name,
    };
  }

  delete obj.categoryId;
  delete obj.isDeleted;
  delete obj.deletedAt;
  return obj;
};

class SubCategoryService {
  /**
   * Create a new sub-category
   */
  async createSubCategory(data) {
    const numCategoryId = Number(data.categoryId);
    if (isNaN(numCategoryId)) {
      throw new CustomError("Invalid Category ID", 400);
    }

    const category = await Category.findOne({ categoryId: numCategoryId });
    if (!category) {
      throw new CustomError("Selected parent Category does not exist", 404);
    }
    if (category.status === "Inactive") {
      throw new CustomError("Cannot select an inactive Category", 400);
    }

    const existingSubCategory = await SubCategory.findOne({
      categoryId: numCategoryId,
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
    });

    if (existingSubCategory) {
      throw new CustomError(
        "Sub-category with this name already exists in selected Category",
        400,
      );
    }

    const subCategory = await SubCategory.create({
      categoryId: numCategoryId,
      name: data.name.trim(),
      note: data.note ? data.note.trim() : "",
    });

    return await formatSubCategory(subCategory);
  }

  /**
   * Get all sub-categories with pagination, category filter & search
   */
  async getAllSubCategories(targetCategoryId, queryParams = {}) {
    const { page, limit, skip, search, status } =
      getPaginationQueryParams(queryParams);
    const query = {};

    if (status) {
      query.status = new RegExp(`^${status}$`, "i");
    }

    const categoryId = targetCategoryId || queryParams.categoryId;
    if (categoryId) {
      const numCategoryId = Number(categoryId);
      if (!isNaN(numCategoryId)) {
        query.categoryId = numCategoryId;
      }
    }

    if (search) {
      query.name = new RegExp(search, "i");
    }

    const totalCount = await SubCategory.countDocuments(query);
    const subCategories = await SubCategory.find(query)
      .sort({ subCategoryId: 1 })
      .skip(skip)
      .limit(limit);

    const formattedSubCategories = await Promise.all(
      subCategories.map((sc) => formatSubCategory(sc)),
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      subCategories: formattedSubCategories,
      pagination,
    };
  }

  /**
   * Get sub-category by numeric subCategoryId
   */
  async getSubCategoryById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Sub Category ID", 400);
    }

    const subCategory = await SubCategory.findOne({ subCategoryId: numericId });
    if (!subCategory) {
      throw new CustomError("Sub category not found", 404);
    }

    return await formatSubCategory(subCategory);
  }

  /**
   * Update sub-category by numeric subCategoryId
   */
  async updateSubCategory(id, data) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Sub Category ID", 400);
    }

    const subCategory = await SubCategory.findOne({ subCategoryId: numericId });
    if (!subCategory) {
      throw new CustomError("Sub category not found", 404);
    }

    const targetCategoryId =
      data.categoryId !== undefined
        ? Number(data.categoryId)
        : subCategory.categoryId;

    if (data.categoryId !== undefined) {
      if (isNaN(targetCategoryId)) {
        throw new CustomError("Invalid Category ID", 400);
      }
      const category = await Category.findOne({ categoryId: targetCategoryId });
      if (!category) {
        throw new CustomError("Selected parent Category does not exist", 404);
      }
      if (category.status === "Inactive") {
        throw new CustomError("Cannot select an inactive Category", 400);
      }
    }

    if (data.name && data.name.trim() !== subCategory.name) {
      const existingSubCategory = await SubCategory.findOne({
        categoryId: targetCategoryId,
        name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
        subCategoryId: { $ne: numericId },
      });

      if (existingSubCategory) {
        throw new CustomError(
          "Sub-category with this name already exists in selected Category",
          400,
        );
      }

      subCategory.name = data.name.trim();
    }

    if (data.categoryId !== undefined) {
      subCategory.categoryId = targetCategoryId;
    }

    if (data.note !== undefined) {
      subCategory.note = data.note ? data.note.trim() : "";
    }

    await subCategory.save();
    return await formatSubCategory(subCategory);
  }

  /**
   * Update SubCategory Status (Active / Inactive)
   */
  async updateSubCategoryStatus(id, status) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Sub Category ID", 400);
    }

    const subCategory = await SubCategory.findOne({ subCategoryId: numericId });
    if (!subCategory) {
      throw new CustomError("Sub category not found", 404);
    }

    subCategory.status = status;
    await subCategory.save();
    return await formatSubCategory(subCategory);
  }

  /**
   * Delete sub-category by numeric subCategoryId (with dependency check and soft delete)
   */
  async deleteSubCategory(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Sub Category ID", 400);
    }

    const subCategory = await SubCategory.findOne({ subCategoryId: numericId });
    if (!subCategory) {
      throw new CustomError("Sub category not found", 404);
    }

    // Check if merchants are linked
    const linkedMerchants = await Merchant.countDocuments({
      subCategoryId: numericId,
    });

    if (linkedMerchants > 0) {
      throw new CustomError(
        "Cannot delete sub-category: It is associated with merchants",
        400,
      );
    }

    await subCategory.softDelete();
    return { id: numericId };
  }
}

module.exports = new SubCategoryService();
