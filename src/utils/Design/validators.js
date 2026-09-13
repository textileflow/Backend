const { body } = require("express-validator");

const designValidator = [
  body("designName")
    .trim()
    .notEmpty()
    .withMessage("Design name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Design name must be between 2 and 150 characters"),

  body("merchantId")
    .notEmpty()
    .withMessage("Merchant ID (Customer / Party Name) is required")
    .isNumeric()
    .withMessage("Merchant ID must be a number"),

  body("stitchCount")
    .notEmpty()
    .withMessage("Stitch count is required")
    .isNumeric()
    .withMessage("Stitch count must be a number")
    .custom((value) => {
      if (Number(value) <= 0) {
        throw new Error("Stitch count must be greater than 0");
      }
      return true;
    }),

  body("designCode")
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase(),

  body("category").optional().trim(),
  body("designType").optional().trim(),

  body("status")
    .optional()
    .isIn([
      "Draft",
      "Digitizing",
      "Digitized",
      "Sampling",
      "Approval Pending",
      "Approved",
      "Rejected",
      "Revision",
      "Hold",
    ])
    .withMessage("Status must be a valid Design workflow status"),

  body("width").optional().isNumeric().withMessage("Width must be a number"),
  body("height").optional().isNumeric().withMessage("Height must be a number"),
  body("repeatX").optional().isNumeric().withMessage("Repeat X must be a number"),
  body("repeatY").optional().isNumeric().withMessage("Repeat Y must be a number"),
  body("headSpacing").optional().isNumeric().withMessage("Head spacing must be a number"),
  body("machineRpm").optional().isNumeric().withMessage("Machine RPM must be a number"),
  body("efficiencyPercent").optional().isNumeric().withMessage("Efficiency percent must be a number"),
  body("pieceRatePer1kStitches").optional().isNumeric().withMessage("Piece rate must be a number"),

  body("note").optional().trim(),
];

const designVersionValidator = [
  body("stitchCount")
    .notEmpty()
    .withMessage("Stitch count is required")
    .isNumeric()
    .withMessage("Stitch count must be a number")
    .custom((value) => {
      if (Number(value) <= 0) {
        throw new Error("Stitch count must be greater than 0");
      }
      return true;
    }),

  body("changeSummary")
    .optional()
    .trim(),

  body("width").optional().isNumeric(),
  body("height").optional().isNumeric(),
  body("machineRpm").optional().isNumeric(),
  body("efficiencyPercent").optional().isNumeric(),
];

module.exports = {
  designValidator,
  designVersionValidator,
};
