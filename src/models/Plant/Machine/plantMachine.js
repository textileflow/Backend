const mongoose = require("mongoose");
const Counter = require("../../Common/counter");
const softDeletePlugin = require("../../../plugins/softDelete");

const plantMachineSchema = new mongoose.Schema(
  {
    machineId: {
      type: Number,
      unique: true,
    },
    machineCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    machineName: {
      type: String,
      required: [true, "Machine name is required"],
      trim: true,
    },
    ownership: {
      type: String,
      enum: ["In-house", "Subcontractor"],
      default: "In-house",
    },
    plantId: {
      type: Number,
      default: null, // Linked if ownership is In-house
      index: true,
    },
    subContractorId: {
      type: Number,
      default: null, // Linked if ownership is Subcontractor
      index: true,
    },
    machineTypeId: {
      type: Number,
      default: null,
    },
    machineType: {
      type: String,
      trim: true,
      default: "Multi Head",
    },
    brand: {
      type: String,
      trim: true,
      default: "Tajima",
    },
    model: {
      type: String,
      trim: true,
      default: "",
    },
    headCount: {
      type: Number,
      required: [true, "Head count is required"],
      min: [1, "Heads count must be at least 1"],
      default: 20,
    },
    needleCount: {
      type: Number,
      default: 9,
    },
    maxRpm: {
      type: Number,
      default: 800,
    },
    headSpacing: {
      type: Number,
      default: 400, // in mm
    },
    status: {
      type: String,
      enum: ["Active", "Maintenance", "Inactive"],
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

plantMachineSchema.plugin(softDeletePlugin);

plantMachineSchema.pre("save", async function () {
  if (this.isNew && (this.machineId === undefined || this.machineId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "plantMachineId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.machineId = counter.seq;
  }

  if (!this.machineCode) {
    this.machineCode = `MACH-${String(this.machineId).padStart(4, "0")}`;
  }
});

plantMachineSchema.methods.toJSON = function () {
  const mObj = this.toObject();
  mObj.id = mObj.machineId;
  mObj.noOfHeads = mObj.headCount;
  delete mObj._id;
  delete mObj.machineId;
  delete mObj.__v;
  delete mObj.isDeleted;
  delete mObj.deletedAt;
  delete mObj.createdAt;
  delete mObj.updatedAt;
  return mObj;
};

const PlantMachine =
  mongoose.models.PlantMachine ||
  mongoose.model("PlantMachine", plantMachineSchema);

module.exports = PlantMachine;
