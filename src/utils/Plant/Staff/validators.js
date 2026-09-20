const { body } = require("express-validator");

const staffValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Staff name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Staff name must be between 2 and 100 characters"),

  body("type")
    .trim()
    .notEmpty()
    .withMessage("Staff type is required")
    .isIn(["Worker", "Designer", "Operator", "Master", "Supervisor", "Helper"])
    .withMessage(
      "Staff type must be one of: Worker, Designer, Operator, Master, Supervisor, Helper"
    ),

  body("mobile").optional().trim(),
  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("shift")
    .optional()
    .isIn(["Day", "Night", "General"])
    .withMessage("Shift must be Day, Night, or General"),

  body("salaryType")
    .optional()
    .isIn(["Fixed", "Per-Stitch", "Hourly", "Piece-Rate"])
    .withMessage("Invalid salary type"),

  body("salaryAmount")
    .optional()
    .isNumeric()
    .withMessage("Salary amount must be a number"),

  body("joiningDate").optional().isISO8601().withMessage("Invalid joining date"),
  body("note").optional().trim(),
];

const staffStatusValidator = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

module.exports = {
  staffValidator,
  staffStatusValidator,
};
