const express = require("express");
const router = express.Router();
const uploadController = require("../../controllers/Upload/upload");
const { protect } = require("../../middleware/Auth/auth");
const {
  uploadSingleFile,
  uploadMultipleFiles,
} = require("../../middleware/Common/upload");

// All upload routes require authentication
router.use(protect);

// Single file upload route (field name: 'file')
router.post("/single", uploadSingleFile, uploadController.uploadSingle);

// Multiple file upload route (field name: 'files', max 10 files)
router.post("/multiple", uploadMultipleFiles, uploadController.uploadMultiple);

module.exports = router;
