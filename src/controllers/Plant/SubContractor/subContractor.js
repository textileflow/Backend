const subContractorService = require("../../../services/Plant/SubContractor/subContractor");
const { sendSuccess } = require("../../../utils/Common/apiResponse");

/**
 * @desc    Create a new SubContractor
 * @route   POST /api/plants/subcontractors
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const subContractor = await subContractorService.createSubContractor(
      req.body,
      req.files
    );
    return sendSuccess(
      res,
      201,
      "SubContractor created successfully",
      subContractor
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all SubContractors with search & machine counts
 * @route   GET /api/plants/subcontractors
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { subContractors, pagination } =
      await subContractorService.getAllSubContractors(req.query);
    return sendSuccess(
      res,
      200,
      "SubContractors retrieved successfully",
      subContractors,
      pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single SubContractor by numeric ID with machine list
 * @route   GET /api/plants/subcontractors/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const subContractor = await subContractorService.getSubContractorById(
      req.params.id
    );
    return sendSuccess(
      res,
      200,
      "SubContractor retrieved successfully",
      subContractor
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update SubContractor by numeric ID
 * @route   PUT /api/plants/subcontractors/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const subContractor = await subContractorService.updateSubContractor(
      req.params.id,
      req.body,
      req.files
    );
    return sendSuccess(
      res,
      200,
      "SubContractor updated successfully",
      subContractor
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update SubContractor Status
 * @route   PATCH /api/plants/subcontractors/:id/status
 * @access  Private (ADMIN, MANAGER)
 */
const updateStatus = async (req, res, next) => {
  try {
    const subContractor = await subContractorService.updateSubContractorStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(
      res,
      200,
      "SubContractor status updated successfully",
      subContractor
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete SubContractor by numeric ID
 * @route   DELETE /api/plants/subcontractors/:id
 * @access  Private (ADMIN)
 */
const remove = async (req, res, next) => {
  try {
    await subContractorService.deleteSubContractor(req.params.id);
    return sendSuccess(res, 200, "SubContractor deleted successfully");
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
