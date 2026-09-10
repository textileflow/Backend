const { body } = require("express-validator");

const subCategoryValidator = [
  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .isMongoId()
    .withMessage("Invalid Category ID format"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Sub Category name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Sub Category name must be between 2 and 100 characters"),

  body("note").optional().trim(),
];

module.exports = {
  subCategoryValidator,
};
