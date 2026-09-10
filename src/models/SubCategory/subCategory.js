const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
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

// Ensure Sub Category name is unique per Category
subCategorySchema.index({ categoryId: 1, name: 1 }, { unique: true });

const SubCategory = mongoose.model("SubCategory", subCategorySchema);

module.exports = SubCategory;
