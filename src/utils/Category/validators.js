const { body } = require("express-validator");

const categoryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),

  body("note").optional().trim(),
];

module.exports = {
  categoryValidator,
};
