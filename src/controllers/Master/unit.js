const unitService = require("../../services/Master/unit");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const unit = await unitService.createUnit(req.body);
    return sendSuccess(res, 201, "Unit created successfully", unit);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const units = await unitService.getAllUnits();
    return sendSuccess(res, 200, "Units retrieved successfully", units);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll };
