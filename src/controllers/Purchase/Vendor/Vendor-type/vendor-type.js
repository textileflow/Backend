const vendorTypeService = require("../../../../services/Purchase/Vendor/Vendor-type/vendor-type");
const { sendSuccess } = require("../../../../utils/Common/apiResponse");

/**
 * @desc    Create a new vendor type
 * @route   POST /api/purchase/vendors/vendor-type
 * @access  Private (ADMIN, MANAGER)
 */
const create = async (req, res, next) => {
  try {
    const vendorType = await vendorTypeService.createVendorType(req.body);
    return sendSuccess(res, 201, "Vendor type created successfully", vendorType);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all vendor types with pagination & search (?page=1&per_page=10&search=)
 * @route   GET /api/purchase/vendors/vendor-type
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getAll = async (req, res, next) => {
  try {
    const { vendorTypes, pagination } =
      await vendorTypeService.getAllVendorTypes(req.query);
    return sendSuccess(
      res,
      200,
      "Vendor types retrieved successfully",
      vendorTypes,
      pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single vendor type by numeric vendorTypeId
 * @route   GET /api/purchase/vendors/vendor-type/:id
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const getById = async (req, res, next) => {
  try {
    const vendorType = await vendorTypeService.getVendorTypeById(req.params.id);
    return sendSuccess(res, 200, "Vendor type retrieved successfully", vendorType);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vendor type by numeric vendorTypeId
 * @route   PUT /api/purchase/vendors/vendor-type/:id
 * @access  Private (ADMIN, MANAGER)
 */
const update = async (req, res, next) => {
  try {
    const vendorType = await vendorTypeService.updateVendorType(
      req.params.id,
      req.body
    );
    return sendSuccess(res, 200, "Vendor type updated successfully", vendorType);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vendor type status (Active / Inactive)
 * @route   PATCH /api/purchase/vendors/vendor-type/:id/status
 * @access  Private (ADMIN, MANAGER)
 */
const updateStatus = async (req, res, next) => {
  try {
    const vendorType = await vendorTypeService.updateVendorTypeStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(
      res,
      200,
      "Vendor type status updated successfully",
      vendorType
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vendor type by numeric vendorTypeId
 * @route   DELETE /api/purchase/vendors/vendor-type/:id
 * @access  Private (ADMIN)
 */
const remove = async (req, res, next) => {
  try {
    await vendorTypeService.deleteVendorType(req.params.id);
    return sendSuccess(res, 200, "Vendor type deleted successfully");
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
