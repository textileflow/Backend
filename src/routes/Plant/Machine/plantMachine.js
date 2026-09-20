const express = require("express");
const router = express.Router();
const plantMachineController = require("../../../controllers/Plant/Machine/plantMachine");
const { protect, authorizeRoles } = require("../../../middleware/Auth/auth");
const validate = require("../../../middleware/Common/validate");
const {
  plantMachineValidator,
  machineStatusValidator,
} = require("../../../utils/Plant/Machine/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    plantMachineValidator,
    validate,
    plantMachineController.create
  )
  .get(
    authorizeRoles("admin", "manager", "staff"),
    plantMachineController.getAll
  );

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    machineStatusValidator,
    validate,
    plantMachineController.updateStatus
  )
  .put(
    authorizeRoles("admin", "manager"),
    machineStatusValidator,
    validate,
    plantMachineController.updateStatus
  );

router
  .route("/:id")
  .get(
    authorizeRoles("admin", "manager", "staff"),
    plantMachineController.getById
  )
  .put(authorizeRoles("admin", "manager"), plantMachineController.update)
  .delete(authorizeRoles("admin"), plantMachineController.remove);

module.exports = router;
