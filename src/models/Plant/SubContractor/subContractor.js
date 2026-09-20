const mongoose = require("mongoose");
const Counter = require("../../Common/counter");
const softDeletePlugin = require("../../../plugins/softDelete");

const subContractorSchema = new mongoose.Schema(
  {
    subContractorId: {
      type: Number,
      unique: true,
    },
    subContractorCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    personName: {
      type: String,
      required: [true, "Contact person name is required"],
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
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    panCard: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    ratePerStitch: {
      type: Number,
      default: 0,
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: "",
    },
    plantId: {
      type: Number,
      default: null, // Associated primary plant if applicable
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
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

subContractorSchema.plugin(softDeletePlugin);

subContractorSchema.pre("save", async function () {
  if (
    this.isNew &&
    (this.subContractorId === undefined || this.subContractorId === null)
  ) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "subContractorId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.subContractorId = counter.seq;
  }

  if (!this.subContractorCode) {
    this.subContractorCode = `SUBC-${String(this.subContractorId).padStart(
      4,
      "0"
    )}`;
  }
});

subContractorSchema.methods.toJSON = function () {
  const subObj = this.toObject();
  subObj.id = subObj.subContractorId;
  delete subObj._id;
  delete subObj.subContractorId;
  delete subObj.__v;
  delete subObj.isDeleted;
  delete subObj.deletedAt;
  delete subObj.createdAt;
  delete subObj.updatedAt;
  return subObj;
};

const SubContractor =
  mongoose.models.SubContractor ||
  mongoose.model("SubContractor", subContractorSchema);

module.exports = SubContractor;
