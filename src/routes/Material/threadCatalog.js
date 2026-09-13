const express = require("express");
const router = express.Router();
const threadCatalogController = require("../../controllers/Material/threadCatalog");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(authorizeRoles("admin", "manager"), threadCatalogController.create)
  .get(authorizeRoles("admin", "manager", "staff"), threadCatalogController.getAll);

router.route("/:id").get(authorizeRoles("admin", "manager", "staff"), threadCatalogController.getById);

module.exports = router;
