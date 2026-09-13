const express = require("express");
const router = express.Router();
const merchantController = require("../../controllers/Merchant/merchant");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");
const validate = require("../../middleware/Common/validate");
const {
  merchantValidator,
  statusValidator,
} = require("../../utils/Merchant/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    merchantValidator,
    validate,
    merchantController.create
  )
  .get(authorizeRoles("admin", "manager", "staff"), merchantController.getAll);

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    merchantController.updateStatus
  )
  .put(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    merchantController.updateStatus
  );

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), merchantController.getById)
  .put(authorizeRoles("admin", "manager"), merchantController.update)
  .delete(authorizeRoles("admin", "manager"), merchantController.remove);

module.exports = router;
