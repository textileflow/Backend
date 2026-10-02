const express = require("express");
const router = express.Router();
const productionController = require("../../controllers/Production/productionController");
const { protect } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(productionController.create)
  .get(productionController.getAll);

router
  .route("/:id")
  .get(productionController.getById)
  .put(productionController.update)
  .delete(productionController.remove);

module.exports = router;
