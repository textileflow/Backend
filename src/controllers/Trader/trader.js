const traderService = require("../../services/Trader/trader");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * Format trader instance safely into JSON object
 */
const formatTrader = (trader) => {
  if (!trader) return {};
  return typeof trader.toJSON === "function" ? trader.toJSON() : trader;
};

/**
 * @desc    Create a new trader
 * @route   POST /api/traders
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const trader = await traderService.createTrader(req.body);
    return sendSuccess(
      res,
      201,
      "Trader created successfully",
      formatTrader(trader)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all traders (with categoryId, subCategoryId & search filtering)
 * @route   GET /api/traders
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { categoryId, subCategoryId, search } = req.query;
    const traders = await traderService.getAllTraders({
      categoryId,
      subCategoryId,
      search,
    });
    const formattedTraders = traders.map((t) => formatTrader(t));
    return sendSuccess(
      res,
      200,
      "Traders fetched successfully",
      formattedTraders
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single trader by ID
 * @route   GET /api/traders/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const trader = await traderService.getTraderById(req.params.id);
    return sendSuccess(
      res,
      200,
      "Trader fetched successfully",
      formatTrader(trader)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update trader by ID
 * @route   PUT /api/traders/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const trader = await traderService.updateTrader(req.params.id, req.body);
    return sendSuccess(
      res,
      200,
      "Trader updated successfully",
      formatTrader(trader)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete trader by ID
 * @route   DELETE /api/traders/:id
 * @access  Private (ADMIN, MANAGER)
 */
const remove = async (req, res, next) => {
  try {
    await traderService.deleteTrader(req.params.id);
    return sendSuccess(res, 200, "Trader deleted successfully");
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
