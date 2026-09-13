const express = require("express");
const router = express.Router();
const threadController = require("../../controllers/Material/thread");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin", "manager"), threadController.create)
  .get(authorizeRoles("admin", "manager", "staff"), threadController.getAll);

router.route("/:id").get(authorizeRoles("admin", "manager", "staff"), threadController.getById);

module.exports = router;
