const express = require("express");
const router = express.Router();
const designController = require("../../controllers/Design/design");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");
const validate = require("../../middleware/Common/validate");
const { uploadDesignModuleFields } = require("../../middleware/Common/upload");
const {
  createDesignValidator,
  updateDesignValidator,
  designStatusValidator,
} = require("../../utils/Design/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    uploadDesignModuleFields,
    createDesignValidator,
    validate,
    designController.create
  )
  .get(authorizeRoles("admin", "manager", "staff"), designController.getAll);

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    designStatusValidator,
    validate,
    designController.updateStatus
  )
  .put(
    authorizeRoles("admin", "manager"),
    designStatusValidator,
    validate,
    designController.updateStatus
  );

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), designController.getById)
  .put(
    authorizeRoles("admin", "manager"),
    uploadDesignModuleFields,
    updateDesignValidator,
    validate,
    designController.update
  )
  .delete(authorizeRoles("admin", "manager"), designController.remove);

module.exports = router;
