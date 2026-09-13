const express = require("express");
const router = express.Router();
const categoryController = require("../../../controllers/Merchant/Category/category");
const { protect, authorizeRoles } = require("../../../middleware/Auth/auth");
const validate = require("../../../middleware/Common/validate");
const {
  categoryValidator,
  categoryUpdateValidator,
  statusValidator,
} = require("../../../utils/Merchant/Category/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    categoryValidator,
    validate,
    categoryController.create
  )
  .get(
    authorizeRoles("admin", "manager", "staff"),
    categoryController.getAll
  );

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    categoryController.updateStatus
  )
  .put(
    authorizeRoles("admin", "manager"),
    statusValidator,
    validate,
    categoryController.updateStatus
  );

router
  .route("/:id")
  .get(
    authorizeRoles("admin", "manager", "staff"),
    categoryController.getById
  )
  .put(
    authorizeRoles("admin", "manager"),
    categoryUpdateValidator,
    validate,
    categoryController.update
  )
  .delete(authorizeRoles("admin"), categoryController.remove);

module.exports = router;
