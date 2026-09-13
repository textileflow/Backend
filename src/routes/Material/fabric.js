const express = require("express");
const router = express.Router();
const fabricController = require("../../controllers/Material/fabric");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin", "manager"), fabricController.create)
  .get(authorizeRoles("admin", "manager", "staff"), fabricController.getAll);

router.route("/:id").get(authorizeRoles("admin", "manager", "staff"), fabricController.getById);

module.exports = router;
