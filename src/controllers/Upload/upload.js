const uploadService = require("../../services/Upload/upload");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * @desc    Upload single file to Cloudinary under logged-in user folder
 * @route   POST /api/upload/single
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const uploadSingle = async (req, res, next) => {
  try {
    const userName = req.user ? req.user.name : "default_user";
    const subFolder = req.query.folder || req.body.folder || "merchants/gst";

    const data = await uploadService.uploadSingle(
      req.file,
      userName,
      subFolder
    );
    return sendSuccess(res, 200, "File uploaded successfully", data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload multiple files to Cloudinary under logged-in user folder
 * @route   POST /api/upload/multiple
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const uploadMultiple = async (req, res, next) => {
  try {
    const userName = req.user ? req.user.name : "default_user";
    const subFolder = req.query.folder || req.body.folder || "merchants/documents";

    const data = await uploadService.uploadMultiple(
      req.files,
      userName,
      subFolder
    );
    return sendSuccess(res, 200, "Files uploaded successfully", data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
};
