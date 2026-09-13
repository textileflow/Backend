const { body } = require("express-validator");

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

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
    .withMessage(
      "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)",
    ),

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

  body("subCategoryId").custom((value, { req }) => {
    const target =
      value !== undefined && value !== null ? value : req.body.subCategoryIds;
    if (target === undefined || target === null || target === "") {
      throw new Error("Sub Category ID is required");
    }
    let items = [];
    if (Array.isArray(target)) {
      items = target;
    } else if (typeof target === "string" && target.includes(",")) {
      items = target.split(",");
    } else {
      items = [target];
    }
    const allValid = items.every((item) => !isNaN(Number(String(item).trim())));
    if (!allValid || items.length === 0) {
      throw new Error("Sub Category ID(s) must be numeric");
    }
    return true;
  }),

  body("address").optional().trim(),
  body("paymentTerm").optional().trim(),
  body("gstName").optional().trim(),

  // GST Number validation (e.g. 24ABCDE1234F1Z5)
  body("gstNumber")
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((val) =>
      typeof val === "string" ? val.toUpperCase() : val,
    )
    .matches(GST_REGEX)
    .withMessage("Invalid GST Number format (e.g. 24ABCDE1234F1Z5)"),

  // PAN Card validation (e.g. ABCDE1234F or ABCDE1234F)
  body("panCard")
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((val) =>
      typeof val === "string" ? val.toUpperCase() : val,
    )
    .matches(PAN_REGEX)
    .withMessage("Invalid PAN Card format (e.g. ABCDE1234F)"),

  body("note").optional().trim(),
];

const statusValidator = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either Active or Inactive"),
];

module.exports = {
  merchantValidator,
  statusValidator,
};
