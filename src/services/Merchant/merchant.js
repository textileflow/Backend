const Merchant = require("../../models/Merchant/merchant");
const Category = require("../../models/Category/category");
const SubCategory = require("../../models/SubCategory/subCategory");
const CustomError = require("../../utils/Common/customError");

class MerchantService {
  /**
   * Create a new Merchant
   */
  async createMerchant(merchantData) {
    const { categoryId, subCategoryId } = merchantData;

    // 1. Verify Category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new CustomError("Selected Category does not exist", 404);
    }

    // 2. Verify Sub Category exists
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      throw new CustomError("Selected Sub Category does not exist", 404);
    }

    // 3. CRITICAL: Verify Sub Category belongs to selected Category
    if (subCategory.categoryId.toString() !== categoryId.toString()) {
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
      categoryId,
      subCategoryId,
      note: merchantData.note ? merchantData.note.trim() : "",
    });

    const populatedMerchant = await Merchant.findById(merchant._id)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name");

    return populatedMerchant;
  }

  /**
   * Get all Merchants with filtering (categoryId, subCategoryId) & search (companyName, personName, mobile)
   */
  async getAllMerchants({ categoryId, subCategoryId, search }) {
    const query = {};

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (subCategoryId) {
      query.subCategoryId = subCategoryId;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { companyName: searchRegex },
        { personName: searchRegex },
        { mobile: searchRegex },
      ];
    }

    const merchants = await Merchant.find(query)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .sort({ createdAt: -1 });

    return merchants;
  }

  /**
   * Get single Merchant by ID
   */
  async getMerchantById(id) {
    const merchant = await Merchant.findById(id)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name");

    if (!merchant) {
      throw new CustomError("Merchant not found", 404);
    }

    return merchant;
  }

  /**
   * Update Merchant by ID
   */
  async updateMerchant(id, updateData) {
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      throw new CustomError("Merchant not found", 404);
    }

    const targetCategoryId = updateData.categoryId || merchant.categoryId;
    const targetSubCategoryId = updateData.subCategoryId || merchant.subCategoryId;

    // Check relationship validation if category or subCategory changes
    if (updateData.categoryId || updateData.subCategoryId) {
      const category = await Category.findById(targetCategoryId);
      if (!category) {
        throw new CustomError("Selected Category does not exist", 404);
      }

      const subCategory = await SubCategory.findById(targetSubCategoryId);
      if (!subCategory) {
        throw new CustomError("Selected Sub Category does not exist", 404);
      }

      if (subCategory.categoryId.toString() !== targetCategoryId.toString()) {
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
    if (updateData.categoryId) merchant.categoryId = updateData.categoryId;
    if (updateData.subCategoryId) merchant.subCategoryId = updateData.subCategoryId;
    if (updateData.note !== undefined)
      merchant.note = updateData.note ? updateData.note.trim() : "";

    await merchant.save();

    return await Merchant.findById(merchant._id)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name");
  }

  /**
   * Delete Merchant by ID
   */
  async deleteMerchant(id) {
    const merchant = await Merchant.findById(id);
    if (!merchant) {
      throw new CustomError("Merchant not found", 404);
    }

    await Merchant.findByIdAndDelete(id);
    return { id };
  }
}

module.exports = new MerchantService();
