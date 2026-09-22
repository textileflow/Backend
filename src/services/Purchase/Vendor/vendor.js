const Vendor = require("../../../models/Purchase/Vendor/vendor");
const VendorType = require("../../../models/Purchase/Vendor/Vendor-type/vendor-type");
const CustomError = require("../../../utils/Common/customError");
const { uploadToCloudinary } = require("../../../config/cloudinary");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../../utils/Common/pagination");

const parseVendorTypeIds = (input) => {
  if (input === undefined || input === null || input === "") {
    return [];
  }
  let arr = input;
  if (typeof input === "string") {
    try {
      arr = JSON.parse(input);
    } catch (e) {
      arr = input.split(",").map((s) => s.trim());
    }
  }
  if (!Array.isArray(arr)) {
    arr = [arr];
  }
  return arr.map((item) => Number(item)).filter((num) => !isNaN(num));
};

const parsePaymentTerm = (inputTerm) => {
  if (inputTerm === undefined || inputTerm === null || inputTerm === "") {
    return "30 Days";
  }

  const str = String(inputTerm).trim();
  const predefined = ["7 Days", "15 Days", "30 Days", "45 Days", "60 Days"];

  if (predefined.includes(str)) {
    return str;
  }
  if (str.toLowerCase() === "immediate" || str === "0") {
    return "Immediate";
  }
  if (!isNaN(Number(str))) {
    const num = Number(str);
    if (num === 0) return "Immediate";
    const match = predefined.find((p) => p === `${num} Days`);
    return match || `${num} Days`;
  }
  return str;
};

/**
 * Format vendor object safely with populated VendorType details array
 */
const formatVendor = async (vendor) => {
  if (!vendor) return {};
  const obj = typeof vendor.toJSON === "function" ? vendor.toJSON() : { ...vendor };

  const rawTypeIds = obj.vendorTypeId || obj.vendorType || [];
  const typeIds = Array.isArray(rawTypeIds) ? rawTypeIds : [rawTypeIds];

  if (typeIds.length > 0) {
    const vendorTypes = await VendorType.find({ vendorTypeId: { $in: typeIds } });
    obj.vendorType = vendorTypes.map((vt) => ({
      id: vt.vendorTypeId,
      name: vt.name,
    }));
  } else {
    obj.vendorType = [];
  }

  delete obj.vendorTypeId;

  return obj;
};

class VendorService {
  async createVendor(data, files = {}) {
    const compName = (data.companyName || data.vendorName || "").trim();
    const persName = (data.personName || data.contactPerson || "").trim();
    const mob = (data.mobile || "").trim();
    const rawTerm = data.paymentTerm !== undefined ? data.paymentTerm : data.paymentTerms;
    const term = parsePaymentTerm(rawTerm);
    const gstVal = (data.gstNumber || data.gstNo || "").trim().toUpperCase();
    const panVal = (data.panCard || data.panNo || "").trim().toUpperCase();

    if (data.vendorCode) {
      const existing = await Vendor.findOne({
        vendorCode: data.vendorCode.trim().toUpperCase(),
      });
      if (existing) throw new CustomError("Vendor code already exists", 400);
    }

    let gstCertUrl = data.gstCertificate || "";
    let panImgUrl = data.panCardImage || "";

    if (files && files.gstCertificate && files.gstCertificate[0]) {
      const result = await uploadToCloudinary(
        files.gstCertificate[0].buffer,
        "upload-single",
      );
      gstCertUrl = result.path;
    }

    if (files && files.panCardImage && files.panCardImage[0]) {
      const result = await uploadToCloudinary(
        files.panCardImage[0].buffer,
        "upload-single",
      );
      panImgUrl = result.path;
    }

    const rawVendorType =
      data.vendorTypeId !== undefined
        ? data.vendorTypeId
        : data.vendorType !== undefined
        ? data.vendorType
        : data.vendorTypes;
    const vendorTypeIds = parseVendorTypeIds(rawVendorType);

    if (vendorTypeIds.length > 0) {
      const validTypesCount = await VendorType.countDocuments({
        vendorTypeId: { $in: vendorTypeIds },
        status: "Active",
      });
      if (validTypesCount !== vendorTypeIds.length) {
        throw new CustomError(
          "One or more invalid or inactive Vendor Type IDs provided",
          400
        );
      }
    }

    const vendor = await Vendor.create({
      vendorCode: data.vendorCode
        ? data.vendorCode.trim().toUpperCase()
        : undefined,
      companyName: compName,
      personName: persName,
      mobile: mob,
      email: data.email ? data.email.trim().toLowerCase() : "",
      gstNumber: gstVal,
      gstCertificate: gstCertUrl,
      panCard: panVal,
      panCardImage: panImgUrl,
      paymentTerm: term,
      address: data.address ? data.address.trim() : "",
      note: data.note ? data.note.trim() : "",
      vendorTypeId: vendorTypeIds,
      status: data.status || "Active",
    });

    return await formatVendor(vendor);
  }

  async getAllVendors(queryParams = {}) {
    const { page, limit, skip, search, status } = getPaginationQueryParams(queryParams);
    const { paymentTerm, vendorType, vendorTypeId } = queryParams;
    const query = {};

    if (status) {
      query.status = new RegExp(`^${status}$`, "i");
    }
    if (paymentTerm) query.paymentTerm = paymentTerm;

    const rawType =
      queryParams.vendorType !== undefined
        ? queryParams.vendorType
        : queryParams.vendorTypeId;
    if (rawType) {
      const typeIds = parseVendorTypeIds(rawType);
      if (typeIds.length > 0) {
        query.vendorTypeId = { $in: typeIds };
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { vendorCode: searchRegex },
        { companyName: searchRegex },
        { personName: searchRegex },
        { mobile: searchRegex },
        { gstNumber: searchRegex },
        { panCard: searchRegex },
      ];
    }

    const totalCount = await Vendor.countDocuments(query);
    const vendors = await Vendor.find(query)
      .sort({ vendorId: -1 })
      .skip(skip)
      .limit(limit);
    const formattedVendors = await Promise.all(
      vendors.map((v) => formatVendor(v))
    );
    const pagination = buildPaginationData(totalCount, page, limit);

    return { vendors: formattedVendors, pagination };
  }

  async getVendorById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) throw new CustomError("Invalid Vendor ID", 400);

    const vendor = await Vendor.findOne({ vendorId: numericId });
    if (!vendor) throw new CustomError("Vendor not found", 404);
    return await formatVendor(vendor);
  }

  async updateVendor(id, updateData, files = {}) {
    const numericId = Number(id);
    if (isNaN(numericId)) throw new CustomError("Invalid Vendor ID", 400);

    const vendor = await Vendor.findOne({ vendorId: numericId });
    if (!vendor) throw new CustomError("Vendor not found", 404);

    if (updateData.companyName || updateData.vendorName) {
      vendor.companyName = (
        updateData.companyName || updateData.vendorName
      ).trim();
    }

    if (updateData.personName || updateData.contactPerson) {
      vendor.personName = (
        updateData.personName || updateData.contactPerson
      ).trim();
    }

    if (updateData.mobile) vendor.mobile = updateData.mobile.trim();
    if (updateData.email !== undefined)
      vendor.email = updateData.email.trim().toLowerCase();
    if (updateData.gstNumber !== undefined || updateData.gstNo !== undefined) {
      vendor.gstNumber = (updateData.gstNumber || updateData.gstNo || "")
        .trim()
        .toUpperCase();
    }
    if (updateData.panCard !== undefined || updateData.panNo !== undefined) {
      vendor.panCard = (updateData.panCard || updateData.panNo || "")
        .trim()
        .toUpperCase();
    }

    if (updateData.paymentTerm !== undefined || updateData.paymentTerms !== undefined) {
      const rawTerm = updateData.paymentTerm !== undefined ? updateData.paymentTerm : updateData.paymentTerms;
      vendor.paymentTerm = parsePaymentTerm(rawTerm);
    }

    if (updateData.address !== undefined)
      vendor.address = updateData.address.trim();
    if (updateData.note !== undefined)
      vendor.note = updateData.note.trim();
    if (updateData.status) vendor.status = updateData.status;

    if (
      updateData.vendorTypeId !== undefined ||
      updateData.vendorType !== undefined ||
      updateData.vendorTypes !== undefined
    ) {
      const rawVendorType =
        updateData.vendorTypeId !== undefined
          ? updateData.vendorTypeId
          : updateData.vendorType !== undefined
          ? updateData.vendorType
          : updateData.vendorTypes;
      const vendorTypeIds = parseVendorTypeIds(rawVendorType);

      if (vendorTypeIds.length > 0) {
        const validTypesCount = await VendorType.countDocuments({
          vendorTypeId: { $in: vendorTypeIds },
          status: "Active",
        });
        if (validTypesCount !== vendorTypeIds.length) {
          throw new CustomError(
            "One or more invalid or inactive Vendor Type IDs provided",
            400
          );
        }
      }
      vendor.vendorTypeId = vendorTypeIds;
    }

    if (updateData.gstCertificate !== undefined)
      vendor.gstCertificate = updateData.gstCertificate.trim();
    if (updateData.panCardImage !== undefined)
      vendor.panCardImage = updateData.panCardImage.trim();

    if (files && files.gstCertificate && files.gstCertificate[0]) {
      const result = await uploadToCloudinary(
        files.gstCertificate[0].buffer,
        "upload-single",
      );
      vendor.gstCertificate = result.path;
    }

    if (files && files.panCardImage && files.panCardImage[0]) {
      const result = await uploadToCloudinary(
        files.panCardImage[0].buffer,
        "upload-single",
      );
      vendor.panCardImage = result.path;
    }

    await vendor.save();
    return await formatVendor(vendor);
  }

  async updateVendorStatus(id, status) {
    const numericId = Number(id);
    if (isNaN(numericId)) throw new CustomError("Invalid Vendor ID", 400);

    const vendor = await Vendor.findOne({ vendorId: numericId });
    if (!vendor) throw new CustomError("Vendor not found", 404);

    vendor.status = status;
    await vendor.save();
    return await formatVendor(vendor);
  }

  async deleteVendor(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) throw new CustomError("Invalid Vendor ID", 400);

    const vendor = await Vendor.findOne({ vendorId: numericId });
    if (!vendor) throw new CustomError("Vendor not found", 404);

    await vendor.softDelete();
    return { id: numericId };
  }
}

module.exports = new VendorService();
