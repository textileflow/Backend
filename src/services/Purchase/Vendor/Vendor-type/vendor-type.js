const VendorType = require("../../../../models/Purchase/Vendor/Vendor-type/vendor-type");
const Vendor = require("../../../../models/Purchase/Vendor/vendor");
const CustomError = require("../../../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../../../utils/Common/pagination");

class VendorTypeService {
  /**
   * Create a new vendor type
   */
  async createVendorType(data) {
    const existingType = await VendorType.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
    });

    if (existingType) {
      throw new CustomError("Vendor type with this name already exists", 400);
    }

    const vendorType = await VendorType.create({
      name: data.name.trim(),
      note: data.note ? data.note.trim() : "",
      status: "Active",
    });

    return vendorType;
  }

  /**
   * Get all vendor types sorted by vendorTypeId with pagination & search
   */
  async getAllVendorTypes(queryParams = {}) {
    const { page, limit, skip, search } = getPaginationQueryParams(queryParams);
    const query = {};

    if (search) {
      query.name = new RegExp(search, "i");
    }

    if (queryParams.status) {
      query.status = new RegExp(`^${queryParams.status.trim()}$`, "i");
    }

    const totalCount = await VendorType.countDocuments(query);
    const vendorTypes = await VendorType.find(query)
      .sort({ vendorTypeId: 1 })
      .skip(skip)
      .limit(limit);

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      vendorTypes,
      pagination,
    };
  }

  /**
   * Get vendor type by numeric vendorTypeId
   */
  async getVendorTypeById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Vendor Type ID", 400);
    }

    const vendorType = await VendorType.findOne({ vendorTypeId: numericId });
    if (!vendorType) {
      throw new CustomError("Vendor type not found", 404);
    }
    return vendorType;
  }

  /**
   * Update vendor type by numeric vendorTypeId
   */
  async updateVendorType(id, data) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Vendor Type ID", 400);
    }

    const vendorType = await VendorType.findOne({ vendorTypeId: numericId });
    if (!vendorType) {
      throw new CustomError("Vendor type not found", 404);
    }

    if (data.name && data.name.trim() !== vendorType.name) {
      const existingType = await VendorType.findOne({
        name: { $regex: new RegExp(`^${data.name.trim()}$`, "i") },
        vendorTypeId: { $ne: numericId },
      });

      if (existingType) {
        throw new CustomError("Vendor type with this name already exists", 400);
      }

      vendorType.name = data.name.trim();
    }

    if (data.note !== undefined) {
      vendorType.note = data.note ? data.note.trim() : "";
    }

    if (data.status) {
      vendorType.status = data.status;
    }

    await vendorType.save();
    return vendorType;
  }

  /**
   * Update Vendor Type Status (Active / Inactive)
   */
  async updateVendorTypeStatus(id, status) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Vendor Type ID", 400);
    }

    const vendorType = await VendorType.findOne({ vendorTypeId: numericId });
    if (!vendorType) {
      throw new CustomError("Vendor type not found", 404);
    }

    vendorType.status = status;
    await vendorType.save();
    return vendorType;
  }

  /**
   * Delete vendor type by numeric vendorTypeId (with dependency check and soft delete)
   */
  async deleteVendorType(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Vendor Type ID", 400);
    }

    const vendorType = await VendorType.findOne({ vendorTypeId: numericId });
    if (!vendorType) {
      throw new CustomError("Vendor type not found", 404);
    }

    // Check if vendors are linked
    const linkedVendors = await Vendor.countDocuments({
      $or: [{ vendorTypeId: numericId }, { vendorType: numericId }],
    });
    if (linkedVendors > 0) {
      throw new CustomError(
        "Cannot delete vendor type: It is associated with vendors",
        400
      );
    }

    await vendorType.softDelete();
    return { id: numericId };
  }
}

module.exports = new VendorTypeService();
