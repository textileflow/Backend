const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const designVersionSchema = new mongoose.Schema(
  {
    versionId: {
      type: Number,
      unique: true,
    },
    designId: {
      type: Number,
      required: [true, "Parent Design ID is required"],
      index: true,
    },
    versionNumber: {
      type: String,
      required: [true, "Version number is required (e.g. V1, V2)"],
      trim: true,
    },
    versionCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Digitizing",
        "Digitized",
        "Sampling",
        "Approval Pending",
        "Approved",
        "Rejected",
        "Revision",
        "Hold",
      ],
      default: "Draft",
    },
    isReadonly: {
      type: Boolean,
      default: false,
    },
    changeSummary: {
      type: String,
      trim: true,
      default: "",
    },
    // Technical Specifications
    technicalSpecs: {
      widthCm: { type: Number, default: 0 },
      heightCm: { type: Number, default: 0 },
      stitchCount: { type: Number, required: true, min: 1 },
      colorCount: { type: Number, default: 1 },
      repeatXCm: { type: Number, default: 0 },
      repeatYCm: { type: Number, default: 0 },
      headSpacingMm: { type: Number, default: 40 },
      machineType: { type: String, default: "Multi Head", trim: true },
      machineRpm: { type: Number, default: 750 },
      efficiencyPercent: { type: Number, default: 85 },
      theoreticalTimeMinutes: { type: Number, default: 0 },
      estimatedTimeMinutes: { type: Number, default: 0 },
    },
    // Files Management (Per Version)
    files: {
      preview: { type: String, default: "" },
      machineFiles: [
        {
          format: { type: String, uppercase: true, trim: true },
          fileName: { type: String, trim: true },
          filePath: { type: String, trim: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      artworkFiles: [
        {
          format: { type: String, uppercase: true, trim: true },
          fileName: { type: String, trim: true },
          filePath: { type: String, trim: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },
    // Relational Threads / Colorway Module
    colors: [
      {
        sequenceNo: { type: Number, default: 1 },
        threadId: { type: Number, default: null }, // Foreign key link to Material Master (Thread)
        threadCode: { type: String, trim: true, uppercase: true },
        colorName: { type: String, trim: true },
        hexCode: { type: String, trim: true, default: "#000000" },
        consumptionMeters: { type: Number, default: 0 },
        threadType: { type: String, trim: true, default: "Rayon" },
      },
    ],
    // Bill of Materials (BOM) & Material Requirement
    materials: [
      {
        materialId: { type: Number, default: null }, // Foreign key link to Material Master
        materialName: { type: String, trim: true, required: true },
        itemType: { type: String, trim: true, default: "Thread" },
        consumption: { type: Number, required: true },
        unit: { type: String, trim: true, default: "Meter" },
        notes: { type: String, trim: true, default: "" },
      },
    ],
    // Machine Compatibility List
    machines: [
      {
        machineId: { type: Number, default: null }, // Foreign key link to Machine Master
        machineName: { type: String, trim: true, required: true },
        machineType: { type: String, trim: true, default: "Multi Head" },
        isCompatible: { type: Boolean, default: true },
      },
    ],
    // Approval Workflow & Audit Log
    approvals: [
      {
        versionNumber: { type: String, trim: true },
        statusFrom: { type: String, trim: true },
        statusTo: { type: String, trim: true },
        changedBy: { type: String, trim: true },
        comments: { type: String, trim: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for auto-incrementing versionId and calculating production times
designVersionSchema.pre("save", async function () {
  if (this.isNew && (this.versionId === undefined || this.versionId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "designVersionId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.versionId = counter.seq;
  }

  // Calculate production times
  const specs = this.technicalSpecs;
  if (specs && specs.stitchCount > 0) {
    const rpm = specs.machineRpm && specs.machineRpm > 0 ? specs.machineRpm : 750;
    const efficiency = specs.efficiencyPercent && specs.efficiencyPercent > 0 ? specs.efficiencyPercent : 85;

    specs.theoreticalTimeMinutes = Number((specs.stitchCount / rpm).toFixed(2));
    specs.estimatedTimeMinutes = Number((specs.theoreticalTimeMinutes / (efficiency / 100)).toFixed(2));
  }

  if (this.status === "Approved") {
    this.isReadonly = true;
  }
});

// Transform toJSON
designVersionSchema.methods.toJSON = function () {
  const versionObj = this.toObject();
  versionObj.id = versionObj.versionId;
  delete versionObj._id;
  delete versionObj.versionId;
  delete versionObj.__v;
  delete versionObj.createdAt;
  delete versionObj.updatedAt;
  return versionObj;
};

const DesignVersion =
  mongoose.models.DesignVersion || mongoose.model("DesignVersion", designVersionSchema);

module.exports = DesignVersion;
