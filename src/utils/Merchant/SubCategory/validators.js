const { body } = require("express-validator");

const subCategoryValidator = [
  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .isNumeric()
    .withMessage("Category ID must be a numeric value"),
  body("name")
    .notEmpty()
    .withMessage("Sub-category name is required")
    .isString()
    .withMessage("Sub-category name must be a string")
    .trim(),
  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .trim(),
];

const subCategoryUpdateValidator = [
  body("categoryId")
    .optional()
    .isNumeric()
    .withMessage("Category ID must be a numeric value"),
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Sub-category name cannot be empty")
    .isString()
    .withMessage("Sub-category name must be a string")
    .trim(),
  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .trim(),
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
  subCategoryValidator,
  subCategoryUpdateValidator,
  statusValidator,
};
