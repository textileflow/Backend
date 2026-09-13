const mongoose = require("mongoose");
const Counter = require("../../Common/counter");

const softDeletePlugin = require("../../../plugins/softDelete");

const vendorSchema = new mongoose.Schema(
  {
    vendorId: {
      type: Number,
      unique: true,
    },
    vendorCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    companyName: {
      type: String,
      required: [true, "Company Name is required"],
      trim: true,
    },
    personName: {
      type: String,
      required: [true, "Person Name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    gstCertificate: {
      type: String,
      trim: true,
      default: "",
    },
    panCard: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    panCardImage: {
      type: String,
      trim: true,
      default: "",
    },
    paymentTerm: {
      type: String,
      required: [true, "Payment Term is required"],
      default: "30 Days",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
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

vendorSchema.plugin(softDeletePlugin);

// Pre-save hook for auto-incrementing numeric vendorId (1, 2, 3...) & auto-generated vendorCode (VEN-0001)
vendorSchema.pre("save", async function () {
  if (this.isNew && (this.vendorId === undefined || this.vendorId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "vendorId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.vendorId = counter.seq;
  }

  if (!this.vendorCode) {
    this.vendorCode = `VEN-${String(this.vendorId).padStart(4, "0")}`;
  }
});

// Transform toJSON: exposes clean standardized object
vendorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.vendorId;
  delete obj._id;
  delete obj.vendorId;
  delete obj.__v;
  delete obj.vendorName;
  delete obj.contactPerson;
  delete obj.gstNo;
  delete obj.panNo;
  delete obj.paymentDays;
  delete obj.paymentTerms;
  delete obj.isDeleted;
  delete obj.deletedAt;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

module.exports = Vendor;
