const Trader = require("../../models/Trader/trader");
const Category = require("../../models/Category/category");
const SubCategory = require("../../models/SubCategory/subCategory");
const CustomError = require("../../utils/Common/customError");

class TraderService {
  /**
   * Create a new Trader
   */
  async createTrader(traderData) {
    const { categoryId, subCategoryId } = traderData;

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

    const trader = await Trader.create({
      companyName: traderData.companyName.trim(),
      personName: traderData.personName.trim(),
      mobile: String(traderData.mobile).trim(),
      email: traderData.email ? traderData.email.trim().toLowerCase() : "",
      address: traderData.address ? traderData.address.trim() : "",
      paymentTerm: traderData.paymentTerm ? traderData.paymentTerm.trim() : "",
      gstName: traderData.gstName ? traderData.gstName.trim() : "",
      gstCertificate: traderData.gstCertificate || null,
      panCard: traderData.panCard ? traderData.panCard.trim() : "",
      panCardImage: traderData.panCardImage || null,
      categoryId,
      subCategoryId,
      note: traderData.note ? traderData.note.trim() : "",
    });

    const populatedTrader = await Trader.findById(trader._id)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name");

    return populatedTrader;
  }

  /**
   * Get all Traders with filtering (categoryId, subCategoryId) & search (companyName, personName, mobile)
   */
  async getAllTraders({ categoryId, subCategoryId, search }) {
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

    const traders = await Trader.find(query)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .sort({ createdAt: -1 });

    return traders;
  }

  /**
   * Get single Trader by ID
   */
  async getTraderById(id) {
    const trader = await Trader.findById(id)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name");

    if (!trader) {
      throw new CustomError("Trader not found", 404);
    }

    return trader;
  }

  /**
   * Update Trader by ID
   */
  async updateTrader(id, updateData) {
    const trader = await Trader.findById(id);
    if (!trader) {
      throw new CustomError("Trader not found", 404);
    }

    const targetCategoryId = updateData.categoryId || trader.categoryId;
    const targetSubCategoryId = updateData.subCategoryId || trader.subCategoryId;

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
    if (updateData.companyName) trader.companyName = updateData.companyName.trim();
    if (updateData.personName) trader.personName = updateData.personName.trim();
    if (updateData.mobile) trader.mobile = String(updateData.mobile).trim();
    if (updateData.email !== undefined)
      trader.email = updateData.email ? updateData.email.trim().toLowerCase() : "";
    if (updateData.address !== undefined)
      trader.address = updateData.address ? updateData.address.trim() : "";
    if (updateData.paymentTerm !== undefined)
      trader.paymentTerm = updateData.paymentTerm ? updateData.paymentTerm.trim() : "";
    if (updateData.gstName !== undefined)
      trader.gstName = updateData.gstName ? updateData.gstName.trim() : "";
    if (updateData.gstCertificate !== undefined)
      trader.gstCertificate = updateData.gstCertificate;
    if (updateData.panCard !== undefined)
      trader.panCard = updateData.panCard ? updateData.panCard.trim() : "";
    if (updateData.panCardImage !== undefined)
      trader.panCardImage = updateData.panCardImage;
    if (updateData.categoryId) trader.categoryId = updateData.categoryId;
    if (updateData.subCategoryId) trader.subCategoryId = updateData.subCategoryId;
    if (updateData.note !== undefined)
      trader.note = updateData.note ? updateData.note.trim() : "";

    await trader.save();

    return await Trader.findById(trader._id)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name");
  }

  /**
   * Delete Trader by ID
   */
  async deleteTrader(id) {
    const trader = await Trader.findById(id);
    if (!trader) {
      throw new CustomError("Trader not found", 404);
    }

    await Trader.findByIdAndDelete(id);
    return { id };
  }
}

module.exports = new TraderService();
