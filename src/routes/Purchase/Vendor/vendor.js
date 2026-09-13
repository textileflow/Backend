const express = require("express");
const router = express.Router();
const vendorController = require("../../../controllers/Purchase/Vendor/vendor");
const { protect, authorizeRoles } = require("../../../middleware/Auth/auth");
const { uploadVendorFields } = require("../../../middleware/Common/upload");
const {
  vendorValidator,
  statusValidator,
} = require("../../../utils/Purchase/Vendor/validators");
const validate = require("../../../middleware/Common/validate");

router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    uploadVendorFields,
    vendorValidator,
    validate,
    vendorController.create,
  )
  .get(authorizeRoles("admin", "manager", "staff"), vendorController.getAll);

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    vendorController.updateStatus,
  )
  .put(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    vendorController.updateStatus,
  );

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), vendorController.getById)
  .put(
    authorizeRoles("admin", "manager"),
    uploadVendorFields,
    vendorValidator,
    validate,
    vendorController.update,
  )
  .delete(authorizeRoles("admin"), vendorController.remove);

module.exports = router;
