const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const designSchema = new mongoose.Schema(
  {
    designId: {
      type: Number,
      unique: true,
    },
    designCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    designName: {
      type: String,
      required: [true, "Design name is required"],
      trim: true,
    },
    merchantId: {
      type: Number,
      required: [true, "Merchant ID (Customer / Party Name) is required"],
      index: true,
    },
    fabricId: {
      type: Number,
      default: null,
      index: true, // Foreign key link to Material Master (Fabric)
    },
    machineId: {
      type: Number,
      default: null,
      index: true, // Foreign key link to Machine Master
    },
    category: {
      type: String,
      trim: true,
      default: "Border", // Border, Neck, All-Over, Butta, Patch, etc.
    },
    designType: {
      type: String,
      trim: true,
      default: "Embroidery", // Embroidery, Sequin, Cording, Multi Head, Chenille
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Digitizing",
        "Sampling",
        "Approval Pending",
        "Approved",
        "Hold",
        "Revision",
      ],
      default: "Draft",
    },
    currentVersion: {
      type: String,
      default: "V1",
    },
    approvedVersion: {
      type: String,
      default: null,
    },
    versionsCount: {
      type: Number,
      default: 1,
    },
    costing: {
      pieceRatePer1kStitches: { type: Number, default: 0 },
      materialCostPerPiece: { type: Number, default: 0 },
      totalEstimatedCost: { type: Number, default: 0 },
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for auto-incrementing numeric designId (1, 2, 3...) & auto-generated designCode (EMB-000125)
designSchema.pre("save", async function () {
  if (this.isNew && (this.designId === undefined || this.designId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "designId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.designId = counter.seq;
  }

  // Auto-generate designCode if not provided (e.g. EMB-000125)
  if (!this.designCode) {
    this.designCode = `EMB-${String(this.designId).padStart(6, "0")}`;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...), hides _id, designId, __v, createdAt, updatedAt
designSchema.methods.toJSON = function () {
  const designObj = this.toObject();
  designObj.id = designObj.designId;
  delete designObj._id;
  delete designObj.designId;
  delete designObj.__v;
  delete designObj.createdAt;
  delete designObj.updatedAt;
  return designObj;
};

const Design = mongoose.models.Design || mongoose.model("Design", designSchema);

module.exports = Design;
