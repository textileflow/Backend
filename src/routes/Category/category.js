const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/Category/category");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");
const validate = require("../../middleware/Common/validate");
const { categoryValidator } = require("../../utils/Category/validators");

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
  .get(authorizeRoles("admin", "manager", "staff"), categoryController.getAll);

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), categoryController.getById)
  .put(
    authorizeRoles("admin", "manager"),
    categoryValidator,
    validate,
    categoryController.update
  )
  .delete(
    authorizeRoles("admin", "manager"),
    categoryController.remove
  );

module.exports = router;
