const inventoryService = require("../../services/Inventory/inventory");
const { sendSuccess } = require("../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const result = await inventoryService.createInventoryItem(req.body);
    return sendSuccess(res, 201, "Inventory item created successfully", result);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { items, pagination } = await inventoryService.getAllInventoryItems(req.query);
    return sendSuccess(res, 200, "Inventory items retrieved successfully", items, pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await inventoryService.getInventoryById(req.params.id);
    return sendSuccess(res, 200, "Inventory item retrieved successfully", result);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await inventoryService.updateInventoryItem(req.params.id, req.body);
    return sendSuccess(res, 200, "Inventory item updated successfully", result);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await inventoryService.deleteInventoryItem(req.params.id);
    return sendSuccess(res, 200, "Inventory item deleted successfully");
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
