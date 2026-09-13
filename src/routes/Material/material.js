const express = require("express");
const router = express.Router();
const materialController = require("../../controllers/Material/material");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");
const validate = require("../../middleware/Common/validate");
const { materialValidator } = require("../../utils/Material/validators");

router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    materialValidator,
    validate,
    materialController.create
  )
  .get(authorizeRoles("admin", "manager", "staff"), materialController.getAll);

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), materialController.getById)
  .put(authorizeRoles("admin", "manager"), materialController.update)
  .delete(authorizeRoles("admin"), materialController.remove);

module.exports = router;
