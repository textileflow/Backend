const subCategoryService = require("../../services/SubCategory/subCategory");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * @desc    Create a new sub category
 * @route   POST /api/subcategories
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const { categoryId, name, note } = req.body;
    const subCategory = await subCategoryService.createSubCategory({
      categoryId,
      name,
      note,
    });
    return sendSuccess(res, 201, "Sub category created successfully", subCategory);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all sub categories
 * @route   GET /api/subcategories
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const subCategories = await subCategoryService.getAllSubCategories();
    return sendSuccess(
      res,
      200,
      "Sub categories fetched successfully",
      subCategories
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single sub category by ID
 * @route   GET /api/subcategories/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const subCategory = await subCategoryService.getSubCategoryById(
      req.params.id
    );
    return sendSuccess(
      res,
      200,
      "Sub category fetched successfully",
      subCategory
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sub categories by category ID
 * @route   GET /api/subcategories/category/:categoryId
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getByCategory = async (req, res, next) => {
  try {
    const subCategories =
      await subCategoryService.getSubCategoriesByCategoryId(
        req.params.categoryId
      );
    return sendSuccess(
      res,
      200,
      "Sub categories fetched successfully",
      subCategories
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update sub category by ID
 * @route   PUT /api/subcategories/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const { categoryId, name, note } = req.body;
    const subCategory = await subCategoryService.updateSubCategory(
      req.params.id,
      {
        categoryId,
        name,
        note,
      }
    );
    return sendSuccess(
      res,
      200,
      "Sub category updated successfully",
      subCategory
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete sub category by ID
 * @route   DELETE /api/subcategories/:id
 * @access  Private (ADMIN, MANAGER)
 */
const remove = async (req, res, next) => {
  try {
    await subCategoryService.deleteSubCategory(req.params.id);
    return sendSuccess(res, 200, "Sub category deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  getByCategory,
  update,
  remove,
};
