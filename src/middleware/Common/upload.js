const multer = require("multer");
const CustomError = require("../../utils/Common/customError");

// Use RAM memory storage (zero local disk file creation)
const storage = multer.memoryStorage();

// Allow all file types (Images, PDFs, Word documents, Excel sheets, ZIP, Text, etc.)
const fileFilter = (req, file, cb) => {
  cb(null, true);
};

// Vercel Serverless Functions enforce a strict 4.5 MB request body limit.
// We set file size limit to 4 MB per file to prevent Vercel FUNCTION_PAYLOAD_TOO_LARGE error.
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4 MB max per file (Vercel max payload limit is 4.5 MB)
  },
});

// Single file upload middleware (field name: 'file')
const uploadSingleFile = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new CustomError(
            "File size too large. Maximum allowed file size is 4 MB for Vercel serverless deployment.",
            400
          )
        );
      }
      return next(new CustomError(err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

// Multiple file upload middleware (field name: 'files', max 5 files, total < 4.5MB)
const uploadMultipleFiles = (req, res, next) => {
  upload.array("files", 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new CustomError(
            "One or more files exceed the 4 MB limit. Please ensure total upload payload is under 4.5 MB.",
            400
          )
        );
      }
      return next(new CustomError(err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

module.exports = {
  upload,
  uploadSingleFile,
  uploadMultipleFiles
};
