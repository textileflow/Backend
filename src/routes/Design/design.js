const express = require("express");
const router = express.Router();
const designController = require("../../controllers/Design/design");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");
const validate = require("../../middleware/Common/validate");
const {
  designValidator,
  designVersionValidator,
} = require("../../utils/Design/validators");
const { uploadDesignFields } = require("../../middleware/Common/upload");

// All routes require authentication
router.use(protect);

// Dashboard stats route
router.get(
  "/dashboard",
  authorizeRoles("admin", "manager", "staff"),
  designController.getDashboard
);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    uploadDesignFields,
    designValidator,
    validate,
    designController.create
  )
  .get(authorizeRoles("admin", "manager", "staff"), designController.getAll);

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), designController.getById)
  .delete(authorizeRoles("admin"), designController.remove);

// Create New Version for Design (V2, V3...)
router.post(
  "/:id/versions",
  authorizeRoles("admin", "manager"),
  uploadDesignFields,
  designVersionValidator,
  validate,
  designController.createVersion
);

// Workflow Approval Status update (Draft -> Sampling -> Approved)
router.patch(
  "/:id/status",
  authorizeRoles("admin", "manager"),
  designController.updateStatus
);

// Job Card Data Extraction route for downstream production
router.get(
  "/:id/job-card",
  authorizeRoles("admin", "manager", "staff"),
  designController.getJobCardData
);

module.exports = router;
