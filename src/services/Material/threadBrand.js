const ThreadBrand = require("../../models/Material/threadBrand");
const Vendor = require("../../models/Purchase/Vendor/vendor");
const CustomError = require("../../utils/Common/customError");

const formatBrandRecord = async (brand) => {
  if (!brand) return {};
  const obj = typeof brand.toJSON === "function" ? brand.toJSON() : { ...brand };

  if (obj.vendorId) {
    const vendor = await Vendor.findOne({ vendorId: obj.vendorId });
    if (vendor) {
      obj.vendor = {
        id: vendor.vendorId,
        vendorCode: vendor.vendorCode,
        vendorName: vendor.companyName,
      };
    }
  }

  delete obj.vendorId;
  return obj;
};

class ThreadBrandService {
  async createBrand(data) {
    if (data.brandCode) {
      const existing = await ThreadBrand.findOne({ brandCode: data.brandCode.trim().toUpperCase() });
      if (existing) throw new CustomError("Brand code already exists", 400);
    }

    let numVendorId = null;
    if (data.vendorId) {
      numVendorId = Number(data.vendorId);
      const vendorExists = await Vendor.findOne({ vendorId: numVendorId });
      if (!vendorExists) throw new CustomError("Selected Vendor does not exist", 404);
    }

    const brand = await ThreadBrand.create({
      brandCode: data.brandCode ? data.brandCode.trim().toUpperCase() : undefined,
      brandName: data.brandName.trim(),
      vendorId: numVendorId,
      description: data.description ? data.description.trim() : "",
      status: data.status || "Active",
    });

    return await formatBrandRecord(brand);
  }

  async getAllBrands() {
    const brands = await ThreadBrand.find().sort({ brandId: 1 });
    return await Promise.all(brands.map((b) => formatBrandRecord(b)));
  }
}

module.exports = new ThreadBrandService();
