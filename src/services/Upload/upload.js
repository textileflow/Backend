const { uploadToCloudinary } = require("../../config/cloudinary");
const CustomError = require("../../utils/Common/customError");

/**
 * Helper to sanitize user name for clean Cloudinary folder naming
 * e.g., "Rajesh Patel" -> "rajesh_patel"
 */
const sanitizeUserName = (userName) => {
  if (!userName) return "default_user";
  return userName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_");
};

class UploadService {
  /**
   * Upload a single file to Cloudinary with User-wise dynamic folder structure
   * @param {Object} file - Express Multer file object
   * @param {String} userName - Logged in user name from req.user.name
   * @param {String} subFolder - Optional sub-folder (default: 'merchants/gst')
   */
  async uploadSingle(file, userName, subFolder = "merchants/gst") {
    if (!file || !file.buffer) {
      throw new CustomError("Please select a file to upload", 400);
    }

    const sanitizedUser = sanitizeUserName(userName);
    const folderPath = `${sanitizedUser}/upload-single/${subFolder.replace(/^\/+|\/+$/g, "")}`;

    const result = await uploadToCloudinary(file.buffer, folderPath);
    return {
      path: result.path,
      fullUrl: result.fullUrl,
    };
  }

  /**
   * Upload multiple files to Cloudinary with User-wise dynamic folder structure
   * @param {Array} files - Array of Express Multer file objects
   * @param {String} userName - Logged in user name from req.user.name
   * @param {String} subFolder - Optional sub-folder (default: 'merchants/documents')
   */
  async uploadMultiple(files = [], userName, subFolder = "merchants/documents") {
    if (!files || files.length === 0) {
      throw new CustomError("Please select at least one file to upload", 400);
    }

    const sanitizedUser = sanitizeUserName(userName);
    const folderPath = `${sanitizedUser}/upload-multiple/${subFolder.replace(/^\/+|\/+$/g, "")}`;

    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file.buffer, folderPath)
    );
    const results = await Promise.all(uploadPromises);

    return results.map((res) => ({
      path: res.path,
      fullUrl: res.fullUrl,
    }));
  }
}

module.exports = new UploadService();
