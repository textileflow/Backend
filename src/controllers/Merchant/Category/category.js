const categoryService = require("../../../services/Merchant/Category/category");
const { sendSuccess } = require("../../../utils/Common/apiResponse");

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return sendSuccess(res, 201, "Category created successfully", category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all categories with pagination & search (?page=1&per_page=10&search=)
 * @route   GET /api/categories
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { categories, pagination } = await categoryService.getAllCategories(req.query);
    return sendSuccess(
      res,
      200,
      "Categories retrieved successfully",
      categories,
      pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single category by numeric categoryId
 * @route   GET /api/categories/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return sendSuccess(res, 200, "Category retrieved successfully", category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category by numeric categoryId
 * @route   PUT /api/categories/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body
    );
    return sendSuccess(res, 200, "Category updated successfully", category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category status (Active / Inactive)
 * @route   PATCH /api/categories/:id/status
 * @access  Private (ADMIN, MANAGER)
 */
const updateStatus = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategoryStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(res, 200, "Category status updated successfully", category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category by numeric categoryId
 * @route   DELETE /api/categories/:id
 * @access  Private (ADMIN)
 */
const remove = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    return sendSuccess(res, 200, "Category deleted successfully");
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
