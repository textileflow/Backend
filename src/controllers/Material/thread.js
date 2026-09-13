const threadService = require("../../services/Material/thread");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const thread = await threadService.createThread(req.body);
    return sendSuccess(res, 201, "Thread created successfully", thread);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { threads, pagination } = await threadService.getAllThreads(req.query);
    return sendSuccess(res, 200, "Threads retrieved successfully", threads, pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const thread = await threadService.getThreadById(req.params.id);
    return sendSuccess(res, 200, "Thread retrieved successfully", thread);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById };
