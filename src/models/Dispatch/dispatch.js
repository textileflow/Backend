const mongoose = require("mongoose");

const dispatchSchema = new mongoose.Schema(
  {
    gatePassNo: {
      type: String,
      required: [true, "Gate Pass number is required"],
      unique: true,
      trim: true,
    },
    merchantName: {
      type: String,
      required: [true, "Merchant / Customer name is required"],
      trim: true,
    },
    destinationCity: {
      type: String,
      required: [true, "Destination city is required"],
      trim: true,
    },
    transporterName: {
      type: String,
      required: [true, "Transporter / Courier name is required"],
      trim: true,
    },
    lrNumber: {
      type: String,
      required: [true, "Lorry Receipt (LR) number is required"],
      trim: true,
    },
    driverPhone: {
      type: String,
      default: "",
    },
    cartonCount: {
      type: Number,
      default: 1,
    },
    grossWeight: {
      type: Number,
      default: 0,
    },
    ewayBillNo: {
      type: String,
      default: "",
    },
    dispatchDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Pending", "Packed", "Dispatched", "Delivered"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Dispatch", dispatchSchema);
