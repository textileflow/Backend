const PurchaseOrder = require("../../../models/Purchase/Purchase-order/purchase-order");
const Vendor = require("../../../models/Purchase/Vendor/vendor");
const VendorType = require("../../../models/Purchase/Vendor/Vendor-type/vendor-type");
const CustomError = require("../../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../../utils/Common/pagination");

/**
 * Helper to format Purchase Order JSON with populated Vendor details
 */
const formatPurchaseOrder = async (po) => {
  if (!po) return {};
  const obj = typeof po.toJSON === "function" ? po.toJSON() : { ...po };

  if (obj.vendorId !== undefined && obj.vendorId !== null) {
    const vendor = await Vendor.findOne({ vendorId: obj.vendorId });
    if (vendor) {
      const typeIds = vendor.vendorTypeId || [];
      const vendorTypes =
        typeIds.length > 0
          ? await VendorType.find({ vendorTypeId: { $in: typeIds } })
          : [];

      obj.vendor = {
        id: vendor.vendorId,
        vendorCode: vendor.vendorCode,
        companyName: vendor.companyName,
        personName: vendor.personName,
        mobile: vendor.mobile,
        email: vendor.email || "",
        gstNumber: vendor.gstNumber || "",
        panCard: vendor.panCard || "",
        address: vendor.address || "",
        paymentTerm: vendor.paymentTerm || "",
        status: vendor.status || "Active",
        vendorType: vendorTypes.map((vt) => ({
          id: vt.vendorTypeId,
          name: vt.name,
        })),
      };
    } else {
      obj.vendor = null;
    }
  } else {
    obj.vendor = null;
  }

  delete obj.vendorId;
  return obj;
};

class PurchaseOrderService {
  /**
   * Create a new Purchase Order
   */
  async createPurchaseOrder(data) {
    const numVendorId = Number(data.vendorId !== undefined ? data.vendorId : data.vendor);
    if (isNaN(numVendorId)) {
      throw new CustomError("Invalid Vendor ID", 400);
    }

    const vendor = await Vendor.findOne({ vendorId: numVendorId });
    if (!vendor) {
      throw new CustomError("Selected Vendor does not exist", 404);
    }
    if (vendor.status === "Inactive") {
      throw new CustomError("Cannot create Purchase Order for an inactive Vendor", 400);
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new CustomError("Purchase Order must contain at least one item", 400);
    }

    const items = data.items.map((item) => ({
      materialType: item.materialType ? item.materialType.trim() : "",
      name: (item.name || item.itemName || "").trim(),
      color: item.color ? item.color.trim() : "",
      qty: Number(item.qty || item.quantity),
      unit: item.unit ? item.unit.trim() : "PCS",
      rate: Number(item.rate || item.price),
    }));

    const po = await PurchaseOrder.create({
      vendorId: numVendorId,
      poDate: data.poDate ? new Date(data.poDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      expDeliveryDate: data.expDeliveryDate ? new Date(data.expDeliveryDate) : null,
      discountType: data.discountType || "Percentage",
      discountValue: data.discountValue !== undefined ? Number(data.discountValue) : 0,
      gstRate: data.gstRate !== undefined ? Number(data.gstRate) : 0,
      shippingCharge: data.shippingCharge !== undefined ? Number(data.shippingCharge) : 0,
      status: data.status || "Pending",
      notes: data.notes ? data.notes.trim() : "",
      termsAndConditions: data.termsAndConditions ? data.termsAndConditions.trim() : "",
      items,
    });

    return await formatPurchaseOrder(po);
  }

  /**
   * Get all Purchase Orders with filtering, search & pagination
   */
  async getAllPurchaseOrders(queryParams = {}) {
    const { page, limit, skip, search, status } = getPaginationQueryParams(queryParams);
    const { vendorId, discountType, fromDate, toDate } = queryParams;
    const query = {};

    if (status) {
      query.status = new RegExp(`^${status}$`, "i");
    }

    if (vendorId) {
      const numVId = Number(vendorId);
      if (!isNaN(numVId)) query.vendorId = numVId;
    }

    if (discountType) {
      query.discountType = new RegExp(`^${discountType}$`, "i");
    }

    if (fromDate || toDate) {
      query.poDate = {};
      if (fromDate) query.poDate.$gte = new Date(fromDate);
      if (toDate) query.poDate.$lte = new Date(toDate);
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const matchingVendors = await Vendor.find({
        $or: [
          { companyName: searchRegex },
          { personName: searchRegex },
          { vendorCode: searchRegex },
        ],
      }).select("vendorId");
      const vendorIds = matchingVendors.map((v) => v.vendorId);

      query.$or = [
        { poNumber: searchRegex },
        { notes: searchRegex },
        { termsAndConditions: searchRegex },
        { "items.name": searchRegex },
        { "items.materialType": searchRegex },
        { "items.color": searchRegex },
      ];

      if (vendorIds.length > 0) {
        query.$or.push({ vendorId: { $in: vendorIds } });
      }
    }

    const totalCount = await PurchaseOrder.countDocuments(query);
    const orders = await PurchaseOrder.find(query)
      .sort({ purchaseOrderId: -1 })
      .skip(skip)
      .limit(limit);

    const formattedOrders = await Promise.all(
      orders.map((po) => formatPurchaseOrder(po))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      purchaseOrders: formattedOrders,
      pagination,
    };
  }

  /**
   * Get Purchase Order by ID (numeric purchaseOrderId or string poNumber)
   */
  async getPurchaseOrderById(id) {
    let query;
    if (!isNaN(Number(id))) {
      query = { purchaseOrderId: Number(id) };
    } else {
      query = { poNumber: String(id).trim().toUpperCase() };
    }

    const po = await PurchaseOrder.findOne(query);
    if (!po) {
      throw new CustomError("Purchase Order not found", 404);
    }

    return await formatPurchaseOrder(po);
  }

  /**
   * Update Purchase Order by ID
   */
  async updatePurchaseOrder(id, updateData) {
    let query;
    if (!isNaN(Number(id))) {
      query = { purchaseOrderId: Number(id) };
    } else {
      query = { poNumber: String(id).trim().toUpperCase() };
    }

    const po = await PurchaseOrder.findOne(query);
    if (!po) {
      throw new CustomError("Purchase Order not found", 404);
    }

    if (updateData.vendorId !== undefined || updateData.vendor !== undefined) {
      const numVId = Number(
        updateData.vendorId !== undefined ? updateData.vendorId : updateData.vendor
      );
      if (isNaN(numVId)) {
        throw new CustomError("Invalid Vendor ID", 400);
      }
      const vendor = await Vendor.findOne({ vendorId: numVId });
      if (!vendor) {
        throw new CustomError("Selected Vendor does not exist", 404);
      }
      if (vendor.status === "Inactive") {
        throw new CustomError("Cannot select an inactive Vendor", 400);
      }
      po.vendorId = numVId;
    }

    if (updateData.poDate !== undefined) po.poDate = new Date(updateData.poDate);
    if (updateData.dueDate !== undefined)
      po.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    if (updateData.expDeliveryDate !== undefined)
      po.expDeliveryDate = updateData.expDeliveryDate
        ? new Date(updateData.expDeliveryDate)
        : null;

    if (updateData.discountType !== undefined)
      po.discountType = updateData.discountType;
    if (updateData.discountValue !== undefined)
      po.discountValue = Number(updateData.discountValue);
    if (updateData.gstRate !== undefined) po.gstRate = Number(updateData.gstRate);
    if (updateData.shippingCharge !== undefined)
      po.shippingCharge = Number(updateData.shippingCharge);
    if (updateData.status !== undefined) po.status = updateData.status;
    if (updateData.notes !== undefined) po.notes = updateData.notes.trim();
    if (updateData.termsAndConditions !== undefined)
      po.termsAndConditions = updateData.termsAndConditions.trim();

    if (Array.isArray(updateData.items) && updateData.items.length > 0) {
      po.items = updateData.items.map((item) => ({
        materialType: item.materialType ? item.materialType.trim() : "",
        name: (item.name || item.itemName || "").trim(),
        color: item.color ? item.color.trim() : "",
        qty: Number(item.qty || item.quantity),
        unit: item.unit ? item.unit.trim() : "PCS",
        rate: Number(item.rate || item.price),
      }));
    }

    await po.save();
    return await formatPurchaseOrder(po);
  }

  /**
   * Update Purchase Order Status
   */
  async updatePurchaseOrderStatus(id, status) {
    let query;
    if (!isNaN(Number(id))) {
      query = { purchaseOrderId: Number(id) };
    } else {
      query = { poNumber: String(id).trim().toUpperCase() };
    }

    const po = await PurchaseOrder.findOne(query);
    if (!po) {
      throw new CustomError("Purchase Order not found", 404);
    }

    po.status = status;
    await po.save();
    return await formatPurchaseOrder(po);
  }

  /**
   * Delete Purchase Order
   */
  async deletePurchaseOrder(id) {
    let query;
    if (!isNaN(Number(id))) {
      query = { purchaseOrderId: Number(id) };
    } else {
      query = { poNumber: String(id).trim().toUpperCase() };
    }

    const po = await PurchaseOrder.findOne(query);
    if (!po) {
      throw new CustomError("Purchase Order not found", 404);
    }

    await po.softDelete();
    return { id: po.purchaseOrderId, poNumber: po.poNumber };
  }
}

module.exports = new PurchaseOrderService();
