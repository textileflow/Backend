const Design = require("../../models/Design/design");
const CustomError = require("../../utils/Common/customError");
const { uploadToCloudinary } = require("../../config/cloudinary");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../utils/Common/pagination");

const formatDesign = async (design) => {
  if (!design) return null;
  return typeof design.toJSON === "function" ? design.toJSON() : { ...design };
};

class DesignService {
  /**
   * Create a new Design with multipart image & embroidery file uploads or URL strings
   */
  async createDesign(designData, files = {}) {
    const code = designData.designCode ? String(designData.designCode).trim() : "";

    // 1. Check for duplicate design code
    if (code) {
      const existingDesign = await Design.findOne({
        designCode: new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      });
      if (existingDesign) {
        throw new CustomError("Design Code already exists", 400);
      }
    }

    // 2. Handle Image Upload / String URL
    let imageUrl = designData.image ? String(designData.image).trim() : "";
    if (files && files.image && files.image[0]) {
      const uploadResult = await uploadToCloudinary(
        files.image[0].buffer,
        "designs/images"
      );
      imageUrl = uploadResult.fullUrl || uploadResult.path;
    }

    if (!imageUrl) {
      throw new CustomError("Design image is required", 400);
    }

    // 3. Handle Embroidery File Upload / String URL
    let fileUrl = designData.file ? String(designData.file).trim() : "";
    if (files && files.file && files.file[0]) {
      const uploadResult = await uploadToCloudinary(
        files.file[0].buffer,
        "designs/files"
      );
      fileUrl = uploadResult.fullUrl || uploadResult.path;
    }

    if (!fileUrl) {
      throw new CustomError("Design file is required", 400);
    }

    const stitchVal = Number(designData.stitch);
    const areaVal = Number(designData.area);
    const needleVal = Number(designData.needle);

    if (isNaN(stitchVal) || stitchVal < 0) {
      throw new CustomError("Stitch must be a valid non-negative number", 400);
    }
    if (isNaN(areaVal) || areaVal < 0) {
      throw new CustomError("Area must be a valid non-negative number", 400);
    }
    if (isNaN(needleVal) || needleVal < 0) {
      throw new CustomError("Needle must be a valid non-negative number", 400);
    }

    const design = await Design.create({
      designName: String(designData.designName).trim(),
      designCode: code,
      image: imageUrl,
      stitch: stitchVal,
      area: areaVal,
      needle: needleVal,
      type: String(designData.type).trim(),
      file: fileUrl,
      status: designData.status || "Active",
    });

    return await formatDesign(design);
  }

  /**
   * Get all Designs with filtering, search & pagination
   */
  async getAllDesigns(queryParams = {}) {
    const { page, limit, skip, search, status } = getPaginationQueryParams(queryParams);
    const { type } = queryParams;
    const query = {};

    if (status) {
      query.status = new RegExp(`^${status.trim()}$`, "i");
    }

    if (type) {
      query.type = new RegExp(`^${type.trim()}$`, "i");
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { designName: searchRegex },
        { designCode: searchRegex },
        { type: searchRegex },
      ];
    }

    const totalCount = await Design.countDocuments(query);
    const designs = await Design.find(query)
      .sort({ designId: -1 })
      .skip(skip)
      .limit(limit);

    const formattedDesigns = await Promise.all(
      designs.map((d) => formatDesign(d))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      designs: formattedDesigns,
      pagination,
    };
  }

  /**
   * Get single Design by numeric ID
   */
  async getDesignById(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const design = await Design.findOne({ designId: numericId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }

    return await formatDesign(design);
  }

  /**
   * Update Design by numeric ID
   */
  async updateDesign(id, updateData, files = {}) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const design = await Design.findOne({ designId: numericId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }

    // Uniqueness check for designCode if changed
    if (
      updateData.designCode &&
      updateData.designCode.trim().toLowerCase() !== design.designCode.toLowerCase()
    ) {
      const newCode = updateData.designCode.trim();
      const existingDesign = await Design.findOne({
        designCode: new RegExp(`^${newCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        designId: { $ne: numericId },
      });
      if (existingDesign) {
        throw new CustomError("Design Code already exists", 400);
      }
      design.designCode = newCode;
    }

    // Handle Image Replacement
    if (files && files.image && files.image[0]) {
      const uploadResult = await uploadToCloudinary(
        files.image[0].buffer,
        "designs/images"
      );
      design.image = uploadResult.fullUrl || uploadResult.path;
    } else if (updateData.image !== undefined && String(updateData.image).trim() !== "") {
      design.image = String(updateData.image).trim();
    }

    // Handle Embroidery File Replacement
    if (files && files.file && files.file[0]) {
      const uploadResult = await uploadToCloudinary(
        files.file[0].buffer,
        "designs/files"
      );
      design.file = uploadResult.fullUrl || uploadResult.path;
    } else if (updateData.file !== undefined && String(updateData.file).trim() !== "") {
      design.file = String(updateData.file).trim();
    }

    if (updateData.designName) design.designName = String(updateData.designName).trim();

    if (updateData.stitch !== undefined) {
      const stitchVal = Number(updateData.stitch);
      if (isNaN(stitchVal) || stitchVal < 0) {
        throw new CustomError("Stitch must be a valid non-negative number", 400);
      }
      design.stitch = stitchVal;
    }

    if (updateData.area !== undefined) {
      const areaVal = Number(updateData.area);
      if (isNaN(areaVal) || areaVal < 0) {
        throw new CustomError("Area must be a valid non-negative number", 400);
      }
      design.area = areaVal;
    }

    if (updateData.needle !== undefined) {
      const needleVal = Number(updateData.needle);
      if (isNaN(needleVal) || needleVal < 0) {
        throw new CustomError("Needle must be a valid non-negative number", 400);
      }
      design.needle = needleVal;
    }

    if (updateData.type) design.type = String(updateData.type).trim();
    if (updateData.status) design.status = updateData.status;

    await design.save();
    return await formatDesign(design);
  }

  /**
   * Update Design Status by numeric ID
   */
  async updateDesignStatus(id, status) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const design = await Design.findOne({ designId: numericId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }

    design.status = status;
    await design.save();
    return await formatDesign(design);
  }

  /**
   * Soft delete Design by numeric ID
   */
  async deleteDesign(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const design = await Design.findOne({ designId: numericId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }

    await design.softDelete();
    return { id: numericId };
  }
}

module.exports = new DesignService();
