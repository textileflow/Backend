const express = require("express");
const router = express.Router();
const designCostingController = require("../../../controllers/Design/Costing/costing");
const { protect, authorizeRoles } = require("../../../middleware/Auth/auth");
const validate = require("../../../middleware/Common/validate");
const {
  createCostingValidator,
  updateCostingValidator,
  costingStatusValidator,
} = require("../../../utils/Design/Costing/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    createCostingValidator,
    validate,
    designCostingController.create
  )
  .get(
    authorizeRoles("admin", "manager", "staff"),
    designCostingController.getAll
  );

router
  .route("/design/:designId")
  .get(
    authorizeRoles("admin", "manager", "staff"),
    designCostingController.getByDesignId
  );

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    costingStatusValidator,
    validate,
    designCostingController.updateStatus
  )
  .put(
    authorizeRoles("admin", "manager"),
    costingStatusValidator,
    validate,
    designCostingController.updateStatus
  );

router
  .route("/:id")
  .get(
    authorizeRoles("admin", "manager", "staff"),
    designCostingController.getById
  )
  .put(
    authorizeRoles("admin", "manager"),
    updateCostingValidator,
    validate,
    designCostingController.update
  )
  .delete(authorizeRoles("admin", "manager"), designCostingController.remove);

module.exports = router;
