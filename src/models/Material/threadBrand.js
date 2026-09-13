const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const threadBrandSchema = new mongoose.Schema(
  {
    brandId: {
      type: Number,
      unique: true,
    },
    brandCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
    },
    vendorId: {
      type: Number,
      default: null, // Foreign Key link to Vendor Master
      index: true,
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

threadBrandSchema.pre("save", async function () {
  if (this.isNew && (this.brandId === undefined || this.brandId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "threadBrandId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.brandId = counter.seq;
  }

  if (!this.brandCode) {
    this.brandCode = `BRD-${String(this.brandId).padStart(4, "0")}`;
  }
});

threadBrandSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.brandId;
  delete obj._id;
  delete obj.brandId;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const ThreadBrand =
  mongoose.models.ThreadBrand || mongoose.model("ThreadBrand", threadBrandSchema);

module.exports = ThreadBrand;
