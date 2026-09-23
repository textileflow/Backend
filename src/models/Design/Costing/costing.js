const mongoose = require("mongoose");
const Counter = require("../../Common/counter");
const softDeletePlugin = require("../../../plugins/softDelete");

const designCostingSchema = new mongoose.Schema(
  {
    costingId: {
      type: Number,
      unique: true,
    },
    designId: {
      type: Number,
      required: [true, "Design ID is required"],
      index: true,
    },
    designCode: {
      type: String,
      required: true,
      trim: true,
    },
    designName: {
      type: String,
      required: true,
      trim: true,
    },
    stitch: {
      type: Number,
      required: true,
      min: [0, "Stitch count cannot be negative"],
    },
    area: {
      type: Number,
      required: true,
      min: [0, "Area cannot be negative"],
    },
    pricePer1000: {
      type: Number,
      required: [true, "Price per 1000 stitches is required"],
      min: [0, "Price per 1000 stitches cannot be negative"],
    },
    stitchCost: {
      type: Number,
      required: true,
      min: [0, "Stitch cost cannot be negative"],
    },
    meterConversionFactor: {
      type: Number,
      required: true,
      default: 400,
      min: [0.0001, "Meter conversion factor must be greater than 0"],
    },
    meterValue: {
      type: Number,
      required: true,
      min: [0, "Meter value cannot be negative"],
    },
    meterCost: {
      type: Number,
      required: true,
      min: [0, "Meter cost cannot be negative"],
    },
    headAdjustmentEnabled: {
      type: Boolean,
      default: false,
    },
    headAdjustmentFactor: {
      type: Number,
      default: 1,
      min: [0, "Head adjustment factor cannot be negative"],
    },
    headAdjustedCost: {
      type: Number,
      required: true,
      min: [0, "Head adjusted cost cannot be negative"],
    },
    finalCost: {
      type: Number,
      required: true,
      min: [0, "Final cost cannot be negative"],
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

designCostingSchema.plugin(softDeletePlugin);

designCostingSchema.pre("save", async function () {
  if (this.isNew && (this.costingId === undefined || this.costingId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "designCostingId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.costingId = counter.seq;
  }
});

designCostingSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.costingId;
  delete obj._id;
  delete obj.costingId;
  delete obj.__v;
  delete obj.isDeleted;
  delete obj.deletedAt;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const DesignCosting =
  mongoose.models.DesignCosting ||
  mongoose.model("DesignCosting", designCostingSchema);

module.exports = DesignCosting;
