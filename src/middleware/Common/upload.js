const multer = require("multer");
const CustomError = require("../../utils/Common/customError");

// Use RAM memory storage (zero local disk file creation)
const storage = multer.memoryStorage();

// File filter (accept images and PDF documents)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new CustomError(
        "Invalid file type. Only JPG, PNG, WEBP images and PDF documents are allowed.",
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size per file
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
