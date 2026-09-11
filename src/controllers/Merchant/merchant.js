const merchantService = require("../../services/Merchant/merchant");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * Format merchant instance safely into JSON object
 */
const formatMerchant = (merchant) => {
  if (!merchant) return {};
  return typeof merchant.toJSON === "function" ? merchant.toJSON() : merchant;
};

/**
 * @desc    Create a new merchant
 * @route   POST /api/merchants
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const merchant = await merchantService.createMerchant(req.body);
    return sendSuccess(
      res,
      201,
      "Merchant created successfully",
      formatMerchant(merchant)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all merchants (with categoryId, subCategoryId & search filtering)
 * @route   GET /api/merchants
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { categoryId, subCategoryId, search } = req.query;
    const merchants = await merchantService.getAllMerchants({
      categoryId,
      subCategoryId,
      search,
    });
    const formattedMerchants = merchants.map((m) => formatMerchant(m));
    return sendSuccess(
      res,
      200,
      "Merchants fetched successfully",
      formattedMerchants
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single merchant by ID
 * @route   GET /api/merchants/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const merchant = await merchantService.getMerchantById(req.params.id);
    return sendSuccess(
      res,
      200,
      "Merchant fetched successfully",
      formatMerchant(merchant)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update merchant by ID
 * @route   PUT /api/merchants/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const merchant = await merchantService.updateMerchant(req.params.id, req.body);
    return sendSuccess(
      res,
      200,
      "Merchant updated successfully",
      formatMerchant(merchant)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete merchant by ID
 * @route   DELETE /api/merchants/:id
 * @access  Private (ADMIN, MANAGER)
 */
const remove = async (req, res, next) => {
  try {
    await merchantService.deleteMerchant(req.params.id);
    return sendSuccess(res, 200, "Merchant deleted successfully");
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
