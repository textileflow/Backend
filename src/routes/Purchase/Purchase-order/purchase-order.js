const express = require("express");
const router = express.Router();
const purchaseOrderController = require("../../../controllers/Purchase/Purchase-order/purchase-order");
const { protect, authorizeRoles } = require("../../../middleware/Auth/auth");
const {
  purchaseOrderValidator,
  purchaseOrderUpdateValidator,
  statusValidator,
} = require("../../../utils/Purchase/Purchase-order/validators");
const validate = require("../../../middleware/Common/validate");

router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    purchaseOrderValidator,
    validate,
    purchaseOrderController.create
  )
  .get(authorizeRoles("admin", "manager", "staff"), purchaseOrderController.getAll);

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    purchaseOrderController.updateStatus
  )
  .put(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    purchaseOrderController.updateStatus
  );

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), purchaseOrderController.getById)
  .put(
    authorizeRoles("admin", "manager"),
    purchaseOrderUpdateValidator,
    validate,
    purchaseOrderController.update
  )
  .delete(authorizeRoles("admin"), purchaseOrderController.remove);

module.exports = router;
