const express = require("express");
const router = express.Router();
const threadBrandController = require("../../controllers/Material/threadBrand");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin", "manager"), threadBrandController.create)
  .get(authorizeRoles("admin", "manager", "staff"), threadBrandController.getAll);

module.exports = router;
