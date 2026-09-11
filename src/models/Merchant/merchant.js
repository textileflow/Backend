const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema(
  {
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
    gstCertificate: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    panCard: {
      type: String,
      trim: true,
      default: "",
    },
    panCardImage: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
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

// Format Merchant object to populate category & subCategory cleanly
merchantSchema.methods.toJSON = function () {
  const merchantObj = this.toObject();

  if (merchantObj.categoryId && typeof merchantObj.categoryId === "object") {
    merchantObj.category = {
      _id: merchantObj.categoryId._id,
      name: merchantObj.categoryId.name,
    };
    delete merchantObj.categoryId;
  }

  if (merchantObj.subCategoryId && typeof merchantObj.subCategoryId === "object") {
    merchantObj.subCategory = {
      _id: merchantObj.subCategoryId._id,
      name: merchantObj.subCategoryId.name,
    };
    delete merchantObj.subCategoryId;
  }

  delete merchantObj.__v;
  return merchantObj;
};

const Merchant = mongoose.model("Merchant", merchantSchema);

module.exports = Merchant;
