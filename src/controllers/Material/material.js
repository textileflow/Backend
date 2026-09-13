const materialService = require("../../services/Material/material");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const material = await materialService.createMaterial(req.body);
    return sendSuccess(res, 201, "Material created successfully", material);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { materials, pagination } = await materialService.getAllMaterials(req.query);
    return sendSuccess(res, 200, "Materials retrieved successfully", materials, pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const material = await materialService.getMaterialById(req.params.id);
    return sendSuccess(res, 200, "Material retrieved successfully", material);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const material = await materialService.updateMaterial(req.params.id, req.body);
    return sendSuccess(res, 200, "Material updated successfully", material);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await materialService.deleteMaterial(req.params.id);
    return sendSuccess(res, 200, "Material deleted successfully", result);
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
