const mongoose = require("mongoose");
const Counter = require("../Common/counter");

const threadCatalogSchema = new mongoose.Schema(
  {
    catalogId: {
      type: Number,
      unique: true,
    },
    catalogCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    catalogName: {
      type: String,
      required: [true, "Catalog name is required"],
      trim: true,
    },
    brandId: {
      type: Number,
      default: null, // Foreign Key link to ThreadBrand Master
      index: true,
    },
    threadType: {
      type: String,
      trim: true,
      default: "Rayon", // Rayon, Polyester, Metallic, Cotton, Nylon, Viscose
    },
    threadSize: {
      type: String,
      trim: true,
      default: "120D",
    },
    unitId: {
      type: Number,
      default: null, // Foreign Key link to Unit Master (e.g. Cone)
    },
    catalogImageOrPdf: {
      type: String,
      trim: true,
      default: "", // Shade Card Image or PDF file URL
    },
    description: {
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

threadCatalogSchema.pre("save", async function () {
  if (this.isNew && (this.catalogId === undefined || this.catalogId === null)) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "threadCatalogId" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    this.catalogId = counter.seq;
  }

  if (!this.catalogCode) {
    this.catalogCode = `CAT-${String(this.catalogId).padStart(4, "0")}`;
  }
});

threadCatalogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.catalogId;
  delete obj._id;
  delete obj.catalogId;
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  return obj;
};

const ThreadCatalog =
  mongoose.models.ThreadCatalog || mongoose.model("ThreadCatalog", threadCatalogSchema);

module.exports = ThreadCatalog;
