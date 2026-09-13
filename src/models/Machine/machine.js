const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const machineSchema = new mongoose.Schema(
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
    machineTypeId: {
      type: Number,
      default: null, // Foreign Key link to MachineType Master
      index: true,
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
      default: "TMAR",
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

// Pre-save hook for auto-incrementing numeric machineId (1, 2, 3...) & auto-generated machineCode (MACH-0001)
machineSchema.pre("save", async function () {
  if (this.isNew && (this.machineId === undefined || this.machineId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "machineId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.machineId = counter.seq;
  }

  if (!this.machineCode) {
    this.machineCode = `MACH-${String(this.machineId).padStart(4, "0")}`;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...) and noOfHeads alias
machineSchema.methods.toJSON = function () {
  const machineObj = this.toObject();
  machineObj.id = machineObj.machineId;
  machineObj.noOfHeads = machineObj.headCount; // Alias for backward compatibility
  delete machineObj._id;
  delete machineObj.machineId;
  delete machineObj.__v;
  delete machineObj.createdAt;
  delete machineObj.updatedAt;
  return machineObj;
};

const Machine = mongoose.models.Machine || mongoose.model("Machine", machineSchema);

module.exports = Machine;
