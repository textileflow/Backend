const { body } = require("express-validator");

const plantMachineValidator = [
  body("machineName")
    .trim()
    .notEmpty()
    .withMessage("Machine name is required"),

  body("ownership")
    .optional()
    .isIn(["In-house", "Subcontractor"])
    .withMessage("Ownership must be In-house or Subcontractor"),

  body("subContractorId")
    .optional()
    .isNumeric()
    .withMessage("SubContractor ID must be a number"),

  body("headCount")
    .notEmpty()
    .withMessage("Head count is required")
    .isInt({ min: 1 })
    .withMessage("Head count must be at least 1"),

  body("needleCount")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Needle count must be at least 1"),

  body("maxRpm")
    .optional()
    .isNumeric()
    .withMessage("Max RPM must be a number"),

  body("brand").optional().trim(),
  body("model").optional().trim(),
  body("note").optional().trim(),
];

const machineStatusValidator = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Active", "Maintenance", "Inactive"])
    .withMessage("Status must be Active, Maintenance, or Inactive"),
];

module.exports = {
  plantMachineValidator,
  machineStatusValidator,
};
