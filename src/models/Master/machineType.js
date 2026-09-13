const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const machineTypeSchema = new mongoose.Schema(
  {
    machineTypeId: {
      type: Number,
      unique: true,
    },
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Machine type name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
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

// Pre-save hook for auto-incrementing numeric machineTypeId (1, 2, 3...) & auto-generated code (MT-001)
machineTypeSchema.pre("save", async function () {
  if (this.isNew && (this.machineTypeId === undefined || this.machineTypeId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "machineTypeId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.machineTypeId = counter.seq;
  }

  if (!this.code) {
    this.code = `MT-${String(this.machineTypeId).padStart(3, "0")}`;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...)
machineTypeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.machineTypeId;
  delete obj._id;
  delete obj.machineTypeId;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const MachineType =
  mongoose.models.MachineType || mongoose.model("MachineType", machineTypeSchema);

module.exports = MachineType;
