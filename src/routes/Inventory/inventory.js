const express = require("express");
const router = express.Router();
const inventoryController = require("../../controllers/Inventory/inventoryController");
const { protect } = require("../../middleware/Auth/auth");

router.use(protect);

router
  .route("/")
  .post(inventoryController.create)
  .get(inventoryController.getAll);

router
  .route("/:id")
  .get(inventoryController.getById)
  .put(inventoryController.update)
  .delete(inventoryController.remove);

module.exports = router;
