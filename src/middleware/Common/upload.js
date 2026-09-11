const multer = require("multer");

// Use RAM memory storage (zero local disk file creation)
const storage = multer.memoryStorage();

// Allow all file types (Images, PDFs, Word documents, Excel sheets, ZIP, Text, etc.)
const fileFilter = (req, file, cb) => {
  // Accept all incoming files
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size per file
  },
});

// Single file upload middleware (field name: 'file')
const uploadSingleFile = upload.single("file");

// Multiple file upload middleware (field name: 'files', max 10 files)
const uploadMultipleFiles = upload.array("files", 10);

// Merchant specific GST & PAN file upload middleware
const uploadMerchantFiles = upload.fields([
  { name: "gstCertificate", maxCount: 1 },
  { name: "panCardImage", maxCount: 1 },
]);

module.exports = {
  upload,
  uploadSingleFile,
  uploadMultipleFiles,
  uploadMerchantFiles,
};
