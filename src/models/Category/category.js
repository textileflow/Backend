const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: Number,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
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

// Pre-save hook for auto-incrementing numeric categoryId (1, 2, 3...)
categorySchema.pre("save", async function () {
  if (this.isNew && (this.categoryId === undefined || this.categoryId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "categoryId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.categoryId = counter.seq;
  }
});

// Transform toJSON: exposes id as number (1, 2, 3...), hides _id, categoryId, __v, createdAt, updatedAt
categorySchema.methods.toJSON = function () {
  const catObj = this.toObject();
  catObj.id = catObj.categoryId;
  delete catObj._id;
  delete catObj.categoryId;
  delete catObj.__v;
  delete catObj.createdAt;
  delete catObj.updatedAt;
  return catObj;
};

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
