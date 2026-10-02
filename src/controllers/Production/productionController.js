const productionService = require("../../services/Production/production");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const result = await productionService.createProductionJob(req.body);
    return sendSuccess(res, 201, "Production job card created successfully", result);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { jobs, pagination } = await productionService.getAllProductionJobs(req.query);
    return sendSuccess(res, 200, "Production job cards retrieved successfully", jobs, pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await productionService.getProductionById(req.params.id);
    return sendSuccess(res, 200, "Production job card retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await productionService.updateProductionJob(req.params.id, req.body);
    return sendSuccess(res, 200, "Production job card updated successfully", result);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await productionService.deleteProductionJob(req.params.id);
    return sendSuccess(res, 200, "Production job card deleted successfully");
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
