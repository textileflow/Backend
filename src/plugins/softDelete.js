/**
 * Reusable Soft Delete Plugin for Mongoose Schemas across TextileFlow ERP.
 * 
 * Features:
 * - Adds `isDeleted` (Boolean) and `deletedAt` (Date) to schema with `select: false` so they are never returned in queries or API JSON responses.
 * - Automatically excludes deleted records in `find`, `findOne`, `findOneAndUpdate`, and `countDocuments`.
 * - Provides instance method `doc.softDelete()` to mark records as soft deleted without removing from DB.
 */
const softDeletePlugin = (schema) => {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  });

  const excludeDeletedMiddleware = function () {
    if (this.getOptions().includeDeleted !== true) {
      this.where({ isDeleted: { $ne: true } });
    }
  };

  schema.pre("find", excludeDeletedMiddleware);
  schema.pre("findOne", excludeDeletedMiddleware);
  schema.pre("findOneAndUpdate", excludeDeletedMiddleware);
  schema.pre("countDocuments", excludeDeletedMiddleware);

  schema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (this.schema.path("status")) {
      this.status = "Inactive";
    }
    return await this.save();
  };
};

module.exports = softDeletePlugin;
