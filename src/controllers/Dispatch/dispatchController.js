const dispatchService = require("../../services/Dispatch/dispatch");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const result = await dispatchService.createDispatchRecord(req.body);
    return sendSuccess(res, 201, "Dispatch gate pass created successfully", result);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { dispatches, pagination } = await dispatchService.getAllDispatchRecords(req.query);
    return sendSuccess(res, 200, "Dispatch gate passes retrieved successfully", dispatches, pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await dispatchService.getDispatchById(req.params.id);
    return sendSuccess(res, 200, "Dispatch record retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await dispatchService.updateDispatchRecord(req.params.id, req.body);
    return sendSuccess(res, 200, "Dispatch record updated successfully", result);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await dispatchService.deleteDispatchRecord(req.params.id);
    return sendSuccess(res, 200, "Dispatch record deleted successfully");
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
