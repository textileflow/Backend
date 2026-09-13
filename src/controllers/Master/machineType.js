const machineTypeService = require("../../services/Master/machineType");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const item = await machineTypeService.createMachineType(req.body);
    return sendSuccess(res, 201, "Machine type created successfully", item);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const items = await machineTypeService.getAllMachineTypes();
    return sendSuccess(res, 200, "Machine types retrieved successfully", items);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll };
