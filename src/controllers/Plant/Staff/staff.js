const staffService = require("../../../services/Plant/Staff/staff");
const { sendSuccess } = require("../../../utils/Common/apiResponse");

/**
 * @desc    Create a new Staff member (Worker / Designer)
 * @route   POST /api/plants/staff
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const staff = await staffService.createStaff(req.body);
    return sendSuccess(res, 201, "Staff member created successfully", staff);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Staff members (filter by type: Worker/Designer, etc.)
 * @route   GET /api/plants/staff
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { staff, pagination } = await staffService.getAllStaff(req.query);
    return sendSuccess(res, 200, "Staff list retrieved successfully", staff, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Staff member by numeric ID
 * @route   GET /api/plants/staff/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const staff = await staffService.getStaffById(req.params.id);
    return sendSuccess(res, 200, "Staff member retrieved successfully", staff);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Staff member by numeric ID
 * @route   PUT /api/plants/staff/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const staff = await staffService.updateStaff(req.params.id, req.body);
    return sendSuccess(res, 200, "Staff member updated successfully", staff);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Staff Status
 * @route   PATCH /api/plants/staff/:id/status
 * @access  Private (ADMIN, MANAGER)
 */
const updateStatus = async (req, res, next) => {
  try {
    const staff = await staffService.updateStaffStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(res, 200, "Staff status updated successfully", staff);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Staff member by numeric ID
 * @route   DELETE /api/plants/staff/:id
 * @access  Private (ADMIN)
 */
const remove = async (req, res, next) => {
  try {
    await staffService.deleteStaff(req.params.id);
    return sendSuccess(res, 200, "Staff member deleted successfully");
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
