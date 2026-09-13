const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const materialSchema = new mongoose.Schema(
  {
    materialId: {
      type: Number,
      unique: true,
    },
    materialCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    materialName: {
      type: String,
      required: [true, "Material name is required"],
      trim: true,
    },
    materialType: {
      type: String,
      enum: ["Thread", "Fabric", "Backing", "Film", "Needle", "Other"],
      required: [true, "Material type is required"],
    },
    // Thread Specific Fields
    threadType: {
      type: String,
      trim: true,
      default: "", // Rayon, Polyester, Metallic, Cotton
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    colorCode: {
      type: String,
      trim: true,
      default: "", // Hex or Color Code (e.g., #FFD700 or TH-001)
    },
    countSize: {
      type: String,
      trim: true,
      default: "", // 120D/2, 40wt
    },
    // Fabric Specific Fields
    fabricType: {
      type: String,
      trim: true,
      default: "", // Georgette, Cotton, Silk, Velvet
    },
    composition: {
      type: String,
      trim: true,
      default: "", // 100% Polyester, Cotton Blend
    },
    gsm: {
      type: Number,
      default: 0,
    },
    widthInch: {
      type: Number,
      default: 0, // 44", 60"
    },
    // Common Commercial Fields
    unit: {
      type: String,
      trim: true,
      default: "Meter", // Meter, Cone, Kg, Nos, SqM
    },
    rate: {
      type: Number,
      default: 0, // Price per unit
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
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

// Pre-save hook for auto-incrementing numeric materialId (1, 2, 3...) & auto-generated materialCode
materialSchema.pre("save", async function () {
  if (this.isNew && (this.materialId === undefined || this.materialId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "materialId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.materialId = counter.seq;
  }

  // Auto-generate materialCode if not provided (TH-00001 for Thread, FB-00001 for Fabric, MAT-00001 for others)
  if (!this.materialCode) {
    const prefix = this.materialType === "Thread" ? "TH" : this.materialType === "Fabric" ? "FB" : "MAT";
    this.materialCode = `${prefix}-${String(this.materialId).padStart(5, "0")}`;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...), hides _id, materialId, __v, createdAt, updatedAt
materialSchema.methods.toJSON = function () {
  const materialObj = this.toObject();
  materialObj.id = materialObj.materialId;
  delete materialObj._id;
  delete materialObj.materialId;
  delete materialObj.__v;
  delete materialObj.createdAt;
  delete materialObj.updatedAt;
  return materialObj;
};

const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);

module.exports = Material;
