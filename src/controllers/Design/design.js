const designService = require("../../services/Design/design");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * @desc    Create a new Design Master record & V1 Version
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
 * @desc    Create a new Version (V2, V3...) for an existing Design Master
 * @route   POST /api/designs/:id/versions
 * @access  Private (ADMIN, MANAGER)
 */
const createVersion = async (req, res, next) => {
  try {
    const version = await designService.createDesignVersion(
      req.params.id,
      req.body,
      req.files
    );
    return sendSuccess(res, 201, "New Design Version created successfully", version);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Designs with pagination & search (?page=1&per_page=10&search=&merchantId=&status=&category=&designType=)
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
 * @desc    Get Design Dashboard Metrics Summary
 * @route   GET /api/designs/dashboard
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getDashboard = async (req, res, next) => {
  try {
    const metrics = await designService.getDashboardMetrics();
    return sendSuccess(res, 200, "Dashboard metrics retrieved successfully", metrics);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Design by numeric designId (?version=V2)
 * @route   GET /api/designs/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const versionNumber = req.query.version || null;
    const design = await designService.getDesignById(req.params.id, versionNumber);
    return sendSuccess(res, 200, "Design retrieved successfully", design);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Design approval workflow status (Draft -> Digitizing -> Sampling -> Approval Pending -> Approved)
 * @route   PATCH /api/designs/:id/status
 * @access  Private (ADMIN, MANAGER)
 */
const updateStatus = async (req, res, next) => {
  try {
    const { versionNumber, status, comments } = req.body;
    const userDetails = {
      name: req.user ? req.user.name : "System User",
      comments,
    };

    const design = await designService.updateDesignStatus(
      req.params.id,
      versionNumber,
      status,
      userDetails
    );

    return sendSuccess(res, 200, `Design status updated to ${status} successfully`, design);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Job Card Production Payload for downstream execution
 * @route   GET /api/designs/:id/job-card
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getJobCardData = async (req, res, next) => {
  try {
    const versionNumber = req.query.version || null;
    const payload = await designService.getJobCardData(req.params.id, versionNumber);
    return sendSuccess(res, 200, "Job Card payload generated successfully", payload);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Design & all associated versions by numeric designId
 * @route   DELETE /api/designs/:id
 * @access  Private (ADMIN)
 */
const remove = async (req, res, next) => {
  try {
    const result = await designService.deleteDesign(req.params.id);
    return sendSuccess(res, 200, "Design deleted successfully", result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  createVersion,
  getAll,
  getDashboard,
  getById,
  updateStatus,
  getJobCardData,
  remove,
};
