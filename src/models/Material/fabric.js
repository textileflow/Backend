const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const fabricSchema = new mongoose.Schema(
  {
    fabricId: {
      type: Number,
      unique: true,
    },
    fabricCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fabricName: {
      type: String,
      required: [true, "Fabric name is required"],
      trim: true,
    },
    fabricType: {
      type: String,
      required: [true, "Fabric type is required"],
      trim: true, // Woven, Knitted, Non-Woven
    },
    composition: {
      type: String,
      trim: true,
      default: "Polyester",
    },
    gsm: {
      type: Number,
      default: 80,
    },
    width: {
      type: String,
      trim: true,
      default: "44 inch",
    },
    unitId: {
      type: Number,
      default: null, // Foreign Key link to Unit Master
    },
    rate: {
      type: Number,
      default: 0, // Price per unit (e.g. ₹65 per Meter)
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for auto-incrementing numeric fabricId (1, 2, 3...) & auto-generated fabricCode (FAB-0001)
fabricSchema.pre("save", async function () {
  if (this.isNew && (this.fabricId === undefined || this.fabricId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "fabricId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.fabricId = counter.seq;
  }

  if (!this.fabricCode) {
    this.fabricCode = `FAB-${String(this.fabricId).padStart(4, "0")}`;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...)
fabricSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.fabricId;
  delete obj._id;
  delete obj.fabricId;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const Fabric = mongoose.models.Fabric || mongoose.model("Fabric", fabricSchema);

module.exports = Fabric;
