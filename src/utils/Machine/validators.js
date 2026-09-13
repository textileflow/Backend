const { body } = require("express-validator");

const machineValidator = [
  body("machineName")
    .trim()
    .notEmpty()
    .withMessage("Machine name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Machine name must be between 2 and 150 characters"),

  body("machineType")
    .optional()
    .trim(),

  body("machineTypeId")
    .optional()
    .isNumeric(),

  body("machineCode")
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase(),

  body("headCount").optional().isNumeric(),
  body("noOfHeads").optional().isNumeric(),
  body("needleCount").optional().isNumeric(),
  body("maxRpm").optional().isNumeric(),
  body("headSpacing").optional().isNumeric(),
  body("headSpacingMm").optional().isNumeric(),

  body("status")
    .optional()
    .isIn(["Active", "Maintenance", "Inactive"])
    .withMessage("Status must be Active, Maintenance, or Inactive"),
];

module.exports = {
  machineValidator,
};
