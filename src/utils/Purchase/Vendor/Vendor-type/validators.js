const { body } = require("express-validator");

const vendorTypeValidator = [
  body("name")
    .notEmpty()
    .withMessage("Vendor type name is required")
    .isString()
    .withMessage("Vendor type name must be a string")
    .trim(),
  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .trim(),
];

const vendorTypeUpdateValidator = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Vendor type name cannot be empty")
    .isString()
    .withMessage("Vendor type name must be a string")
    .trim(),
  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .trim(),
  body("status")
    .optional()
    .trim()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

const statusValidator = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

module.exports = {
  vendorTypeValidator,
  vendorTypeUpdateValidator,
  statusValidator,
};
