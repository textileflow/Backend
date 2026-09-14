const { body } = require("express-validator");

const statusOptions = [
  "Draft",
  "Pending",
  "Approved",
  "Partially Received",
  "Completed",
  "Cancelled",
];

const purchaseOrderValidator = [
  body("vendorId").custom((value, { req }) => {
    const vId = value !== undefined ? value : req.body.vendor;
    if (vId === undefined || vId === null || String(vId).trim() === "") {
      throw new Error("Vendor ID is required");
    }
    if (isNaN(Number(vId))) {
      throw new Error("Vendor ID must be a number");
    }
    return true;
  }),

  body("items")
    .isArray({ min: 1 })
    .withMessage("Items must be a non-empty array"),

  body("items.*.name").custom((val, { req, path }) => {
    const itemIndex = path.split("[")[1].split("]")[0];
    const item = req.body.items[itemIndex];
    const name = val || (item && item.itemName);
    if (!name || !String(name).trim()) {
      throw new Error("Item name is required for all items");
    }
    return true;
  }),

  body("items.*.qty").custom((val, { req, path }) => {
    const itemIndex = path.split("[")[1].split("]")[0];
    const item = req.body.items[itemIndex];
    const qty = val !== undefined ? val : (item && item.quantity);
    if (qty === undefined || qty === null || isNaN(Number(qty)) || Number(qty) <= 0) {
      throw new Error("Item quantity must be a positive number");
    }
    return true;
  }),

  body("items.*.rate").custom((val, { req, path }) => {
    const itemIndex = path.split("[")[1].split("]")[0];
    const item = req.body.items[itemIndex];
    const rate = val !== undefined ? val : (item && item.price);
    if (rate === undefined || rate === null || isNaN(Number(rate)) || Number(rate) < 0) {
      throw new Error("Item rate must be a non-negative number");
    }
    return true;
  }),

  body("discountType")
    .optional()
    .custom((val) => {
      const allowed = ["Percentage", "Fixed", "percentage", "fixed"];
      if (!allowed.includes(val)) {
        throw new Error("Discount Type must be either Percentage or Fixed");
      }
      return true;
    }),

  body("discountValue")
    .optional()
    .isNumeric()
    .withMessage("Discount Value must be a number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Discount Value cannot be negative"),

  body("gstRate")
    .optional()
    .isNumeric()
    .withMessage("GST Rate must be a number")
    .custom((val) => Number(val) >= 0)
    .withMessage("GST Rate cannot be negative"),

  body("shippingCharge")
    .optional()
    .isNumeric()
    .withMessage("Shipping Charge must be a number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Shipping Charge cannot be negative"),

  body("status")
    .optional()
    .isIn(statusOptions)
    .withMessage(`Status must be one of: ${statusOptions.join(", ")}`),

  body("notes").optional().trim(),
  body("termsAndConditions").optional().trim(),
];

const purchaseOrderUpdateValidator = [
  body("vendorId")
    .optional()
    .custom((value, { req }) => {
      const vId = value !== undefined ? value : req.body.vendor;
      if (vId !== undefined && (isNaN(Number(vId)) || Number(vId) <= 0)) {
        throw new Error("Vendor ID must be a valid positive number");
      }
      return true;
    }),

  body("items")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Items must be a non-empty array if provided"),

  body("discountType")
    .optional()
    .custom((val) => {
      const allowed = ["Percentage", "Fixed", "percentage", "fixed"];
      if (!allowed.includes(val)) {
        throw new Error("Discount Type must be either Percentage or Fixed");
      }
      return true;
    }),

  body("discountValue")
    .optional()
    .isNumeric()
    .withMessage("Discount Value must be a number"),

  body("gstRate")
    .optional()
    .isNumeric()
    .withMessage("GST Rate must be a number"),

  body("shippingCharge")
    .optional()
    .isNumeric()
    .withMessage("Shipping Charge must be a number"),

  body("status")
    .optional()
    .isIn(statusOptions)
    .withMessage(`Status must be one of: ${statusOptions.join(", ")}`),
];

const statusValidator = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(statusOptions)
    .withMessage(`Status must be one of: ${statusOptions.join(", ")}`),
];

module.exports = {
  purchaseOrderValidator,
  purchaseOrderUpdateValidator,
  statusValidator,
};
