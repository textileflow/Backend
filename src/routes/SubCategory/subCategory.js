const express = require("express");
const router = express.Router();
const subCategoryController = require("../../controllers/SubCategory/subCategory");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");
const validate = require("../../middleware/Common/validate");
const { subCategoryValidator } = require("../../utils/SubCategory/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    subCategoryValidator,
    validate,
    subCategoryController.create
  )
  .get(
    authorizeRoles("admin", "manager", "staff"),
    subCategoryController.getAll
  );

router
  .route("/category/:categoryId")
  .get(
    authorizeRoles("admin", "manager", "staff"),
    subCategoryController.getByCategory
  );

router
  .route("/:id")
  .get(
    authorizeRoles("admin", "manager", "staff"),
    subCategoryController.getById
  )
  .put(
    authorizeRoles("admin", "manager"),
    subCategoryController.update
  )
  .delete(
    authorizeRoles("admin", "manager"),
    subCategoryController.remove
  );

module.exports = router;
