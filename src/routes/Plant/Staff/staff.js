const express = require("express");
const router = express.Router();
const staffController = require("../../../controllers/Plant/Staff/staff");
const { protect, authorizeRoles } = require("../../../middleware/Auth/auth");
const validate = require("../../../middleware/Common/validate");
const {
  staffValidator,
  staffStatusValidator,
} = require("../../../utils/Plant/Staff/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    staffValidator,
    validate,
    staffController.create
  )
  .get(authorizeRoles("admin", "manager", "staff"), staffController.getAll);

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    staffStatusValidator,
    validate,
    staffController.updateStatus
  )
  .put(
    authorizeRoles("admin", "manager"),
    staffStatusValidator,
    validate,
    staffController.updateStatus
  );

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), staffController.getById)
  .put(authorizeRoles("admin", "manager"), staffController.update)
  .delete(authorizeRoles("admin"), staffController.remove);

module.exports = router;
