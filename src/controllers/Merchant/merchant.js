const merchantService = require("../../services/Merchant/merchant");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * @desc    Create a new Merchant
 * @route   POST /api/merchants
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const merchant = await merchantService.createMerchant(req.body, req.files);
    return sendSuccess(res, 201, "Merchant created successfully", merchant);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Merchants with pagination & search (?page=1&per_page=10&search=&categoryId=&subCategoryId=)
 * @route   GET /api/merchants
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { merchants, pagination } = await merchantService.getAllMerchants(req.query);
    return sendSuccess(
      res,
      200,
      "Merchants retrieved successfully",
      merchants,
      pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Merchant by numeric ID
 * @route   GET /api/merchants/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const merchant = await merchantService.getMerchantById(req.params.id);
    return sendSuccess(res, 200, "Merchant retrieved successfully", merchant);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Merchant by numeric ID
 * @route   PUT /api/merchants/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const merchant = await merchantService.updateMerchant(
      req.params.id,
      req.body,
      req.files
    );
    return sendSuccess(res, 200, "Merchant updated successfully", merchant);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Merchant by numeric ID
 * @route   DELETE /api/merchants/:id
 * @access  Private (ADMIN)
 */
const remove = async (req, res, next) => {
  try {
    const result = await merchantService.deleteMerchant(req.params.id);
    return sendSuccess(res, 200, "Merchant deleted successfully", result);
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
