const { body } = require("express-validator");

const categoryValidator = [
  body("name")
    .notEmpty()
    .withMessage("Category name is required")
    .isString()
    .withMessage("Category name must be a string")
    .trim(),
  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .trim(),
];

const categoryUpdateValidator = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .isString()
    .withMessage("Category name must be a string")
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
  categoryValidator,
  categoryUpdateValidator,
  statusValidator,
};
