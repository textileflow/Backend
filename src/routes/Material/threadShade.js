const express = require("express");
const router = express.Router();
const threadShadeController = require("../../controllers/Material/threadShade");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin", "manager"), threadShadeController.create)
  .get(authorizeRoles("admin", "manager", "staff"), threadShadeController.getAll);

router.post("/bulk", authorizeRoles("admin", "manager"), threadShadeController.bulkCreate);

router.route("/:id").get(authorizeRoles("admin", "manager", "staff"), threadShadeController.getById);

module.exports = router;
