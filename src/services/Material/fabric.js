const Fabric = require("../../models/Material/fabric");
const Unit = require("../../models/Master/unit");
const CustomError = require("../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../utils/Common/pagination");

const formatFabricRecord = async (fabric) => {
  if (!fabric) return {};
  const obj = typeof fabric.toJSON === "function" ? fabric.toJSON() : { ...fabric };

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

  delete obj.unitId;
  return obj;
};

class FabricService {
  async createFabric(data) {
    if (data.fabricCode) {
      const existing = await Fabric.findOne({
        fabricCode: data.fabricCode.trim().toUpperCase(),
      });
      if (existing) throw new CustomError("Fabric code already exists", 400);
    }

    let numUnitId = null;
    if (data.unitId) {
      numUnitId = Number(data.unitId);
      const unitExists = await Unit.findOne({ unitId: numUnitId });
      if (!unitExists) throw new CustomError("Selected Unit does not exist", 404);
    }

    const fabric = await Fabric.create({
      fabricCode: data.fabricCode ? data.fabricCode.trim().toUpperCase() : undefined,
      fabricName: data.fabricName.trim(),
      fabricType: data.fabricType ? data.fabricType.trim() : "Woven",
      composition: data.composition ? data.composition.trim() : "Polyester",
      gsm: data.gsm ? Number(data.gsm) : 80,
      width: data.width ? data.width.trim() : "44 inch",
      unitId: numUnitId,
      rate: data.rate ? Number(data.rate) : 0,
      status: data.status || "Active",
    });

    return await formatFabricRecord(fabric);
  }

  async getAllFabrics(queryParams = {}) {
    const { page, limit, skip, search } = getPaginationQueryParams(queryParams);
    const { status, fabricType } = queryParams;
    const query = {};

    if (status) query.status = status;
    if (fabricType) query.fabricType = new RegExp(fabricType, "i");

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { fabricCode: searchRegex },
        { fabricName: searchRegex },
        { fabricType: searchRegex },
        { composition: searchRegex },
      ];
    }

    const totalCount = await Fabric.countDocuments(query);
    const fabrics = await Fabric.find(query)
      .sort({ fabricId: 1 })
      .skip(skip)
      .limit(limit);

    const formattedFabrics = await Promise.all(
      fabrics.map((f) => formatFabricRecord(f))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      fabrics: formattedFabrics,
      pagination,
    };
  }

  async getFabricById(id) {
    const numericId = Number(id);
    const fabric = await Fabric.findOne({ fabricId: numericId });
    if (!fabric) throw new CustomError("Fabric not found", 404);
    return await formatFabricRecord(fabric);
  }
}

module.exports = new FabricService();
