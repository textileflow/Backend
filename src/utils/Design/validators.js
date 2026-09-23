const { body } = require("express-validator");

const createDesignValidator = [
  body("designName")
    .trim()
    .notEmpty()
    .withMessage("Design name is required"),

  body("designCode")
    .trim()
    .notEmpty()
    .withMessage("Design code is required"),

  body("stitch")
    .notEmpty()
    .withMessage("Stitch count is required")
    .isNumeric()
    .withMessage("Stitch must be a valid number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Stitch count cannot be negative"),

  body("area")
    .notEmpty()
    .withMessage("Design area is required")
    .isNumeric()
    .withMessage("Area must be a valid number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Area cannot be negative"),

  body("needle")
    .notEmpty()
    .withMessage("Needle count is required")
    .isNumeric()
    .withMessage("Needle must be a valid number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Needle count cannot be negative"),

  body("type")
    .trim()
    .notEmpty()
    .withMessage("Design type is required"),

  body("status")
    .optional()
    .trim()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

const updateDesignValidator = [
  body("designName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Design name cannot be empty"),

  body("designCode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Design code cannot be empty"),

  body("stitch")
    .optional()
    .isNumeric()
    .withMessage("Stitch must be a valid number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Stitch count cannot be negative"),

  body("area")
    .optional()
    .isNumeric()
    .withMessage("Area must be a valid number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Area cannot be negative"),

  body("needle")
    .optional()
    .isNumeric()
    .withMessage("Needle must be a valid number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Needle count cannot be negative"),

  body("type")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Design type cannot be empty"),

  body("status")
    .optional()
    .trim()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

const designStatusValidator = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

module.exports = {
  createDesignValidator,
  updateDesignValidator,
  designStatusValidator,
};
