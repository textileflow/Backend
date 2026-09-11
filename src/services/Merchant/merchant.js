const Merchant = require("../../models/Merchant/merchant");
const Category = require("../../models/Merchant/Category/category");
const SubCategory = require("../../models/Merchant/SubCategory/subCategory");
const CustomError = require("../../utils/Common/customError");
const { uploadToCloudinary } = require("../../config/cloudinary");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../utils/Common/pagination");

/**
 * Helper to normalize single, array, or string subCategoryId input into an array of numbers
 */
const normalizeSubCategoryIds = (input) => {
  if (input === undefined || input === null) return [];
  let items = [];
  if (Array.isArray(input)) {
    items = input;
  } else if (typeof input === "string" && input.includes(",")) {
    items = input.split(",");
  } else {
    items = [input];
  }
  return items
    .map((item) => Number(String(item).trim()))
    .filter((num) => !isNaN(num));
};

/**
 * Format merchant object safely with populated Category & SubCategory details
 */
const formatMerchant = async (merchant) => {
  if (!merchant) return {};
  const obj = typeof merchant.toJSON === "function" ? merchant.toJSON() : { ...merchant };

  const category = await Category.findOne({ categoryId: obj.categoryId });
  
  const rawSubCatIds = obj.subCategoryId || obj.subCategoryIds;
  const subCategoryIds = normalizeSubCategoryIds(rawSubCatIds);
  const subCategories = await SubCategory.find({ subCategoryId: { $in: subCategoryIds } });

  if (category) {
    obj.category = {
      id: category.categoryId,
      name: category.name,
    };
  }

  const formattedSubCategories = subCategories.map((sc) => ({
    id: sc.subCategoryId,
    name: sc.name,
  }));

  // Keep single object if only 1 subcategory for legacy format, or array if multiple
  if (formattedSubCategories.length === 1) {
    obj.subCategory = formattedSubCategories[0];
  } else {
    obj.subCategory = formattedSubCategories;
  }

  delete obj.categoryId;
  delete obj.subCategoryId;

  return obj;
};

class MerchantService {
  /**
   * Create a new Merchant with support for multiple subCategoryIds & GST / PAN validation
   */
  async createMerchant(merchantData, files = {}) {
    const numCategoryId = Number(merchantData.categoryId);
    const subCatIds = normalizeSubCategoryIds(
      merchantData.subCategoryId !== undefined
        ? merchantData.subCategoryId
        : merchantData.subCategoryIds
    );

    if (isNaN(numCategoryId)) {
      throw new CustomError("Invalid Category ID", 400);
    }
    if (subCatIds.length === 0) {
      throw new CustomError("Invalid Sub Category ID(s)", 400);
    }

    // 1. Verify Category exists
    const category = await Category.findOne({ categoryId: numCategoryId });
    if (!category) {
      throw new CustomError("Selected Category does not exist", 404);
    }

    // 2. Verify all Sub Categories exist
    const subCategories = await SubCategory.find({
      subCategoryId: { $in: subCatIds },
    });

    if (subCategories.length !== new Set(subCatIds).size) {
      throw new CustomError("One or more selected Sub Categories do not exist", 404);
    }

    // 3. Verify all Sub Categories belong to selected Category
    for (const sc of subCategories) {
      if (sc.categoryId !== numCategoryId) {
        throw new CustomError(
          "Sub category does not belong to selected category",
          400
        );
      }
    }

    // 4. Process file uploads directly to Cloudinary
    let gstCertificateUrl = merchantData.gstCertificate || null;
    let panCardImageUrl = merchantData.panCardImage || null;

    if (files && files.gstCertificate && files.gstCertificate[0]) {
      const result = await uploadToCloudinary(
        files.gstCertificate[0].buffer,
        "upload-single"
      );
      gstCertificateUrl = result.path;
    }

    if (files && files.panCardImage && files.panCardImage[0]) {
      const result = await uploadToCloudinary(
        files.panCardImage[0].buffer,
        "upload-single"
      );
      panCardImageUrl = result.path;
    }

    const merchant = await Merchant.create({
      companyName: merchantData.companyName.trim(),
      personName: merchantData.personName.trim(),
      mobile: String(merchantData.mobile).trim(),
      email: merchantData.email ? merchantData.email.trim().toLowerCase() : "",
      address: merchantData.address ? merchantData.address.trim() : "",
      paymentTerm: merchantData.paymentTerm ? merchantData.paymentTerm.trim() : "",
      gstName: merchantData.gstName ? merchantData.gstName.trim() : "",
      gstNumber: merchantData.gstNumber
        ? merchantData.gstNumber.trim().toUpperCase()
        : merchantData.gstNo
        ? merchantData.gstNo.trim().toUpperCase()
        : "",
      gstCertificate: gstCertificateUrl,
      panCard: merchantData.panCard ? merchantData.panCard.trim().toUpperCase() : "",
      panCardImage: panCardImageUrl,
      categoryId: numCategoryId,
      subCategoryId: subCatIds,
      note: merchantData.note ? merchantData.note.trim() : "",
    });

    return await formatMerchant(merchant);
  }

  /**
   * Get all Merchants with filtering (categoryId, subCategoryId), search & pagination
   */
  async getAllMerchants(queryParams = {}) {
    const { page, limit, skip, search } = getPaginationQueryParams(queryParams);
    const { categoryId, subCategoryId } = queryParams;
    const query = {};

    if (categoryId) {
      const numCatId = Number(categoryId);
      if (!isNaN(numCatId)) query.categoryId = numCatId;
    }

    if (subCategoryId) {
      const subCatIds = normalizeSubCategoryIds(subCategoryId);
      if (subCatIds.length > 0) {
        query.subCategoryId = { $in: subCatIds };
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { companyName: searchRegex },
        { personName: searchRegex },
        { mobile: searchRegex },
        { panCard: searchRegex },
        { gstNumber: searchRegex },
      ];
    }

    const totalCount = await Merchant.countDocuments(query);
    const merchants = await Merchant.find(query)
      .sort({ merchantId: 1 })
      .skip(skip)
      .limit(limit);

    const formattedMerchants = await Promise.all(
      merchants.map((m) => formatMerchant(m))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      merchants: formattedMerchants,
      pagination,
    };
  }

  /**
   * Get single Merchant by numeric ID
   */
  async getMerchantById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Merchant ID", 400);
    }

    const merchant = await Merchant.findOne({ merchantId: numericId });
    if (!merchant) {
      throw new CustomError("Merchant not found", 404);
    }

    return await formatMerchant(merchant);
  }

  /**
   * Update Merchant by numeric ID with support for multiple subCategoryIds
   */
  async updateMerchant(id, updateData, files = {}) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Merchant ID", 400);
    }

    const merchant = await Merchant.findOne({ merchantId: numericId });
    if (!merchant) {
      throw new CustomError("Merchant not found", 404);
    }

    const targetCategoryId =
      updateData.categoryId !== undefined
        ? Number(updateData.categoryId)
        : merchant.categoryId;

    const rawSubCatIds =
      updateData.subCategoryId !== undefined
        ? updateData.subCategoryId
        : updateData.subCategoryIds;

    const targetSubCatIds =
      rawSubCatIds !== undefined
        ? normalizeSubCategoryIds(rawSubCatIds)
        : normalizeSubCategoryIds(merchant.subCategoryId);

    // Check relationship validation if category or subCategory changes
    if (updateData.categoryId !== undefined || rawSubCatIds !== undefined) {
      const category = await Category.findOne({ categoryId: targetCategoryId });
      if (!category) {
        throw new CustomError("Selected Category does not exist", 404);
      }

      const subCategories = await SubCategory.find({
        subCategoryId: { $in: targetSubCatIds },
      });

      if (subCategories.length !== new Set(targetSubCatIds).size) {
        throw new CustomError("One or more selected Sub Categories do not exist", 404);
      }

      for (const sc of subCategories) {
        if (sc.categoryId !== targetCategoryId) {
          throw new CustomError(
            "Sub category does not belong to selected category",
            400
          );
        }
      }
    }

    // Process file uploads to Cloudinary if provided
    if (files && files.gstCertificate && files.gstCertificate[0]) {
      const result = await uploadToCloudinary(
        files.gstCertificate[0].buffer,
        "upload-single"
      );
      merchant.gstCertificate = result.path;
    } else if (updateData.gstCertificate !== undefined) {
      merchant.gstCertificate = updateData.gstCertificate;
    }

    if (files && files.panCardImage && files.panCardImage[0]) {
      const result = await uploadToCloudinary(
        files.panCardImage[0].buffer,
        "upload-single"
      );
      merchant.panCardImage = result.path;
    } else if (updateData.panCardImage !== undefined) {
      merchant.panCardImage = updateData.panCardImage;
    }

    // Apply text field updates
    if (updateData.companyName) merchant.companyName = updateData.companyName.trim();
    if (updateData.personName) merchant.personName = updateData.personName.trim();
    if (updateData.mobile) merchant.mobile = String(updateData.mobile).trim();
    if (updateData.email !== undefined)
      merchant.email = updateData.email ? updateData.email.trim().toLowerCase() : "";
    if (updateData.address !== undefined)
      merchant.address = updateData.address ? updateData.address.trim() : "";
    if (updateData.paymentTerm !== undefined)
      merchant.paymentTerm = updateData.paymentTerm ? updateData.paymentTerm.trim() : "";
    if (updateData.gstName !== undefined)
      merchant.gstName = updateData.gstName ? updateData.gstName.trim() : "";
    if (updateData.gstNumber !== undefined)
      merchant.gstNumber = updateData.gstNumber ? updateData.gstNumber.trim().toUpperCase() : "";
    if (updateData.panCard !== undefined)
      merchant.panCard = updateData.panCard ? updateData.panCard.trim().toUpperCase() : "";
    if (updateData.categoryId !== undefined) merchant.categoryId = targetCategoryId;
    if (rawSubCatIds !== undefined) merchant.subCategoryId = targetSubCatIds;
    if (updateData.note !== undefined)
      merchant.note = updateData.note ? updateData.note.trim() : "";

    await merchant.save();
    return await formatMerchant(merchant);
  }

  /**
   * Delete Merchant by numeric ID
   */
  async deleteMerchant(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Merchant ID", 400);
    }

    const merchant = await Merchant.findOne({ merchantId: numericId });
    if (!merchant) {
      throw new CustomError("Merchant not found", 404);
    }

    await Merchant.findOneAndDelete({ merchantId: numericId });
    return { id: numericId };
  }
}

module.exports = new MerchantService();
