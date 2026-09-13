const express = require("express");
const router = express.Router();
const machineController = require("../../controllers/Machine/machine");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");
const validate = require("../../middleware/Common/validate");
const { machineValidator } = require("../../utils/Machine/validators");

router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    machineValidator,
    validate,
    machineController.create
  )
  .get(authorizeRoles("admin", "manager", "staff"), machineController.getAll);

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), machineController.getById)
  .put(authorizeRoles("admin", "manager"), machineController.update)
  .delete(authorizeRoles("admin"), machineController.remove);

module.exports = router;
