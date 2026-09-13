const threadShadeService = require("../../services/Material/threadShade");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const shade = await threadShadeService.createShade(req.body);
    return sendSuccess(res, 201, "Thread Shade created successfully", shade);
  } catch (error) {
    next(error);
  }
};

const bulkCreate = async (req, res, next) => {
  try {
    const { catalogId, shades } = req.body;
    const created = await threadShadeService.bulkCreateShades(catalogId, shades);
    return sendSuccess(res, 201, `${created.length} Thread Shades uploaded successfully`, created);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { shades, pagination } = await threadShadeService.getAllShades(req.query);
    return sendSuccess(res, 200, "Thread Shades retrieved successfully", shades, pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const shade = await threadShadeService.getShadeById(req.params.id);
    return sendSuccess(res, 200, "Thread Shade retrieved successfully", shade);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, bulkCreate, getAll, getById };
