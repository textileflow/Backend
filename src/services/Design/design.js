const Design = require("../../models/Design/design");
const DesignVersion = require("../../models/Design/designVersion");
const Merchant = require("../../models/Merchant/merchant");
const Fabric = require("../../models/Material/fabric");
const Thread = require("../../models/Material/thread");
const ThreadShade = require("../../models/Material/threadShade");
const ThreadCatalog = require("../../models/Material/threadCatalog");
const Material = require("../../models/Material/material");
const Machine = require("../../models/Machine/machine");
const CustomError = require("../../utils/Common/customError");
const { uploadToCloudinary } = require("../../config/cloudinary");
const {
  getPaginationQueryParams,
  buildPaginationData,
} = require("../../utils/Common/pagination");

/**
 * Format Design object with populated Customer, Fabric, Machine & Thread Shade relational details
 */
const formatDesignRecord = async (design, targetVersionNumber = null) => {
  if (!design) return {};
  const obj = typeof design.toJSON === "function" ? design.toJSON() : { ...design };

  // 1. Populate Customer (Merchant) info
  if (obj.merchantId) {
    const merchant = await Merchant.findOne({ merchantId: obj.merchantId });
    if (merchant) {
      obj.customer = {
        id: merchant.merchantId,
        companyName: merchant.companyName,
        personName: merchant.personName,
        mobile: merchant.mobile,
      };
    }
  }

  // 2. Populate Fabric info (from Fabric Master or Material Master)
  if (obj.fabricId) {
    let fabric = await Fabric.findOne({ fabricId: obj.fabricId });
    if (!fabric) {
      fabric = await Material.findOne({ materialId: obj.fabricId });
    }
    if (fabric) {
      obj.fabric = {
        id: fabric.fabricId || fabric.materialId,
        fabricCode: fabric.fabricCode || fabric.materialCode,
        fabricName: fabric.fabricName || fabric.materialName,
        fabricType: fabric.fabricType,
        gsm: fabric.gsm,
        width: fabric.width || `${fabric.widthInch || 0}"`,
      };
    }
  }

  // 3. Populate Machine info (from Machine Master)
  if (obj.machineId) {
    const machine = await Machine.findOne({ machineId: obj.machineId });
    if (machine) {
      obj.machine = {
        id: machine.machineId,
        machineCode: machine.machineCode,
        machineName: machine.machineName,
        machineType: machine.machineType,
        headCount: machine.headCount || machine.noOfHeads,
        maxRpm: machine.maxRpm,
      };
    }
  }

  delete obj.merchantId;
  delete obj.fabricId;
  delete obj.machineId;

  // 4. Fetch Version details & populate Threads / Thread Shades
  const versionQuery = { designId: obj.id };
  if (targetVersionNumber) {
    versionQuery.versionNumber = targetVersionNumber;
  } else {
    versionQuery.versionNumber = obj.currentVersion || "V1";
  }

  let activeVersionDoc = await DesignVersion.findOne(versionQuery);
  if (!activeVersionDoc) {
    activeVersionDoc = await DesignVersion.findOne({ designId: obj.id }).sort({ versionId: -1 });
  }

  if (activeVersionDoc) {
    const versionObj = activeVersionDoc.toJSON();

    // Populate threads array with Thread Shade & Catalog Master details
    if (Array.isArray(versionObj.colors)) {
      const populatedColors = await Promise.all(
        versionObj.colors.map(async (c) => {
          let shadeDetails = null;

          if (c.shadeId) {
            const shadeObj = await ThreadShade.findOne({ shadeId: c.shadeId });
            if (shadeObj) {
              let catObj = null;
              if (shadeObj.catalogId) {
                catObj = await ThreadCatalog.findOne({ catalogId: shadeObj.catalogId });
              }
              shadeDetails = {
                id: shadeObj.shadeId,
                shadeCode: shadeObj.shadeCode,
                shadeName: shadeObj.shadeName,
                colorFamily: shadeObj.colorFamily,
                colorHex: shadeObj.colorHex,
                catalog: catObj
                  ? {
                      id: catObj.catalogId,
                      catalogCode: catObj.catalogCode,
                      catalogName: catObj.catalogName,
                      threadType: catObj.threadType,
                      threadSize: catObj.threadSize,
                    }
                  : null,
              };
            }
          }

          if (!shadeDetails && c.threadId) {
            let threadObj = await Thread.findOne({ threadId: c.threadId });
            if (!threadObj) {
              threadObj = await Material.findOne({ materialId: c.threadId });
            }
            if (threadObj) {
              shadeDetails = {
                id: threadObj.threadId || threadObj.materialId,
                shadeCode: threadObj.threadCode || threadObj.materialCode,
                shadeName: threadObj.threadName || threadObj.materialName,
                colorFamily: threadObj.colorName || threadObj.color || "General",
                colorHex: threadObj.colorCode || "#000000",
                catalog: {
                  id: 0,
                  catalogCode: "GENERAL",
                  catalogName: threadObj.brand || "General",
                  threadType: threadObj.threadType || "Rayon",
                  threadSize: threadObj.countSize || "120D",
                },
              };
            }
          }

          return {
            ...c,
            shadeDetails: shadeDetails || c.shadeDetails || null,
          };
        })
      );
      versionObj.colors = populatedColors;
    }

    obj.currentVersionDetails = versionObj;
  }

  // 5. Fetch summary list of all versions
  const allVersions = await DesignVersion.find({ designId: obj.id })
    .sort({ versionId: 1 })
    .select("versionNumber versionCode status isReadonly createdAt technicalSpecs");

  obj.availableVersions = allVersions.map((v) => ({
    versionNumber: v.versionNumber,
    versionCode: v.versionCode,
    status: v.status,
    isReadonly: v.isReadonly,
    stitchCount: v.technicalSpecs ? v.technicalSpecs.stitchCount : 0,
    colorCount: v.technicalSpecs ? v.technicalSpecs.colorCount : 0,
    createdAt: v.createdAt,
  }));

  return obj;
};

class DesignService {
  async createDesign(designData, files = {}) {
    const numMerchantId = Number(designData.merchantId);
    const numStitchCount = Number(designData.stitchCount);

    if (isNaN(numMerchantId)) {
      throw new CustomError("Invalid Merchant ID", 400);
    }
    if (isNaN(numStitchCount) || numStitchCount <= 0) {
      throw new CustomError("Stitch count must be greater than 0", 400);
    }

    const merchant = await Merchant.findOne({ merchantId: numMerchantId });
    if (!merchant) {
      throw new CustomError("Selected Customer (Merchant) does not exist", 404);
    }

    let numFabricId = null;
    if (designData.fabricId) {
      numFabricId = Number(designData.fabricId);
      let fabricMat = await Fabric.findOne({ fabricId: numFabricId });
      if (!fabricMat) {
        fabricMat = await Material.findOne({ materialId: numFabricId });
      }
      if (!fabricMat) {
        throw new CustomError("Selected Fabric material does not exist", 404);
      }
    }

    let numMachineId = null;
    if (designData.machineId) {
      numMachineId = Number(designData.machineId);
      const machineEntity = await Machine.findOne({ machineId: numMachineId });
      if (!machineEntity) {
        throw new CustomError("Selected Machine does not exist", 404);
      }
    }

    if (designData.designCode) {
      const existingCode = await Design.findOne({
        designCode: designData.designCode.trim().toUpperCase(),
      });
      if (existingCode) {
        throw new CustomError("Design Code already exists", 400);
      }
    }

    const design = await Design.create({
      designCode: designData.designCode ? designData.designCode.trim().toUpperCase() : undefined,
      designName: designData.designName.trim(),
      merchantId: numMerchantId,
      fabricId: numFabricId,
      machineId: numMachineId,
      category: designData.category ? designData.category.trim() : "Border",
      designType: designData.designType ? designData.designType.trim() : "Embroidery",
      status: designData.status || "Draft",
      currentVersion: "V1",
      versionsCount: 1,
      costing: {
        pieceRatePer1kStitches: designData.pieceRatePer1kStitches ? Number(designData.pieceRatePer1kStitches) : 0,
        materialCostPerPiece: designData.materialCostPerPiece ? Number(designData.materialCostPerPiece) : 0,
        totalEstimatedCost: Number(
          (
            (numStitchCount / 1000) * (designData.pieceRatePer1kStitches || 0) +
            Number(designData.materialCostPerPiece || 0)
          ).toFixed(2)
        ),
      },
      note: designData.note ? designData.note.trim() : "",
    });

    let previewUrl = designData.previewImage || "";
    const machineFilesList = [];
    const artworkFilesList = [];

    if (files && files.thumbnailImage && files.thumbnailImage[0]) {
      const result = await uploadToCloudinary(files.thumbnailImage[0].buffer, "upload-single");
      previewUrl = result.path;
    }

    if (files && files.designFiles && files.designFiles.length > 0) {
      for (const file of files.designFiles) {
        const result = await uploadToCloudinary(file.buffer, "upload-single");
        const ext = file.originalname.split(".").pop().toUpperCase();
        if (["DST", "EMB", "EXP", "POF"].includes(ext)) {
          machineFilesList.push({
            format: ext,
            fileName: file.originalname,
            filePath: result.path,
          });
        } else {
          artworkFilesList.push({
            format: ext,
            fileName: file.originalname,
            filePath: result.path,
          });
        }
      }
    }

    let parsedColors = [];
    if (designData.colors) {
      parsedColors = typeof designData.colors === "string" ? JSON.parse(designData.colors) : designData.colors;
    }

    let parsedMaterials = [];
    if (designData.materials) {
      parsedMaterials = typeof designData.materials === "string" ? JSON.parse(designData.materials) : designData.materials;
    }

    let parsedMachines = [];
    if (designData.machines) {
      parsedMachines = typeof designData.machines === "string" ? JSON.parse(designData.machines) : designData.machines;
    }

    await DesignVersion.create({
      designId: design.designId,
      versionNumber: "V1",
      versionCode: `${design.designCode}-V1`,
      status: design.status,
      changeSummary: "Initial Design Creation (V1)",
      technicalSpecs: {
        widthCm: designData.width ? Number(designData.width) : 0,
        heightCm: designData.height ? Number(designData.height) : 0,
        stitchCount: numStitchCount,
        colorCount: designData.colorCount ? Number(designData.colorCount) : parsedColors.length || 1,
        repeatXCm: designData.repeatX ? Number(designData.repeatX) : 0,
        repeatYCm: designData.repeatY ? Number(designData.repeatY) : 0,
        headSpacingMm: designData.headSpacing ? Number(designData.headSpacing) : 40,
        machineType: designData.machineType ? designData.machineType.trim() : "Multi Head",
        machineRpm: designData.machineRpm ? Number(designData.machineRpm) : 750,
        efficiencyPercent: designData.efficiencyPercent ? Number(designData.efficiencyPercent) : 85,
      },
      files: {
        preview: previewUrl,
        machineFiles: machineFilesList,
        artworkFiles: artworkFilesList,
      },
      colors: parsedColors,
      materials: parsedMaterials,
      machines: parsedMachines,
      approvals: [
        {
          versionNumber: "V1",
          statusFrom: "None",
          statusTo: design.status,
          changedBy: designData.createdByName || "System Admin",
          comments: "Design V1 created",
        },
      ],
    });

    return await formatDesignRecord(design, "V1");
  }

  async createDesignVersion(designId, versionData, files = {}) {
    const numericId = Number(designId);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const design = await Design.findOne({ designId: numericId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }

    const nextVersionNum = design.versionsCount + 1;
    const versionNumberStr = `V${nextVersionNum}`;

    const prevVersion = await DesignVersion.findOne({
      designId: numericId,
      versionNumber: design.currentVersion,
    });

    const prevSpecs = prevVersion ? prevVersion.technicalSpecs : {};

    const numStitchCount = versionData.stitchCount
      ? Number(versionData.stitchCount)
      : prevSpecs.stitchCount || 10000;

    let previewUrl = versionData.previewImage || (prevVersion ? prevVersion.files.preview : "");
    const machineFilesList = prevVersion ? [...(prevVersion.files.machineFiles || [])] : [];
    const artworkFilesList = prevVersion ? [...(prevVersion.files.artworkFiles || [])] : [];

    if (files && files.thumbnailImage && files.thumbnailImage[0]) {
      const result = await uploadToCloudinary(files.thumbnailImage[0].buffer, "upload-single");
      previewUrl = result.path;
    }

    if (files && files.designFiles && files.designFiles.length > 0) {
      for (const file of files.designFiles) {
        const result = await uploadToCloudinary(file.buffer, "upload-single");
        const ext = file.originalname.split(".").pop().toUpperCase();
        if (["DST", "EMB", "EXP", "POF"].includes(ext)) {
          machineFilesList.push({
            format: ext,
            fileName: file.originalname,
            filePath: result.path,
          });
        } else {
          artworkFilesList.push({
            format: ext,
            fileName: file.originalname,
            filePath: result.path,
          });
        }
      }
    }

    let parsedColors = prevVersion ? prevVersion.colors : [];
    if (versionData.colors) {
      parsedColors = typeof versionData.colors === "string" ? JSON.parse(versionData.colors) : versionData.colors;
    }

    let parsedMaterials = prevVersion ? prevVersion.materials : [];
    if (versionData.materials) {
      parsedMaterials = typeof versionData.materials === "string" ? JSON.parse(versionData.materials) : versionData.materials;
    }

    let parsedMachines = prevVersion ? prevVersion.machines : [];
    if (versionData.machines) {
      parsedMachines = typeof versionData.machines === "string" ? JSON.parse(versionData.machines) : versionData.machines;
    }

    await DesignVersion.create({
      designId: numericId,
      versionNumber: versionNumberStr,
      versionCode: `${design.designCode}-${versionNumberStr}`,
      status: versionData.status || "Revision",
      changeSummary: versionData.changeSummary || `Created revision ${versionNumberStr}`,
      technicalSpecs: {
        widthCm: versionData.width !== undefined ? Number(versionData.width) : prevSpecs.widthCm || 0,
        heightCm: versionData.height !== undefined ? Number(versionData.height) : prevSpecs.heightCm || 0,
        stitchCount: numStitchCount,
        colorCount: versionData.colorCount ? Number(versionData.colorCount) : parsedColors.length || 1,
        repeatXCm: versionData.repeatX !== undefined ? Number(versionData.repeatX) : prevSpecs.repeatXCm || 0,
        repeatYCm: versionData.repeatY !== undefined ? Number(versionData.repeatY) : prevSpecs.repeatYCm || 0,
        headSpacingMm: versionData.headSpacing !== undefined ? Number(versionData.headSpacing) : prevSpecs.headSpacingMm || 40,
        machineType: versionData.machineType ? versionData.machineType.trim() : prevSpecs.machineType || "Multi Head",
        machineRpm: versionData.machineRpm ? Number(versionData.machineRpm) : prevSpecs.machineRpm || 750,
        efficiencyPercent: versionData.efficiencyPercent ? Number(versionData.efficiencyPercent) : prevSpecs.efficiencyPercent || 85,
      },
      files: {
        preview: previewUrl,
        machineFiles: machineFilesList,
        artworkFiles: artworkFilesList,
      },
      colors: parsedColors,
      materials: parsedMaterials,
      machines: parsedMachines,
      approvals: [
        {
          versionNumber: versionNumberStr,
          statusFrom: design.status,
          statusTo: versionData.status || "Revision",
          changedBy: versionData.createdByName || "System Admin",
          comments: versionData.changeSummary || `Version ${versionNumberStr} created`,
        },
      ],
    });

    design.currentVersion = versionNumberStr;
    design.versionsCount = nextVersionNum;
    design.status = versionData.status || "Revision";
    await design.save();

    return await formatDesignRecord(design, versionNumberStr);
  }

  async getAllDesigns(queryParams = {}) {
    const { page, limit, skip, search } = getPaginationQueryParams(queryParams);
    const { merchantId, fabricId, machineId, status, category, designType } = queryParams;
    const query = {};

    if (merchantId) {
      const numMerchantId = Number(merchantId);
      if (!isNaN(numMerchantId)) query.merchantId = numMerchantId;
    }

    if (fabricId) {
      const numFabricId = Number(fabricId);
      if (!isNaN(numFabricId)) query.fabricId = numFabricId;
    }

    if (machineId) {
      const numMachineId = Number(machineId);
      if (!isNaN(numMachineId)) query.machineId = numMachineId;
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = new RegExp(category, "i");
    }

    if (designType) {
      query.designType = new RegExp(designType, "i");
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      
      const matchedMerchants = await Merchant.find({ companyName: searchRegex }).select("merchantId");
      const matchedMerchantIds = matchedMerchants.map((m) => m.merchantId);

      query.$or = [
        { designCode: searchRegex },
        { designName: searchRegex },
        { category: searchRegex },
        { designType: searchRegex },
        { merchantId: { $in: matchedMerchantIds } },
      ];
    }

    const totalCount = await Design.countDocuments(query);
    const designs = await Design.find(query)
      .sort({ designId: -1 })
      .skip(skip)
      .limit(limit);

    const formattedDesigns = await Promise.all(
      designs.map((d) => formatDesignRecord(d))
    );

    const pagination = buildPaginationData(totalCount, page, limit);

    return {
      designs: formattedDesigns,
      pagination,
    };
  }

  async getDashboardMetrics() {
    const totalDesigns = await Design.countDocuments();
    const draftCount = await Design.countDocuments({ status: "Draft" });
    const digitizingCount = await Design.countDocuments({ status: "Digitizing" });
    const samplingCount = await Design.countDocuments({ status: "Sampling" });
    const approvalPendingCount = await Design.countDocuments({ status: "Approval Pending" });
    const approvedCount = await Design.countDocuments({ status: "Approved" });
    const revisionCount = await Design.countDocuments({ status: "Revision" });
    const holdCount = await Design.countDocuments({ status: "Hold" });

    return {
      totalDesigns,
      draftCount,
      digitizingCount,
      samplingCount,
      approvalPendingCount,
      approvedCount,
      revisionCount,
      holdCount,
    };
  }

  async getDesignById(id, versionNumber = null) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const design = await Design.findOne({ designId: numericId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }

    return await formatDesignRecord(design, versionNumber);
  }

  async updateDesignStatus(designId, versionNumber, newStatus, userDetails = {}) {
    const numericId = Number(designId);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const design = await Design.findOne({ designId: numericId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }

    const targetVersionStr = versionNumber || design.currentVersion;
    const versionDoc = await DesignVersion.findOne({
      designId: numericId,
      versionNumber: targetVersionStr,
    });

    if (!versionDoc) {
      throw new CustomError(`Design version ${targetVersionStr} not found`, 404);
    }

    if (versionDoc.isReadonly && newStatus !== "Approved") {
      throw new CustomError(`Version ${targetVersionStr} is approved and locked as Read-Only. Create a new version for revisions.`, 400);
    }

    const oldStatus = versionDoc.status;
    versionDoc.status = newStatus;

    if (newStatus === "Approved") {
      versionDoc.isReadonly = true;
      design.approvedVersion = targetVersionStr;
    }

    versionDoc.approvals.push({
      versionNumber: targetVersionStr,
      statusFrom: oldStatus,
      statusTo: newStatus,
      changedBy: userDetails.name || "System Admin",
      comments: userDetails.comments || `Status updated from ${oldStatus} to ${newStatus}`,
      timestamp: new Date(),
    });

    await versionDoc.save();

    design.status = newStatus;
    await design.save();

    return await formatDesignRecord(design, targetVersionStr);
  }

  async getJobCardData(designId, requestedVersion = null) {
    const numericId = Number(designId);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const design = await Design.findOne({ designId: numericId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }

    const merchant = await Merchant.findOne({ merchantId: design.merchantId });
    let fabric = design.fabricId ? await Fabric.findOne({ fabricId: design.fabricId }) : null;
    if (!fabric && design.fabricId) fabric = await Material.findOne({ materialId: design.fabricId });

    const machine = design.machineId ? await Machine.findOne({ machineId: design.machineId }) : null;

    const targetVersion = requestedVersion || design.approvedVersion || design.currentVersion;
    const versionDoc = await DesignVersion.findOne({
      designId: numericId,
      versionNumber: targetVersion,
    });

    if (!versionDoc) {
      throw new CustomError(`Version ${targetVersion} not found for Job Card creation`, 404);
    }

    return {
      jobCardDesignPayload: {
        designId: design.designId,
        designCode: design.designCode,
        designName: design.designName,
        customer: merchant
          ? { id: merchant.merchantId, companyName: merchant.companyName, mobile: merchant.mobile }
          : null,
        fabric: fabric
          ? { id: fabric.fabricId || fabric.materialId, fabricCode: fabric.fabricCode || fabric.materialCode, fabricName: fabric.fabricName || fabric.materialName }
          : null,
        assignedMachine: machine
          ? { id: machine.machineId, machineCode: machine.machineCode, machineName: machine.machineName, headCount: machine.headCount || machine.noOfHeads }
          : null,
        version: versionDoc.versionNumber,
        versionCode: versionDoc.versionCode,
        isApproved: versionDoc.status === "Approved",
        technicalSpecs: versionDoc.technicalSpecs,
        previewImage: versionDoc.files.preview,
        machineFiles: versionDoc.files.machineFiles,
        threadRequirements: versionDoc.colors,
        materialsBOM: versionDoc.materials,
        compatibleMachines: versionDoc.machines,
      },
    };
  }

  async deleteDesign(id) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new CustomError("Invalid Design ID", 400);
    }

    const design = await Design.findOne({ designId: numericId });
    if (!design) {
      throw new CustomError("Design not found", 404);
    }

    await DesignVersion.deleteMany({ designId: numericId });
    await Design.findOneAndDelete({ designId: numericId });

    return { id: numericId };
  }
}

module.exports = new DesignService();
