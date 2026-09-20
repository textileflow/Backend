const express = require("express");
const router = express.Router();
const subContractorController = require("../../../controllers/Plant/SubContractor/subContractor");
const { protect, authorizeRoles } = require("../../../middleware/Auth/auth");
const validate = require("../../../middleware/Common/validate");
const {
  subContractorValidator,
  subContractorStatusValidator,
} = require("../../../utils/Plant/SubContractor/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    subContractorValidator,
    validate,
    subContractorController.create
  )
  .get(
    authorizeRoles("admin", "manager", "staff"),
    subContractorController.getAll
  );

router
  .route("/:id/status")
  .patch(
    authorizeRoles("admin", "manager"),
    subContractorStatusValidator,
    validate,
    subContractorController.updateStatus
  )
  .put(
    authorizeRoles("admin", "manager"),
    subContractorStatusValidator,
    validate,
    subContractorController.updateStatus
  );

router
  .route("/:id")
  .get(
    authorizeRoles("admin", "manager", "staff"),
    subContractorController.getById
  )
  .put(authorizeRoles("admin", "manager"), subContractorController.update)
  .delete(authorizeRoles("admin"), subContractorController.remove);

module.exports = router;
