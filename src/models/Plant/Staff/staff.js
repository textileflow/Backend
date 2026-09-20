const mongoose = require("mongoose");
const Counter = require("../../Common/counter");
const softDeletePlugin = require("../../../plugins/softDelete");

const staffSchema = new mongoose.Schema(
  {
    staffId: {
      type: Number,
      unique: true,
    },
    staffCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
    },
    plantId: {
      type: Number,
      default: null,
      index: true,
    },
    type: {
      type: String,
      required: [true, "Staff type is required"],
      enum: ["Worker", "Designer", "Operator", "Master", "Supervisor", "Helper"],
      default: "Worker",
    },
    mobile: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    shift: {
      type: String,
      enum: ["Day", "Night", "General"],
      default: "General",
    },
    salaryType: {
      type: String,
      enum: ["Fixed", "Per-Stitch", "Hourly", "Piece-Rate"],
      default: "Fixed",
    },
    salaryAmount: {
      type: Number,
      default: 0,
    },
    joiningDate: {
      type: Date,
      default: null,
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

staffSchema.plugin(softDeletePlugin);

staffSchema.pre("save", async function () {
  if (this.isNew && (this.staffId === undefined || this.staffId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "staffId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.staffId = counter.seq;
  }

  if (!this.staffCode) {
    this.staffCode = `STF-${String(this.staffId).padStart(4, "0")}`;
  }
});

staffSchema.methods.toJSON = function () {
  const staffObj = this.toObject();
  staffObj.id = staffObj.staffId;
  delete staffObj._id;
  delete staffObj.staffId;
  delete staffObj.__v;
  delete staffObj.isDeleted;
  delete staffObj.deletedAt;
  delete staffObj.createdAt;
  delete staffObj.updatedAt;
  return staffObj;
};

const Staff = mongoose.models.Staff || mongoose.model("Staff", staffSchema);

module.exports = Staff;
