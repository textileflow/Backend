const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const unitSchema = new mongoose.Schema(
  {
    unitId: {
      type: Number,
      unique: true,
    },
    unitCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    unitName: {
      type: String,
      required: [true, "Unit name is required"],
      trim: true,
    },
    symbol: {
      type: String,
      trim: true,
      default: "", // m, cone, kg, pcs, in, sqM
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

// Pre-save hook for auto-incrementing numeric unitId (1, 2, 3...) & auto-generated unitCode (UNT-001)
unitSchema.pre("save", async function () {
  if (this.isNew && (this.unitId === undefined || this.unitId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "unitId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.unitId = counter.seq;
  }

  if (!this.unitCode) {
    this.unitCode = `UNT-${String(this.unitId).padStart(3, "0")}`;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...)
unitSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.unitId;
  delete obj._id;
  delete obj.unitId;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const Unit = mongoose.models.Unit || mongoose.model("Unit", unitSchema);

module.exports = Unit;
