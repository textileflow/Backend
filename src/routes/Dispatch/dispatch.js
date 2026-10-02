const express = require("express");
const router = express.Router();
const dispatchController = require("../../controllers/Dispatch/dispatchController");
const { protect } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(dispatchController.create)
  .get(dispatchController.getAll);

router
  .route("/:id")
  .get(dispatchController.getById)
  .put(dispatchController.update)
  .delete(dispatchController.remove);

module.exports = router;
