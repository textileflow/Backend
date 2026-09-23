const DesignCosting = require("../../../models/Design/Costing/costing");
const Design = require("../../../models/Design/design");
const CustomError = require("../../../utils/Common/customError");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../../utils/Common/pagination");

const formatCosting = async (costing) => {
  if (!costing) return null;
  return typeof costing.toJSON === "function"
    ? costing.toJSON()
    : { ...costing };
};

/**
 * Perform backend costing calculation given design specifications and pricing inputs
 */
const calculateCosting = (
  stitch,
  area,
  pricePer1000,
  meterConversionFactor = 400,
  headAdjustmentEnabled = false,
  headAdjustmentFactor = 1,
) => {
  const price = Number(pricePer1000);
  const factor = Number(meterConversionFactor) || 400;

  if (isNaN(price) || price < 0) {
    throw new CustomError(
      "Price per 1000 stitches must be a non-negative number",
      400,
    );
  }
  if (isNaN(factor) || factor <= 0) {
    throw new CustomError(
      "Meter conversion factor must be a number greater than 0",
      400,
    );
  }

  // 1. Stitch-wise Cost
  const stitchCost = (Number(stitch) * price) / 1000;

  // 2. Meter Value
  const meterValue = Number(area) / factor;

  // 3. Meter Cost
  const meterCost = stitchCost * meterValue;

  // 4. Head Adjustment & Final Cost
  const isHeadEnabled = Boolean(headAdjustmentEnabled);
  const headFactor = isHeadEnabled
    ? Number(headAdjustmentFactor !== undefined ? headAdjustmentFactor : 1)
    : 1;

  if (isHeadEnabled && (isNaN(headFactor) || headFactor <= 0)) {
    throw new CustomError(
      "Head adjustment factor must be a number greater than 0",
      400,
    );
  }

  const headAdjustedCost = meterCost * headFactor;
  const finalCost = headAdjustedCost;

  return {
    stitchCost,
    meterConversionFactor: factor,
    meterValue,
    meterCost,
    headAdjustmentEnabled: isHeadEnabled,
    headAdjustmentFactor: isHeadEnabled ? headFactor : 1,
    headAdjustedCost,
    finalCost,
  };
};

class DesignCostingService {
  /**
   * Create a new Design Costing record linked to Design master
   */
  async createCosting(costingData) {
    const numDesignId = Number(costingData.designId);
    if (isNaN(numDesignId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    // 1. Fetch Design master record
    const design = await Design.findOne({ designId: numDesignId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }
    if (design.status === "Inactive") {
      throw new CustomError(
        "Cannot create costing for an inactive design",
        400,
      );
    }

    // 2. Check if active costing record already exists for this design
    const existingCosting = await DesignCosting.findOne({
      designId: numDesignId,
    });
    if (existingCosting) {
      throw new CustomError(
        "Costing already exists for this design. Please edit the existing costing.",
        400,
      );
    }

    // 3. Calculate backend costing fields
    const calculated = calculateCosting(
      design.stitch,
      design.area,
      costingData.pricePer1000,
      costingData.meterConversionFactor,
      costingData.headAdjustmentEnabled,
      costingData.headAdjustmentFactor,
    );

    const costing = await DesignCosting.create({
      designId: numDesignId,
      designCode: design.designCode,
      designName: design.designName,
      stitch: design.stitch,
      area: design.area,
      pricePer1000: Number(costingData.pricePer1000),
      stitchCost: calculated.stitchCost,
      meterConversionFactor: calculated.meterConversionFactor,
      meterValue: calculated.meterValue,
      meterCost: calculated.meterCost,
      headAdjustmentEnabled: calculated.headAdjustmentEnabled,
      headAdjustmentFactor: calculated.headAdjustmentFactor,
      headAdjustedCost: calculated.headAdjustedCost,
      finalCost: calculated.finalCost,
      status: costingData.status || "Active",
    });

    return await formatCosting(costing);
  }

  /**
   * Get all Costings with search, status filter & pagination
   */
  async getAllCostings(queryParams = {}) {
    const { page, limit, skip, search, status } =
      getPaginationQueryParams(queryParams);
    const { designId } = queryParams;
    const query = {};

    if (status) {
      query.status = new RegExp(`^${status.trim()}$`, "i");
    }

    if (designId) {
      const numDesignId = Number(designId);
      if (!isNaN(numDesignId)) query.designId = numDesignId;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ designName: searchRegex }, { designCode: searchRegex }];
    }

    const totalCount = await DesignCosting.countDocuments(query);
    const costings = await DesignCosting.find(query)
      .sort({ costingId: -1 })
      .skip(skip)
      .limit(limit);

    const formattedCostings = await Promise.all(
      costings.map((c) => formatCosting(c)),
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      costings: formattedCostings,
      pagination,
    };
  }

  /**
   * Get single Costing by numeric ID
   */
  async getCostingById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Costing ID", 400);
    }

    const costing = await DesignCosting.findOne({ costingId: numericId });
    if (!costing) {
      throw new CustomError("Design costing not found", 404);
    }

    return await formatCosting(costing);
  }

  /**
   * Get Costing by Design ID
   */
  async getCostingByDesignId(designId) {
    const numDesignId = Number(designId);
    if (isNaN(numDesignId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const costing = await DesignCosting.findOne({ designId: numDesignId });
    if (!costing) {
      throw new CustomError("Costing not found for this design", 404);
    }

    return await formatCosting(costing);
  }

  /**
   * Update Design Costing record by numeric ID
   */
  async updateCosting(id, updateData) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Costing ID", 400);
    }

    const costing = await DesignCosting.findOne({ costingId: numericId });
    if (!costing) {
      throw new CustomError("Design costing not found", 404);
    }

    // Check if designId is being changed and verify design exists + no duplicate costing
    let targetDesignId = costing.designId;
    if (
      updateData.designId !== undefined &&
      Number(updateData.designId) !== costing.designId
    ) {
      targetDesignId = Number(updateData.designId);
      if (isNaN(targetDesignId)) {
        throw new CustomError("Invalid Design ID", 400);
      }
      const existing = await DesignCosting.findOne({
        designId: targetDesignId,
        costingId: { $ne: numericId },
      });
      if (existing) {
        throw new CustomError(
          "Costing already exists for this design. Please edit the existing costing.",
          400,
        );
      }
    }

    const design = await Design.findOne({ designId: targetDesignId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }
    if (design.status === "Inactive") {
      throw new CustomError("Cannot assign costing to an inactive design", 400);
    }

    const pricePer1000 =
      updateData.pricePer1000 !== undefined
        ? Number(updateData.pricePer1000)
        : costing.pricePer1000;

    const meterConversionFactor =
      updateData.meterConversionFactor !== undefined
        ? Number(updateData.meterConversionFactor)
        : costing.meterConversionFactor;

    const headAdjustmentEnabled =
      updateData.headAdjustmentEnabled !== undefined
        ? Boolean(updateData.headAdjustmentEnabled)
        : costing.headAdjustmentEnabled;

    const headAdjustmentFactor =
      updateData.headAdjustmentFactor !== undefined
        ? Number(updateData.headAdjustmentFactor)
        : costing.headAdjustmentFactor;

    // Perform backend recalculation
    const calculated = calculateCosting(
      design.stitch,
      design.area,
      pricePer1000,
      meterConversionFactor,
      headAdjustmentEnabled,
      headAdjustmentFactor,
    );

    costing.designId = targetDesignId;
    costing.designCode = design.designCode;
    costing.designName = design.designName;
    costing.stitch = design.stitch;
    costing.area = design.area;
    costing.pricePer1000 = pricePer1000;
    costing.stitchCost = calculated.stitchCost;
    costing.meterConversionFactor = calculated.meterConversionFactor;
    costing.meterValue = calculated.meterValue;
    costing.meterCost = calculated.meterCost;
    costing.headAdjustmentEnabled = calculated.headAdjustmentEnabled;
    costing.headAdjustmentFactor = calculated.headAdjustmentFactor;
    costing.headAdjustedCost = calculated.headAdjustedCost;
    costing.finalCost = calculated.finalCost;

    if (updateData.status) {
      costing.status = updateData.status;
    }

    await costing.save();
    return await formatCosting(costing);
  }

  /**
   * Update Costing Status
   */
  async updateCostingStatus(id, status) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Costing ID", 400);
    }

    const costing = await DesignCosting.findOne({ costingId: numericId });
    if (!costing) {
      throw new CustomError("Design costing not found", 404);
    }

    costing.status = status;
    await costing.save();
    return await formatCosting(costing);
  }

  /**
   * Soft delete Costing by numeric ID
   */
  async deleteCosting(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Costing ID", 400);
    }

    const costing = await DesignCosting.findOne({ costingId: numericId });
    if (!costing) {
      throw new CustomError("Design costing not found", 404);
    }

    await costing.softDelete();
    return { id: numericId };
  }
}

module.exports = new DesignCostingService();
