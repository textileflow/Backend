const mongoose = require("mongoose");

const productionSchema = new mongoose.Schema(
  {
    jobCardNo: {
      type: String,
      required: [true, "Job Card number is required"],
      unique: true,
      trim: true,
    },
    designName: {
      type: String,
      required: [true, "Design specification / name is required"],
      trim: true,
    },
    machineName: {
      type: String,
      required: [true, "Assigned machine is required"],
      trim: true,
    },
    operatorName: {
      type: String,
      required: [true, "Operator name is required"],
      trim: true,
    },
    plannedTarget: {
      type: Number,
      required: true,
      default: 1000,
    },
    producedCount: {
      type: Number,
      required: true,
      default: 0,
    },
    reworkCount: {
      type: Number,
      default: 0,
    },
    rejectionCount: {
      type: Number,
      default: 0,
    },
    shift: {
      type: String,
      enum: ["Shift A", "Shift B", "Night Shift"],
      default: "Shift A",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Running", "Paused", "Completed", "Rework"],
      default: "Running",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Production", productionSchema);
