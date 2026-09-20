const { body } = require("express-validator");

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const subContractorValidator = [
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Company name must be between 2 and 150 characters"),

  body("personName")
    .trim()
    .notEmpty()
    .withMessage("Contact person name is required"),

  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .customSanitizer((val) => {
      if (typeof val !== "string" && typeof val !== "number") return val;
      let str = String(val)
        .trim()
        .replace(/[\s\-()]/g, "");
      if (str.startsWith("+91")) {
        str = str.slice(3);
      } else if (str.startsWith("91") && str.length === 12) {
        str = str.slice(2);
      } else if (str.startsWith("0") && str.length === 11) {
        str = str.slice(1);
      }
      return str;
    })
    .matches(MOBILE_REGEX)
    .withMessage("Enter a valid 10-digit Indian mobile number"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("gstNumber")
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((val) => (typeof val === "string" ? val.toUpperCase() : val))
    .matches(GST_REGEX)
    .withMessage("Invalid GST Number format"),

  body("panCard")
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((val) => (typeof val === "string" ? val.toUpperCase() : val))
    .matches(PAN_REGEX)
    .withMessage("Invalid PAN Card format"),

  body("ratePerStitch")
    .optional()
    .isNumeric()
    .withMessage("Rate per stitch must be a number"),

  body("plantId")
    .optional()
    .isNumeric()
    .withMessage("Plant ID must be numeric"),

  body("note").optional().trim(),
];

const subContractorStatusValidator = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

module.exports = {
  subContractorValidator,
  subContractorStatusValidator,
};
