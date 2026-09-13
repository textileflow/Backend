const machineService = require("../../services/Machine/machine");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const machine = await machineService.createMachine(req.body);
    return sendSuccess(res, 201, "Machine created successfully", machine);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { machines, pagination } = await machineService.getAllMachines(req.query);
    return sendSuccess(res, 200, "Machines retrieved successfully", machines, pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const machine = await machineService.getMachineById(req.params.id);
    return sendSuccess(res, 200, "Machine retrieved successfully", machine);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const machine = await machineService.updateMachine(req.params.id, req.body);
    return sendSuccess(res, 200, "Machine updated successfully", machine);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await machineService.deleteMachine(req.params.id);
    return sendSuccess(res, 200, "Machine deleted successfully", result);
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
