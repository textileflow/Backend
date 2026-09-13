const express = require("express");
const router = express.Router();
const unitController = require("../../controllers/Master/unit");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin", "manager"), unitController.create)
  .get(authorizeRoles("admin", "manager", "staff"), unitController.getAll);

module.exports = router;
