const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: [true, "Material SKU / Item Code is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Item name / description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Thread Cone",
        "Backing Paper",
        "Machine Needle",
        "Fabric Roll",
        "Chemicals",
        "Packaging",
        "Other",
      ],
      default: "Thread Cone",
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
    },
    minStock: {
      type: Number,
      required: true,
      default: 10,
    },
    unit: {
      type: String,
      default: "Cones",
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: "Main Store",
    },
    status: {
      type: String,
      enum: ["Optimal Stock", "Low Stock Alert", "Out of Stock"],
      default: "Optimal Stock",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update status before saving
inventorySchema.pre("save", function (next) {
  if (this.currentStock <= 0) {
    this.status = "Out of Stock";
  } else if (this.currentStock <= this.minStock) {
    this.status = "Low Stock Alert";
  } else {
    this.status = "Optimal Stock";
  }
  next();
});

module.exports = mongoose.model("Inventory", inventorySchema);
