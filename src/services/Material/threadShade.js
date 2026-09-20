const ThreadShade = require("../../models/Material/threadShade");
const ThreadCatalog = require("../../models/Material/threadCatalog");
const Unit = require("../../models/Master/unit");
const CustomError = require("../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../utils/Common/pagination");

const formatShadeRecord = async (shade) => {
  if (!shade) return {};
  const obj = typeof shade.toJSON === "function" ? shade.toJSON() : { ...shade };

  if (obj.catalogId) {
    const catalog = await ThreadCatalog.findOne({ catalogId: obj.catalogId });
    if (catalog) {
      obj.catalog = {
        id: catalog.catalogId,
        catalogCode: catalog.catalogCode,
        catalogName: catalog.catalogName,
        threadType: catalog.threadType,
        threadSize: catalog.threadSize,
      };
    }
  }

  if (obj.purchaseUnitId) {
    const unit = await Unit.findOne({ unitId: obj.purchaseUnitId });
    if (unit) {
      obj.purchaseUnit = {
        id: unit.unitId,
        unitCode: unit.unitCode,
        unitName: unit.unitName,
        symbol: unit.symbol,
      };
    }
  }

  delete obj.catalogId;
  delete obj.purchaseUnitId;
  return obj;
};

class ThreadShadeService {
  async createShade(data) {
    const numCatalogId = Number(data.catalogId);
    if (isNaN(numCatalogId)) {
      throw new CustomError("Invalid Catalog ID", 400);
    }

    const catalogExists = await ThreadCatalog.findOne({ catalogId: numCatalogId });
    if (!catalogExists) {
      throw new CustomError("Selected Thread Catalog does not exist", 404);
    }

    let numUnitId = null;
    if (data.purchaseUnitId) {
      numUnitId = Number(data.purchaseUnitId);
      const unitExists = await Unit.findOne({ unitId: numUnitId });
      if (!unitExists) throw new CustomError("Selected Purchase Unit does not exist", 404);
    }

    const shade = await ThreadShade.create({
      shadeCode: data.shadeCode.trim().toUpperCase(),
      shadeName: data.shadeName ? data.shadeName.trim() : `Shade ${data.shadeCode.trim()}`,
      catalogId: numCatalogId,
      colorFamily: data.colorFamily ? data.colorFamily.trim() : "General",
      colorHex: data.colorHex ? data.colorHex.trim() : "#000000",
      shadeImage: data.shadeImage || "",
      standardWeightGram: data.standardWeightGram ? Number(data.standardWeightGram) : 500,
      purchaseUnitId: numUnitId,
      rate: data.rate ? Number(data.rate) : 0,
      status: data.status || "Active",
    });

    return await formatShadeRecord(shade);
  }

  /**
   * Bulk Upload Shades for a Catalog
   */
  async bulkCreateShades(catalogId, shadesArray) {
    const numCatalogId = Number(catalogId);
    const catalogExists = await ThreadCatalog.findOne({ catalogId: numCatalogId });
    if (!catalogExists) {
      throw new CustomError("Selected Thread Catalog does not exist", 404);
    }

    if (!Array.isArray(shadesArray) || shadesArray.length === 0) {
      throw new CustomError("Shades array must contain at least one shade object", 400);
    }

    const createdShades = await Promise.all(
      shadesArray.map(async (item) => {
        const shade = await ThreadShade.create({
          shadeCode: item.shadeCode.trim().toUpperCase(),
          shadeName: item.shadeName ? item.shadeName.trim() : `Shade ${item.shadeCode.trim()}`,
          catalogId: numCatalogId,
          colorFamily: item.colorFamily ? item.colorFamily.trim() : "General",
          colorHex: item.colorHex ? item.colorHex.trim() : "#000000",
          shadeImage: item.shadeImage || "",
          rate: item.rate ? Number(item.rate) : 0,
          status: item.status || "Active",
        });
        return await formatShadeRecord(shade);
      })
    );

    return createdShades;
  }

  async getAllShades(queryParams = {}) {
    const { page, limit, skip, search } = getPaginationQueryParams(queryParams);
    const { catalogId, colorFamily, status } = queryParams;
    const query = {};

    if (catalogId) {
      const numCatalogId = Number(catalogId);
      if (!isNaN(numCatalogId)) query.catalogId = numCatalogId;
    }

    if (colorFamily) query.colorFamily = new RegExp(colorFamily, "i");
    if (status) query.status = status;

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { shadeCode: searchRegex },
        { shadeName: searchRegex },
        { colorFamily: searchRegex },
      ];
    }

    const totalCount = await ThreadShade.countDocuments(query);
    const shades = await ThreadShade.find(query)
      .sort({ shadeId: -1 })
      .skip(skip)
      .limit(limit);

    const formattedShades = await Promise.all(
      shades.map((s) => formatShadeRecord(s))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      shades: formattedShades,
      pagination,
    };
  }

  async getShadeById(id) {
    const numericId = Number(id);
    const shade = await ThreadShade.findOne({ shadeId: numericId });
    if (!shade) throw new CustomError("Thread Shade not found", 404);
    return await formatShadeRecord(shade);
  }
}

module.exports = new ThreadShadeService();
