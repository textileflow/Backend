const categoryService = require("../../services/Category/category");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const { name, note } = req.body;
    const category = await categoryService.createCategory({ name, note });
    return sendSuccess(res, 201, "Category created successfully", category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    return sendSuccess(res, 200, "Categories fetched successfully", categories);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return sendSuccess(res, 200, "Category fetched successfully", category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category by ID
 * @route   PUT /api/categories/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const { name, note } = req.body;
    const category = await categoryService.updateCategory(req.params.id, {
      name,
      note,
    });
    return sendSuccess(res, 200, "Category updated successfully", category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category by ID
 * @route   DELETE /api/categories/:id
 * @access  Private (ADMIN, MANAGER)
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
  remove,
};
