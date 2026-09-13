const { body } = require("express-validator");

const materialValidator = [
  body("materialName")
    .trim()
    .notEmpty()
    .withMessage("Material name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Material name must be between 2 and 150 characters"),

  body("materialType")
    .notEmpty()
    .withMessage("Material type is required")
    .isIn(["Thread", "Fabric", "Backing", "Film", "Needle", "Other"])
    .withMessage("Material type must be one of: Thread, Fabric, Backing, Film, Needle, Other"),

  body("materialCode")
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase(),

  body("rate").optional().isNumeric().withMessage("Rate must be a number"),
  body("gsm").optional().isNumeric().withMessage("GSM must be a number"),
  body("widthInch").optional().isNumeric().withMessage("Width must be a number"),

  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be Active or Inactive"),
];

module.exports = {
  materialValidator,
};
