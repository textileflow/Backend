const mongoose = require("mongoose");
const Counter = require("../Common/counter");
const softDeletePlugin = require("../../plugins/softDelete");

const designSchema = new mongoose.Schema(
  {
    designId: {
      type: Number,
      unique: true,
    },
    designName: {
      type: String,
      required: [true, "Design name is required"],
      trim: true,
    },
    designCode: {
      type: String,
      required: [true, "Design code is required"],
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Design image is required"],
      trim: true,
    },
    stitch: {
      type: Number,
      required: [true, "Stitch count is required"],
      min: [0, "Stitch count cannot be negative"],
    },
    area: {
      type: Number,
      required: [true, "Design area is required"],
      min: [0, "Design area cannot be negative"],
    },
    needle: {
      type: Number,
      required: [true, "Needle count is required"],
      min: [0, "Needle count cannot be negative"],
    },
    type: {
      type: String,
      required: [true, "Design type is required"],
      trim: true,
    },
    file: {
      type: String,
      required: [true, "Design file is required"],
      trim: true,
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

designSchema.plugin(softDeletePlugin);

designSchema.pre("save", async function () {
  if (this.isNew && (this.designId === undefined || this.designId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "designId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.designId = counter.seq;
  }

  if (!this.designCode) {
    this.designCode = `EMB-${String(this.designId).padStart(6, "0")}`;
  }
});

designSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.designId;
  delete obj._id;
  delete obj.designId;
  delete obj.__v;
  delete obj.isDeleted;
  delete obj.deletedAt;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const Design = mongoose.models.Design || mongoose.model("Design", designSchema);

module.exports = Design;
