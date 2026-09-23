const designCostingService = require("../../../services/Design/Costing/costing");
const { sendSuccess } = require("../../../utils/Common/apiResponse");

/**
 * @desc    Create a new Design Costing
 * @route   POST /api/design-costings
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const costing = await designCostingService.createCosting(req.body);
    return sendSuccess(res, 201, "Design costing created successfully", costing);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Design Costings
 * @route   GET /api/design-costings
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { costings, pagination } = await designCostingService.getAllCostings(
      req.query
    );
    return sendSuccess(
      res,
      200,
      "Design costings retrieved successfully",
      costings,
      pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Design Costing by numeric ID
 * @route   GET /api/design-costings/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const costing = await designCostingService.getCostingById(req.params.id);
    return sendSuccess(res, 200, "Design costing retrieved successfully", costing);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Design Costing by Design ID
 * @route   GET /api/design-costings/design/:designId
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getByDesignId = async (req, res, next) => {
  try {
    const costing = await designCostingService.getCostingByDesignId(
      req.params.designId
    );
    return sendSuccess(
      res,
      200,
      "Design costing retrieved successfully",
      costing
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Design Costing by numeric ID
 * @route   PUT /api/design-costings/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const costing = await designCostingService.updateCosting(
      req.params.id,
      req.body
    );
    return sendSuccess(res, 200, "Design costing updated successfully", costing);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Design Costing Status
 * @route   PATCH /api/design-costings/:id/status
 * @access  Private (ADMIN, MANAGER)
 */
const updateStatus = async (req, res, next) => {
  try {
    const updatedCosting = await designCostingService.updateCostingStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(res, 200, "Design costing status updated successfully", {
      id: updatedCosting.id,
      status: updatedCosting.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Design Costing by numeric ID
 * @route   DELETE /api/design-costings/:id
 * @access  Private (ADMIN, MANAGER)
 */
const remove = async (req, res, next) => {
  try {
    await designCostingService.deleteCosting(req.params.id);
    return sendSuccess(res, 200, "Design costing deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  getByDesignId,
  update,
  updateStatus,
  remove,
};
