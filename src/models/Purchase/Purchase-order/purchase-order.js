const mongoose = require("mongoose");
const Counter = require("../../../models/Common/counter");
const softDeletePlugin = require("../../../plugins/softDelete");

const itemSchema = new mongoose.Schema(
  {
    materialType: {
      type: String,
      trim: true,
      default: "",
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    qty: {
      type: Number,
      required: [true, "Item quantity is required"],
      min: [0.001, "Quantity must be greater than 0"],
    },
    unit: {
      type: String,
      trim: true,
      default: "PCS",
    },
    rate: {
      type: Number,
      required: [true, "Item rate is required"],
      min: [0, "Rate cannot be negative"],
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    purchaseOrderId: {
      type: Number,
      unique: true,
    },
    poNumber: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    vendorId: {
      type: Number,
      required: [true, "Vendor ID is required"],
    },
    poDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    expDeliveryDate: {
      type: Date,
      default: null,
    },
    discountType: {
      type: String,
      enum: ["Percentage", "Fixed", "percentage", "fixed"],
      default: "Percentage",
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, "Discount value cannot be negative"],
    },
    gstRate: {
      type: Number,
      default: 0,
      min: [0, "GST rate cannot be negative"],
    },
    shippingCharge: {
      type: Number,
      default: 0,
      min: [0, "Shipping charge cannot be negative"],
    },
    subTotal: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "Approved",
        "Partially Received",
        "Completed",
        "Cancelled",
        "Inactive",
      ],
      default: "Pending",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    termsAndConditions: {
      type: String,
      trim: true,
      default: "",
    },
    items: {
      type: [itemSchema],
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        "Purchase Order must contain at least one item",
      ],
    },
  },
  {
    timestamps: true,
  }
);

purchaseOrderSchema.plugin(softDeletePlugin);

// Pre-save hook for auto-incrementing numeric purchaseOrderId (1, 2, 3...), poNumber (PO-0001) and Financial Calculations
purchaseOrderSchema.pre("save", async function () {
  if (
    this.isNew &&
    (this.purchaseOrderId === undefined || this.purchaseOrderId === null)
  ) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "purchaseOrderId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.purchaseOrderId = counter.seq;
  }

  if (!this.poNumber) {
    this.poNumber = `PO-${String(this.purchaseOrderId).padStart(4, "0")}`;
  }

  // Normalize discountType casing (Percentage / Fixed)
  if (this.discountType) {
    const lower = String(this.discountType).toLowerCase();
    this.discountType = lower === "fixed" ? "Fixed" : "Percentage";
  }

  // Calculate item amounts & subTotal
  let calculatedSubTotal = 0;
  if (Array.isArray(this.items)) {
    this.items.forEach((item) => {
      const q = Number(item.qty) || 0;
      const r = Number(item.rate) || 0;
      item.amount = Number((q * r).toFixed(2));
      calculatedSubTotal += item.amount;
    });
  }
  this.subTotal = Number(calculatedSubTotal.toFixed(2));

  // Calculate discount amount
  let calculatedDiscount = 0;
  if (this.discountType === "Percentage") {
    calculatedDiscount = (this.subTotal * (Number(this.discountValue) || 0)) / 100;
  } else if (this.discountType === "Fixed") {
    calculatedDiscount = Number(this.discountValue) || 0;
  }
  this.discountAmount = Number(
    Math.min(calculatedDiscount, this.subTotal).toFixed(2)
  );

  const amountAfterDiscount = this.subTotal - this.discountAmount;

  // Calculate GST amount
  const calculatedGst =
    (amountAfterDiscount * (Number(this.gstRate) || 0)) / 100;
  this.gstAmount = Number(calculatedGst.toFixed(2));

  // Calculate Total Amount
  const finalTotal =
    amountAfterDiscount + this.gstAmount + (Number(this.shippingCharge) || 0);
  this.totalAmount = Number(finalTotal.toFixed(2));
});

// Transform toJSON: exposes clean standardized object
purchaseOrderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.purchaseOrderId;
  delete obj._id;
  delete obj.purchaseOrderId;
  delete obj.__v;
  delete obj.isDeleted;
  delete obj.deletedAt;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const PurchaseOrder =
  mongoose.models.PurchaseOrder ||
  mongoose.model("PurchaseOrder", purchaseOrderSchema);

module.exports = PurchaseOrder;
