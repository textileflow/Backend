const { body } = require("express-validator");

const createCostingValidator = [
  body("designId")
    .notEmpty()
    .withMessage("Design ID is required")
    .isNumeric()
    .withMessage("Design ID must be a valid number"),

  body("pricePer1000")
    .notEmpty()
    .withMessage("Price per 1000 stitches is required")
    .isNumeric()
    .withMessage("Price per 1000 stitches must be a number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Price per 1000 stitches cannot be negative"),

  body("meterConversionFactor")
    .optional()
    .isNumeric()
    .withMessage("Meter conversion factor must be a number")
    .custom((val) => Number(val) > 0)
    .withMessage("Meter conversion factor must be greater than 0"),

  body("headAdjustmentEnabled")
    .optional()
    .isBoolean()
    .withMessage("Head adjustment enabled must be a boolean"),

  body("headAdjustmentFactor")
    .optional()
    .isNumeric()
    .withMessage("Head adjustment factor must be a number")
    .custom((val) => Number(val) > 0)
    .withMessage("Head adjustment factor must be greater than 0"),

  body("status")
    .optional()
    .trim()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

const updateCostingValidator = [
  body("pricePer1000")
    .optional()
    .isNumeric()
    .withMessage("Price per 1000 stitches must be a number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Price per 1000 stitches cannot be negative"),

  body("meterConversionFactor")
    .optional()
    .isNumeric()
    .withMessage("Meter conversion factor must be a number")
    .custom((val) => Number(val) > 0)
    .withMessage("Meter conversion factor must be greater than 0"),

  body("headAdjustmentEnabled")
    .optional()
    .isBoolean()
    .withMessage("Head adjustment enabled must be a boolean"),

  body("headAdjustmentFactor")
    .optional()
    .isNumeric()
    .withMessage("Head adjustment factor must be a number")
    .custom((val) => Number(val) > 0)
    .withMessage("Head adjustment factor must be greater than 0"),

  body("status")
    .optional()
    .trim()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

const costingStatusValidator = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

module.exports = {
  createCostingValidator,
  updateCostingValidator,
  costingStatusValidator,
};
