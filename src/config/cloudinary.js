const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file buffer directly to Cloudinary (RAM buffer, no local disk storage)
 * @param {Buffer} fileBuffer - Buffer from Multer memoryStorage
 * @param {String} folder - User-specific Cloudinary folder path (e.g. 'john_doe/upload-single/merchants/gst')
 * @returns {Promise<Object>} Object containing relative path and fullUrl
 */
const uploadToCloudinary = (fileBuffer, folder = "merchants") => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "your-cloud";
    const timestamp = Date.now();

    // If in test environment or Cloudinary credentials missing, return mock uploaded path & fullUrl
    if (
      process.env.NODE_ENV === "test" ||
      !process.env.CLOUDINARY_CLOUD_NAME
    ) {
      const mockRelativePath = `${folder}/${timestamp}.jpg`;
      return resolve({
        path: mockRelativePath,
        fullUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${mockRelativePath}`,
        public_id: `${folder}_mock_${timestamp}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);

        // Extract relative path after /image/upload/ (and version if present)
        let relativePath = result.secure_url;
        const match = result.secure_url.match(/image\/upload\/(?:v\d+\/)?(.+)$/);
        if (match) {
          relativePath = match[1];
        }

        resolve({
          path: relativePath,
          fullUrl: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
