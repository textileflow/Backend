const fabricService = require("../../services/Material/fabric");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const fabric = await fabricService.createFabric(req.body);
    return sendSuccess(res, 201, "Fabric created successfully", fabric);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { fabrics, pagination } = await fabricService.getAllFabrics(req.query);
    return sendSuccess(res, 200, "Fabrics retrieved successfully", fabrics, pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const fabric = await fabricService.getFabricById(req.params.id);
    return sendSuccess(res, 200, "Fabric retrieved successfully", fabric);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById };
