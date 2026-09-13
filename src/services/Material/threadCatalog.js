const ThreadCatalog = require("../../models/Material/threadCatalog");
const ThreadBrand = require("../../models/Material/threadBrand");
const Unit = require("../../models/Master/unit");
const CustomError = require("../../utils/Common/customError");

const formatCatalogRecord = async (catalog) => {
  if (!catalog) return {};
  const obj = typeof catalog.toJSON === "function" ? catalog.toJSON() : { ...catalog };

  if (obj.brandId) {
    const brand = await ThreadBrand.findOne({ brandId: obj.brandId });
    if (brand) {
      obj.brand = {
        id: brand.brandId,
        brandCode: brand.brandCode,
        brandName: brand.brandName,
      };
    }
  }

  if (obj.unitId) {
    const unit = await Unit.findOne({ unitId: obj.unitId });
    if (unit) {
      obj.unit = {
        id: unit.unitId,
        unitCode: unit.unitCode,
        unitName: unit.unitName,
        symbol: unit.symbol,
      };
    }
  }

  delete obj.brandId;
  delete obj.unitId;
  return obj;
};

class ThreadCatalogService {
  async createCatalog(data) {
    if (data.catalogCode) {
      const existing = await ThreadCatalog.findOne({ catalogCode: data.catalogCode.trim().toUpperCase() });
      if (existing) throw new CustomError("Catalog code already exists", 400);
    }

    let numBrandId = null;
    if (data.brandId) {
      numBrandId = Number(data.brandId);
      const brandExists = await ThreadBrand.findOne({ brandId: numBrandId });
      if (!brandExists) throw new CustomError("Selected Brand does not exist", 404);
    }

    let numUnitId = null;
    if (data.unitId) {
      numUnitId = Number(data.unitId);
      const unitExists = await Unit.findOne({ unitId: numUnitId });
      if (!unitExists) throw new CustomError("Selected Unit does not exist", 404);
    }

    const catalog = await ThreadCatalog.create({
      catalogCode: data.catalogCode ? data.catalogCode.trim().toUpperCase() : undefined,
      catalogName: data.catalogName.trim(),
      brandId: numBrandId,
      threadType: data.threadType ? data.threadType.trim() : "Rayon",
      threadSize: data.threadSize ? data.threadSize.trim() : "120D",
      unitId: numUnitId,
      catalogImageOrPdf: data.catalogImageOrPdf || "",
      description: data.description ? data.description.trim() : "",
      status: data.status || "Active",
    });

    return await formatCatalogRecord(catalog);
  }

  async getAllCatalogs() {
    const catalogs = await ThreadCatalog.find().sort({ catalogId: 1 });
    return await Promise.all(catalogs.map((c) => formatCatalogRecord(c)));
  }

  async getCatalogById(id) {
    const numericId = Number(id);
    const catalog = await ThreadCatalog.findOne({ catalogId: numericId });
    if (!catalog) throw new CustomError("Thread Catalog not found", 404);
    return await formatCatalogRecord(catalog);
  }
}

module.exports = new ThreadCatalogService();
