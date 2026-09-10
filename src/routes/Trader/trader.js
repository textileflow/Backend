const express = require("express");
const router = express.Router();
const traderController = require("../../controllers/Trader/trader");
const { protect, authorizeRoles } = require("../../middleware/Auth/auth");
const validate = require("../../middleware/Common/validate");
const { traderValidator } = require("../../utils/Trader/validators");

// All routes require authentication
router.use(protect);

router
  .route("/")
  .post(
    authorizeRoles("admin", "manager"),
    traderValidator,
    validate,
    traderController.create
  )
  .get(authorizeRoles("admin", "manager", "staff"), traderController.getAll);

router
  .route("/:id")
  .get(authorizeRoles("admin", "manager", "staff"), traderController.getById)
  .put(authorizeRoles("admin", "manager"), traderController.update)
  .delete(authorizeRoles("admin", "manager"), traderController.remove);

module.exports = router;
