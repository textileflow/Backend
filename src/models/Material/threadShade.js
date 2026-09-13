const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const threadShadeSchema = new mongoose.Schema(
  {
    shadeId: {
      type: Number,
      unique: true,
    },
    shadeCode: {
      type: String,
      required: [true, "Shade code is required (e.g. 76, 78.L, 125, 301)"],
      trim: true,
      uppercase: true,
    },
    shadeName: {
      type: String,
      trim: true,
      default: "", // Dark Green, Maroon, Gold
    },
    catalogId: {
      type: Number,
      required: [true, "Thread Catalog ID is required"],
      index: true,
    },
    colorFamily: {
      type: String,
      trim: true,
      default: "General", // Red, Green, Blue, Gold, Black, White
    },
    colorHex: {
      type: String,
      trim: true,
      default: "#000000",
    },
    shadeImage: {
      type: String,
      trim: true,
      default: "", // Swatch Image URL
    },
    standardWeightGram: {
      type: Number,
      default: 500, // 500 gm per Cone
    },
    purchaseUnitId: {
      type: Number,
      default: null, // Link to Unit Master
    },
    rate: {
      type: Number,
      default: 0,
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

threadShadeSchema.pre("save", async function () {
  if (this.isNew && (this.shadeId === undefined || this.shadeId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "threadShadeId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.shadeId = counter.seq;
  }
});

threadShadeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.shadeId;
  delete obj._id;
  delete obj.shadeId;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const ThreadShade =
  mongoose.models.ThreadShade || mongoose.model("ThreadShade", threadShadeSchema);

module.exports = ThreadShade;
