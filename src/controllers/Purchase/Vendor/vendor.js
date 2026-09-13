const vendorService = require("../../../services/Purchase/Vendor/vendor");
const { sendSuccess } = require("../../../utils/Common/apiResponse");

const create = async (req, res, next) => {
  try {
    const vendor = await vendorService.createVendor(req.body, req.files);
    return sendSuccess(res, 201, "Vendor created successfully", vendor);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { vendors, pagination } = await vendorService.getAllVendors(
      req.query,
    );
    return sendSuccess(
      res,
      200,
      "Vendors retrieved successfully",
      vendors,
      pagination,
    );
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    return sendSuccess(res, 200, "Vendor retrieved successfully", vendor);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const vendor = await vendorService.updateVendor(
      req.params.id,
      req.body,
      req.files,
    );
    return sendSuccess(res, 200, "Vendor updated successfully", vendor);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const vendor = await vendorService.updateVendorStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(res, 200, "Vendor status updated successfully", vendor);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await vendorService.deleteVendor(req.params.id);
    return sendSuccess(res, 200, "Vendor deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, update, updateStatus, remove };
