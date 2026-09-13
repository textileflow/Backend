const mongoose = require("mongoose");
const Counter = require("../../../Common/counter");
const softDeletePlugin = require("../../../../plugins/softDelete");

const vendorTypeSchema = new mongoose.Schema(
  {
    vendorTypeId: {
      type: Number,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Vendor type name is required"],
      trim: true,
      unique: true,
    },
    note: {
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

vendorTypeSchema.plugin(softDeletePlugin);

// Pre-save hook for auto-incrementing numeric vendorTypeId (1, 2, 3...)
vendorTypeSchema.pre("save", async function () {
  if (this.isNew && (this.vendorTypeId === undefined || this.vendorTypeId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "vendorTypeId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.vendorTypeId = counter.seq;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...), hides internal fields
vendorTypeSchema.methods.toJSON = function () {
  const vendorTypeObj = this.toObject();
  vendorTypeObj.id = vendorTypeObj.vendorTypeId;
  delete vendorTypeObj._id;
  delete vendorTypeObj.vendorTypeId;
  delete vendorTypeObj.__v;
  delete vendorTypeObj.isDeleted;
  delete vendorTypeObj.deletedAt;
  delete vendorTypeObj.createdAt;
  delete vendorTypeObj.updatedAt;
  return vendorTypeObj;
};

const VendorType =
  mongoose.models.VendorType || mongoose.model("VendorType", vendorTypeSchema);

module.exports = VendorType;
