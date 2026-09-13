const express = require("express");
const router = express.Router();
const vendorTypeController = require("../../../../controllers/Purchase/Vendor/Vendor-type/vendor-type");
const { protect, authorizeRoles } = require("../../../../middleware/Auth/auth");
const validate = require("../../../../middleware/Common/validate");
const {
  vendorTypeValidator,
  vendorTypeUpdateValidator,
  statusValidator,
} = require("../../../../utils/Purchase/Vendor/Vendor-type/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    vendorTypeValidator,
    validate,
    vendorTypeController.create
  )
  .get(
    authorizeRoles("admin", "manager", "staff"),
    vendorTypeController.getAll
  );

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    vendorTypeController.updateStatus
  )
  .put(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    vendorTypeController.updateStatus
  );

router
  .route("/:id")
  .get(
    authorizeRoles("admin", "manager", "staff"),
    vendorTypeController.getById
  )
  .put(
    authorizeRoles("admin", "manager"),
    vendorTypeUpdateValidator,
    validate,
    vendorTypeController.update
  )
  .delete(authorizeRoles("admin"), vendorTypeController.remove);

module.exports = router;
