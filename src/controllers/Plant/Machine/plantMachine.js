const plantMachineService = require("../../../services/Plant/Machine/plantMachine");
const { sendSuccess } = require("../../../utils/Common/apiResponse");

/**
 * @desc    Create a Machine (In-house / Subcontractor)
 * @route   POST /api/plants/machines
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const machine = await plantMachineService.createMachine(req.body);
    return sendSuccess(res, 201, "Plant machine created successfully", machine);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Plant / Subcontractor Machines with search & filters
 * @route   GET /api/plants/machines
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { machines, pagination } = await plantMachineService.getAllMachines(
      req.query
    );
    return sendSuccess(
      res,
      200,
      "Plant machines retrieved successfully",
      machines,
      pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single Plant Machine by numeric ID
 * @route   GET /api/plants/machines/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const machine = await plantMachineService.getMachineById(req.params.id);
    return sendSuccess(res, 200, "Plant machine retrieved successfully", machine);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Plant Machine by numeric ID
 * @route   PUT /api/plants/machines/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const machine = await plantMachineService.updateMachine(
      req.params.id,
      req.body
    );
    return sendSuccess(res, 200, "Plant machine updated successfully", machine);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Plant Machine Status (Active / Maintenance / Inactive)
 * @route   PATCH /api/plants/machines/:id/status
 * @access  Private (ADMIN, MANAGER)
 */
const updateStatus = async (req, res, next) => {
  try {
    const machine = await plantMachineService.updateMachineStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(
      res,
      200,
      "Plant machine status updated successfully",
      machine
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete Plant Machine by numeric ID
 * @route   DELETE /api/plants/machines/:id
 * @access  Private (ADMIN)
 */
const remove = async (req, res, next) => {
  try {
    await plantMachineService.deleteMachine(req.params.id);
    return sendSuccess(res, 200, "Plant machine deleted successfully");
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
