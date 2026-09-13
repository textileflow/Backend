const uploadService = require("../../services/Upload/upload");
const { sendSuccess } = require("../../utils/Common/apiResponse");

/**
 * @desc    Upload single file to Cloudinary under 'upload-single/' folder
 * @route   POST /api/upload/single
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const uploadSingle = async (req, res, next) => {
  try {
    const folder =
      (req.query && req.query.folder) ||
      (req.body && req.body.folder) ||
      "upload-single";
    const data = await uploadService.uploadSingle(req.file, folder);
    return sendSuccess(res, 200, "File uploaded successfully", data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload multiple files to Cloudinary under 'upload-multiple/' folder
 * @route   POST /api/upload/multiple
 * @access  Private (ADMIN, MANAGER, STAFF)
 */
const uploadMultiple = async (req, res, next) => {
  try {
    const folder =
      (req.query && req.query.folder) ||
      (req.body && req.body.folder) ||
      "upload-multiple";
    const data = await uploadService.uploadMultiple(req.files, folder);
    return sendSuccess(res, 200, "Files uploaded successfully", data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
};
