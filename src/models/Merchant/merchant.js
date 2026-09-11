const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const merchantSchema = new mongoose.Schema(
  {
    merchantId: {
      type: Number,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    personName: {
      type: String,
      required: [true, "Person name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    paymentTerm: {
      type: String,
      trim: true,
      default: "",
    },
    gstName: {
      type: String,
      trim: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    gstCertificate: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    panCard: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    panCardImage: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    categoryId: {
      type: Number,
      required: [true, "Category ID is required"],
    },
    subCategoryId: {
      type: [Number],
      required: [true, "Sub Category ID is required"],
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

// Pre-save hook for auto-incrementing numeric merchantId (1, 2, 3...)
merchantSchema.pre("save", async function () {
  if (this.isNew && (this.merchantId === undefined || this.merchantId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "merchantId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.merchantId = counter.seq;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...), hides _id, merchantId, __v, createdAt, updatedAt
merchantSchema.methods.toJSON = function () {
  const merchantObj = this.toObject();
  merchantObj.id = merchantObj.merchantId;
  delete merchantObj._id;
  delete merchantObj.merchantId;
  delete merchantObj.__v;
  delete merchantObj.createdAt;
  delete merchantObj.updatedAt;
  return merchantObj;
};

const Merchant = mongoose.models.Merchant || mongoose.model("Merchant", merchantSchema);

module.exports = Merchant;
