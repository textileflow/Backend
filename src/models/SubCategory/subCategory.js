const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const subCategorySchema = new mongoose.Schema(
  {
    subCategoryId: {
      type: Number,
      unique: true,
    },
    categoryId: {
      type: Number,
      required: [true, "Category ID is required"],
    },
    name: {
      type: String,
      required: [true, "Sub Category name is required"],
      trim: true,
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

// Pre-save hook for auto-incrementing numeric subCategoryId (1, 2, 3...)
subCategorySchema.pre("save", async function () {
  if (this.isNew && (this.subCategoryId === undefined || this.subCategoryId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "subCategoryId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.subCategoryId = counter.seq;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...), hides _id, subCategoryId, __v, createdAt, updatedAt
subCategorySchema.methods.toJSON = function () {
  const subObj = this.toObject();
  subObj.id = subObj.subCategoryId;
  delete subObj._id;
  delete subObj.subCategoryId;
  delete subObj.__v;
  delete subObj.createdAt;
  delete subObj.updatedAt;
  return subObj;
};

const SubCategory = mongoose.model("SubCategory", subCategorySchema);

module.exports = SubCategory;
