const express = require("express");
const router = express.Router();
const authController = require("../../controllers/Auth/auth");
const { protect } = require("../../middleware/Auth/auth");
const validate = require("../../middleware/Common/validate");
const {
  registerValidator,
  loginValidator,
} = require("../../utils/Auth/validators");

// Public auth routes
router.post("/register", registerValidator, validate, authController.register);
router.post("/login", loginValidator, validate, authController.login);

// Protected auth routes (Requires Bearer token in Authorization header)
router.get("/profile", protect, authController.profile);
router.get("/profile/:id", protect, authController.profile);
router.get("/me", protect, authController.profile);
router.post("/logout", protect, authController.logout);

module.exports = router;