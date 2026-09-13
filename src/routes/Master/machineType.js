const express = require("express");
const router = express.Router();
const machineTypeController = require("../../controllers/Master/machineType");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin", "manager"), machineTypeController.create)
  .get(authorizeRoles("admin", "manager", "staff"), machineTypeController.getAll);

module.exports = router;
