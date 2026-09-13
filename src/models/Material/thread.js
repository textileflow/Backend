const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const threadSchema = new mongoose.Schema(
  {
    threadId: {
      type: Number,
      unique: true,
    },
    threadCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    threadName: {
      type: String,
      required: [true, "Thread name is required"],
      trim: true,
    },
    threadType: {
      type: String,
      required: [true, "Thread type is required"],
      trim: true, // Rayon, Polyester, Metallic, Cotton
    },
    brand: {
      type: String,
      trim: true,
      default: "Madera",
    },
    colorName: {
      type: String,
      trim: true,
      default: "", // Golden, Black, Red
    },
    colorCode: {
      type: String,
      trim: true,
      default: "", // GD-001 or #FFD700
    },
    threadSize: {
      type: String,
      trim: true,
      default: "120D", // 120D, 40wt
    },
    unitId: {
      type: Number,
      default: null, // Foreign Key link to Unit Master
    },
    rate: {
      type: Number,
      default: 0, // Price per unit (e.g. 0.85 per Meter)
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

// Pre-save hook for auto-incrementing numeric threadId (1, 2, 3...) & auto-generated threadCode (TH-0001)
threadSchema.pre("save", async function () {
  if (this.isNew && (this.threadId === undefined || this.threadId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "threadId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.threadId = counter.seq;
  }

  if (!this.threadCode) {
    this.threadCode = `TH-${String(this.threadId).padStart(4, "0")}`;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...)
threadSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.threadId;
  delete obj._id;
  delete obj.threadId;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const Thread = mongoose.models.Thread || mongoose.model("Thread", threadSchema);

module.exports = Thread;
