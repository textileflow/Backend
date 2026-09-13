const { body } = require("express-validator");

const mobileRegex = /^[6-9]\d{9}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const vendorValidator = [
  body("companyName").custom((value, { req }) => {
    const name = value || req.body.vendorName;
    if (!name || !name.trim()) {
      throw new Error("Company Name is required");
    }
    return true;
  }),

  body("personName").custom((value, { req }) => {
    const person = value || req.body.contactPerson;
    if (!person || !person.trim()) {
      throw new Error("Person Name is required");
    }
    return true;
  }),

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
    .matches(mobileRegex)
    .withMessage(
      "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)",
    ),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address"),

  body("gstNumber")
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      const gst = value || req.body.gstNo;
      if (gst && !gstRegex.test(gst.trim().toUpperCase())) {
        throw new Error("Enter a valid GST number (e.g. 24ABCDE1234F1Z5)");
      }
      return true;
    }),

  body("panCard")
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      const pan = value || req.body.panNo;
      if (pan && !panRegex.test(pan.trim().toUpperCase())) {
        throw new Error("Enter a valid PAN number (e.g. ABCDE1234F)");
      }
      return true;
    }),

  body("paymentTerm").custom((value, { req }) => {
    const term =
      value !== undefined && value !== null ? value : req.body.paymentTerms;
    if (term === undefined || term === null || String(term).trim() === "") {
      throw new Error("Payment Term is required");
    }
    return true;
  }),

  body("address").optional().trim(),

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
  vendorValidator,
  statusValidator,
};
