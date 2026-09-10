const mongoose = require("mongoose");

const traderSchema = new mongoose.Schema(
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

// Format Trader object to populate category & subCategory cleanly
traderSchema.methods.toJSON = function () {
  const traderObj = this.toObject();

  if (traderObj.categoryId && typeof traderObj.categoryId === "object") {
    traderObj.category = {
      _id: traderObj.categoryId._id,
      name: traderObj.categoryId.name,
    };
    delete traderObj.categoryId;
  }

  if (traderObj.subCategoryId && typeof traderObj.subCategoryId === "object") {
    traderObj.subCategory = {
      _id: traderObj.subCategoryId._id,
      name: traderObj.subCategoryId.name,
    };
    delete traderObj.subCategoryId;
  }

  delete traderObj.__v;
  return traderObj;
};

const Trader = mongoose.model("Trader", traderSchema);

module.exports = Trader;
