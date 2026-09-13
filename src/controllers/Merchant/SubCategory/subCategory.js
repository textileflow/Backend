const subCategoryService = require("../../../services/Merchant/SubCategory/subCategory");
const { sendSuccess } = require("../../../utils/Common/apiResponse");

/**
 * @desc    Create a new sub-category
 * @route   POST /api/subcategories
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const subCategory = await subCategoryService.createSubCategory(req.body);
    return sendSuccess(
      res,
      201,
      "Sub-category created successfully",
      subCategory
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all sub-categories with pagination & search (?page=1&per_page=10&search=&categoryId=)
 * @route   GET /api/subcategories
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const targetCategoryId = req.params.categoryId;
    const { subCategories, pagination } =
      await subCategoryService.getAllSubCategories(targetCategoryId, req.query);

    return sendSuccess(
      res,
      200,
      "Sub-categories retrieved successfully",
      subCategories,
      pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single sub-category by numeric subCategoryId
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
      "Sub-category retrieved successfully",
      subCategory
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update sub-category by numeric subCategoryId
 * @route   PUT /api/subcategories/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const subCategory = await subCategoryService.updateSubCategory(
      req.params.id,
      req.body
    );
    return sendSuccess(
      res,
      200,
      "Sub-category updated successfully",
      subCategory
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update sub-category status (Active / Inactive)
 * @route   PATCH /api/sub-categories/:id/status
 * @access  Private (ADMIN, MANAGER)
 */
const updateStatus = async (req, res, next) => {
  try {
    const subCategory = await subCategoryService.updateSubCategoryStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(
      res,
      200,
      "Sub-category status updated successfully",
      subCategory
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete sub-category by numeric subCategoryId
 * @route   DELETE /api/subcategories/:id
 * @access  Private (ADMIN)
 */
const remove = async (req, res, next) => {
  try {
    await subCategoryService.deleteSubCategory(req.params.id);
    return sendSuccess(res, 200, "Sub-category deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  updateStatus,
  remove,
};
