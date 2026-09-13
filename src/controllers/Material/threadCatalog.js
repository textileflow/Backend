const threadCatalogService = require("../../services/Material/threadCatalog");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const catalog = await threadCatalogService.createCatalog(req.body);
    return sendSuccess(res, 201, "Thread Catalog created successfully", catalog);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const catalogs = await threadCatalogService.getAllCatalogs();
    return sendSuccess(res, 200, "Thread Catalogs retrieved successfully", catalogs);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const catalog = await threadCatalogService.getCatalogById(req.params.id);
    return sendSuccess(res, 200, "Thread Catalog retrieved successfully", catalog);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById };
