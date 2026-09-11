const { body } = require("express-validator");

const merchantValidator = [
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Company name must be between 2 and 150 characters"),

  body("personName")
    .trim()
    .notEmpty()
    .withMessage("Person name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Person name must be between 2 and 100 characters"),

  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .isString()
    .withMessage("Mobile number must be a string"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("categoryId")
    .notEmpty()
    .withMessage("Category ID is required")
    .isNumeric()
    .withMessage("Category ID must be a number"),

  body("subCategoryId")
    .notEmpty()
    .withMessage("Sub Category ID is required")
    .isNumeric()
    .withMessage("Sub Category ID must be a number"),

  body("address").optional().trim(),
  body("paymentTerm").optional().trim(),
  body("gstName").optional().trim(),
  body("panCard").optional().trim(),
  body("note").optional().trim(),
];

module.exports = {
  merchantValidator,
};
