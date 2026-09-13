const threadBrandService = require("../../services/Material/threadBrand");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const brand = await threadBrandService.createBrand(req.body);
    return sendSuccess(res, 201, "Thread Brand created successfully", brand);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const brands = await threadBrandService.getAllBrands();
    return sendSuccess(res, 200, "Thread Brands retrieved successfully", brands);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll };
