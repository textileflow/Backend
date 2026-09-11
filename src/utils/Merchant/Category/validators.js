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

module.exports = {
  categoryValidator,
  categoryUpdateValidator,
};
