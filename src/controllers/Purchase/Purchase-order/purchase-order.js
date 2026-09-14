const purchaseOrderService = require("../../../services/Purchase/Purchase-order/purchase-order");
const { sendSuccess } = require("../../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const result = await purchaseOrderService.createPurchaseOrder(req.body);
    return sendSuccess(res, 201, "Purchase order created successfully", result);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { purchaseOrders, pagination } =
      await purchaseOrderService.getAllPurchaseOrders(req.query);
    return sendSuccess(
      res,
      200,
      "Purchase orders retrieved successfully",
      purchaseOrders,
      pagination
    );
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await purchaseOrderService.getPurchaseOrderById(
      req.params.id
    );
    return sendSuccess(
      res,
      200,
      "Purchase order retrieved successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await purchaseOrderService.updatePurchaseOrder(
      req.params.id,
      req.body
    );
    return sendSuccess(res, 200, "Purchase order updated successfully", result);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const result = await purchaseOrderService.updatePurchaseOrderStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(
      res,
      200,
      "Purchase order status updated successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await purchaseOrderService.deletePurchaseOrder(req.params.id);
    return sendSuccess(res, 200, "Purchase order deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  updateStatus,
  remove,
};
