const Material = require("../../models/Material/material");
const CustomError = require("../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../utils/Common/pagination");

class MaterialService {
  /**
   * Create a new Material record
   */
  async createMaterial(data) {
    if (data.materialCode) {
      const existingCode = await Material.findOne({
        materialCode: data.materialCode.trim().toUpperCase(),
      });
      if (existingCode) {
        throw new CustomError("Material Code already exists", 400);
      }
    }

    const material = await Material.create({
      materialCode: data.materialCode ? data.materialCode.trim().toUpperCase() : undefined,
      materialName: data.materialName.trim(),
      materialType: data.materialType,
      threadType: data.threadType ? data.threadType.trim() : "",
      brand: data.brand ? data.brand.trim() : "",
      color: data.color ? data.color.trim() : "",
      colorCode: data.colorCode ? data.colorCode.trim() : "",
      countSize: data.countSize ? data.countSize.trim() : "",
      fabricType: data.fabricType ? data.fabricType.trim() : "",
      composition: data.composition ? data.composition.trim() : "",
      gsm: data.gsm ? Number(data.gsm) : 0,
      widthInch: data.widthInch ? Number(data.widthInch) : 0,
      unit: data.unit ? data.unit.trim() : "Meter",
      rate: data.rate ? Number(data.rate) : 0,
      status: data.status || "Active",
      note: data.note ? data.note.trim() : "",
    });

    return material;
  }

  /**
   * Get all Materials with filtering (materialType, status) & pagination
   */
  async getAllMaterials(queryParams = {}) {
    const { page, limit, skip, search } = getPaginationQueryParams(queryParams);
    const { materialType, status } = queryParams;
    const query = {};

    if (materialType) {
      query.materialType = materialType;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { materialCode: searchRegex },
        { materialName: searchRegex },
        { brand: searchRegex },
        { color: searchRegex },
        { fabricType: searchRegex },
      ];
    }

    const totalCount = await Material.countDocuments(query);
    const materials = await Material.find(query)
      .sort({ materialId: -1 })
      .skip(skip)
      .limit(limit);

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      materials,
      pagination,
    };
  }

  /**
   * Get Material by numeric materialId
   */
  async getMaterialById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Material ID", 400);
    }

    const material = await Material.findOne({ materialId: numericId });
    if (!material) {
      throw new CustomError("Material not found", 404);
    }

    return material;
  }

  /**
   * Update Material by numeric materialId
   */
  async updateMaterial(id, updateData) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Material ID", 400);
    }

    const material = await Material.findOne({ materialId: numericId });
    if (!material) {
      throw new CustomError("Material not found", 404);
    }

    if (updateData.materialCode && updateData.materialCode.trim().toUpperCase() !== material.materialCode) {
      const existingCode = await Material.findOne({
        materialCode: updateData.materialCode.trim().toUpperCase(),
        materialId: { $ne: numericId },
      });
      if (existingCode) {
        throw new CustomError("Material Code already exists", 400);
      }
      material.materialCode = updateData.materialCode.trim().toUpperCase();
    }

    if (updateData.materialName) material.materialName = updateData.materialName.trim();
    if (updateData.materialType) material.materialType = updateData.materialType;
    if (updateData.threadType !== undefined) material.threadType = updateData.threadType.trim();
    if (updateData.brand !== undefined) material.brand = updateData.brand.trim();
    if (updateData.color !== undefined) material.color = updateData.color.trim();
    if (updateData.colorCode !== undefined) material.colorCode = updateData.colorCode.trim();
    if (updateData.countSize !== undefined) material.countSize = updateData.countSize.trim();
    if (updateData.fabricType !== undefined) material.fabricType = updateData.fabricType.trim();
    if (updateData.composition !== undefined) material.composition = updateData.composition.trim();
    if (updateData.gsm !== undefined) material.gsm = Number(updateData.gsm);
    if (updateData.widthInch !== undefined) material.widthInch = Number(updateData.widthInch);
    if (updateData.unit !== undefined) material.unit = updateData.unit.trim();
    if (updateData.rate !== undefined) material.rate = Number(updateData.rate);
    if (updateData.status) material.status = updateData.status;
    if (updateData.note !== undefined) material.note = updateData.note.trim();

    await material.save();
    return material;
  }

  /**
   * Delete Material by numeric materialId
   */
  async deleteMaterial(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Material ID", 400);
    }

    const material = await Material.findOne({ materialId: numericId });
    if (!material) {
      throw new CustomError("Material not found", 404);
    }

    await Material.findOneAndDelete({ materialId: numericId });
    return { id: numericId };
  }
}

module.exports = new MaterialService();
