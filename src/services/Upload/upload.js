const { uploadToCloudinary } = require("../../config/cloudinary");
const CustomError = require("../../utils/Common/customError");

class UploadService {
  /**
   * Upload a single file to Cloudinary with folder path 'upload-single/<filename>'
   * @param {Object} file - Express Multer file object
   * @param {String} folder - Folder name in Cloudinary (default: 'upload-single')
   */
  async uploadSingle(file, folder = "upload-single") {
    if (!file || !file.buffer) {
      throw new CustomError("Please select a file to upload", 400);
    }

    const folderPath = folder ? folder.replace(/^\/+|\/+$/g, "") : "upload-single";
    const result = await uploadToCloudinary(file.buffer, folderPath);

    return {
      path: result.path,
      fullUrl: result.fullUrl,
    };
  }

  /**
   * Upload multiple files to Cloudinary with folder path 'upload-multiple/<filename>'
   * @param {Array|Object} files - Array or Object of Express Multer file objects
   * @param {String} folder - Folder name in Cloudinary (default: 'upload-multiple')
   */
  async uploadMultiple(files = [], folder = "upload-multiple") {
    let fileList = [];
    if (Array.isArray(files)) {
      fileList = files;
    } else if (files && typeof files === "object") {
      fileList = Object.values(files).flat();
    }

    if (!fileList || fileList.length === 0) {
      throw new CustomError("Please select at least one file to upload", 400);
    }

    const folderPath = folder ? folder.replace(/^\/+|\/+$/g, "") : "upload-multiple";

    const uploadPromises = fileList.map((file) =>
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
