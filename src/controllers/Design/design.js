const designService = require("../../services/Design/design");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * @desc    Create a new Design
 * @route   POST /api/designs
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const design = await designService.createDesign(req.body, req.files);
    return sendSuccess(res, 201, "Design created successfully", design);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Designs
 * @route   GET /api/designs
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { designs, pagination } = await designService.getAllDesigns(req.query);
    return sendSuccess(
      res,
      200,
      "Designs retrieved successfully",
      designs,
      pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Design by numeric ID
 * @route   GET /api/designs/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const design = await designService.getDesignById(req.params.id);
    return sendSuccess(res, 200, "Design retrieved successfully", design);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Design by numeric ID
 * @route   PUT /api/designs/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const design = await designService.updateDesign(
      req.params.id,
      req.body,
      req.files
    );
    return sendSuccess(res, 200, "Design updated successfully", design);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Design Status
 * @route   PATCH /api/designs/:id/status
 * @access  Private (ADMIN, MANAGER)
 */
const updateStatus = async (req, res, next) => {
  try {
    const updatedDesign = await designService.updateDesignStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(res, 200, "Design status updated successfully", {
      id: updatedDesign.id,
      status: updatedDesign.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Design by numeric ID
 * @route   DELETE /api/designs/:id
 * @access  Private (ADMIN, MANAGER)
 */
const remove = async (req, res, next) => {
  try {
    await designService.deleteDesign(req.params.id);
    return sendSuccess(res, 200, "Design deleted successfully");
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
