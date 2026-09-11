const Merchant = require("../../models/Merchant/merchant");
const Category = require("../../models/Category/category");
const SubCategory = require("../../models/SubCategory/subCategory");
const CustomError = require("../../utils/Common/customError");

/**
 * Format merchant object safely with populated Category & SubCategory details
 */
const formatMerchant = async (merchant) => {
  if (!merchant) return {};
  const obj = typeof merchant.toJSON === "function" ? merchant.toJSON() : { ...merchant };

  const category = await Category.findOne({ categoryId: obj.categoryId });
  const subCategory = await SubCategory.findOne({ subCategoryId: obj.subCategoryId });

  if (category) {
    obj.category = {
      id: category.categoryId,
      name: category.name,
    };
  }

  if (subCategory) {
    obj.subCategory = {
      id: subCategory.subCategoryId,
      name: subCategory.name,
    };
  }

  delete obj.categoryId;
  delete obj.subCategoryId;

  return obj;
};

class MerchantService {
  /**
   * Create a new Merchant
   */
  async createMerchant(merchantData) {
    const numCategoryId = Number(merchantData.categoryId);
    const numSubCategoryId = Number(merchantData.subCategoryId);

    if (isNaN(numCategoryId)) {
      throw new CustomError("Invalid Category ID", 400);
    }
    if (isNaN(numSubCategoryId)) {
      throw new CustomError("Invalid Sub Category ID", 400);
    }

    // 1. Verify Category exists
    const category = await Category.findOne({ categoryId: numCategoryId });
    if (!category) {
      throw new CustomError("Selected Category does not exist", 404);
    }

    // 2. Verify Sub Category exists
    const subCategory = await SubCategory.findOne({ subCategoryId: numSubCategoryId });
    if (!subCategory) {
      throw new CustomError("Selected Sub Category does not exist", 404);
    }

    // 3. CRITICAL: Verify Sub Category belongs to selected Category
    if (subCategory.categoryId !== numCategoryId) {
      throw new CustomError(
        "Sub category does not belong to selected category",
        400
      );
    }

    const merchant = await Merchant.create({
      companyName: merchantData.companyName.trim(),
      personName: merchantData.personName.trim(),
      mobile: String(merchantData.mobile).trim(),
      email: merchantData.email ? merchantData.email.trim().toLowerCase() : "",
      address: merchantData.address ? merchantData.address.trim() : "",
      paymentTerm: merchantData.paymentTerm ? merchantData.paymentTerm.trim() : "",
      gstName: merchantData.gstName ? merchantData.gstName.trim() : "",
      gstCertificate: merchantData.gstCertificate || null,
      panCard: merchantData.panCard ? merchantData.panCard.trim() : "",
      panCardImage: merchantData.panCardImage || null,
      categoryId: numCategoryId,
      subCategoryId: numSubCategoryId,
      note: merchantData.note ? merchantData.note.trim() : "",
    });

    return await formatMerchant(merchant);
  }

  /**
   * Get all Merchants with filtering (categoryId, subCategoryId) & search (companyName, personName, mobile)
   */
  async getAllMerchants({ categoryId, subCategoryId, search }) {
    const query = {};

    if (categoryId) {
      const numCatId = Number(categoryId);
      if (!isNaN(numCatId)) query.categoryId = numCatId;
    }

    if (subCategoryId) {
      const numSubCatId = Number(subCategoryId);
      if (!isNaN(numSubCatId)) query.subCategoryId = numSubCatId;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { companyName: searchRegex },
        { personName: searchRegex },
        { mobile: searchRegex },
      ];
    }

    const merchants = await Merchant.find(query).sort({ merchantId: 1 });
    return await Promise.all(merchants.map((m) => formatMerchant(m)));
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
   * Update Merchant by numeric ID
   */
  async updateMerchant(id, updateData) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Merchant ID", 400);
    }

    const merchant = await Merchant.findOne({ merchantId: numericId });
    if (!merchant) {
      throw new CustomError("Merchant not found", 404);
    }

    const targetCategoryId = updateData.categoryId !== undefined ? Number(updateData.categoryId) : merchant.categoryId;
    const targetSubCategoryId = updateData.subCategoryId !== undefined ? Number(updateData.subCategoryId) : merchant.subCategoryId;

    // Check relationship validation if category or subCategory changes
    if (updateData.categoryId !== undefined || updateData.subCategoryId !== undefined) {
      const category = await Category.findOne({ categoryId: targetCategoryId });
      if (!category) {
        throw new CustomError("Selected Category does not exist", 404);
      }

      const subCategory = await SubCategory.findOne({ subCategoryId: targetSubCategoryId });
      if (!subCategory) {
        throw new CustomError("Selected Sub Category does not exist", 404);
      }

      if (subCategory.categoryId !== targetCategoryId) {
        throw new CustomError(
          "Sub category does not belong to selected category",
          400
        );
      }
    }

    // Apply updates
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
    if (updateData.gstCertificate !== undefined)
      merchant.gstCertificate = updateData.gstCertificate;
    if (updateData.panCard !== undefined)
      merchant.panCard = updateData.panCard ? updateData.panCard.trim() : "";
    if (updateData.panCardImage !== undefined)
      merchant.panCardImage = updateData.panCardImage;
    if (updateData.categoryId !== undefined) merchant.categoryId = targetCategoryId;
    if (updateData.subCategoryId !== undefined) merchant.subCategoryId = targetSubCategoryId;
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
